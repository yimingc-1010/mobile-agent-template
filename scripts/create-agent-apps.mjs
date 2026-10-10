#!/usr/bin/env node
// Creates the two GitHub Apps used by the agent workflows (docs/agent-ci.md) through the
// GitHub App Manifest flow, then stores their credentials as repository secrets.
//
//   node scripts/create-agent-apps.mjs [--repo owner/name] [--prefix name] [--port 8976]
//
// - GitHub has no API to create an App with a user token: you click "Create GitHub App"
//   once per App in the browser. Everything else is automated.
// - Private keys are written to ~/.config/agent-ci/ (mode 600) and piped straight into
//   `gh secret set`; they are never printed.
// - Re-running reuses Apps already saved in ~/.config/agent-ci/, so you can create the
//   Apps once and later run with --repo for each product repo.
// - Installing an App on a repository still needs your click; the script opens the page.

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { join } from 'node:path';

const API = process.env.GITHUB_API_URL || 'https://api.github.com';
const WEB = process.env.GITHUB_WEB_URL || 'https://github.com';
const STORE = process.env.AGENT_CI_STORE || join(homedir(), '.config', 'agent-ci');

const ROLES = {
  author: {
    suffix: 'agent',
    description: 'Implementer and QA agents: opens PRs, pushes branches, manages labels.',
    secretPrefix: 'AGENT_APP',
  },
  reviewer: {
    suffix: 'reviewer',
    description: 'Reviewer agent: reviews and approves PRs, enables auto-merge.',
    secretPrefix: 'REVIEWER_APP',
  },
};

// Both Apps get the same permissions (docs/agent-ci.md). No Workflows permission:
// agents cannot change .github/workflows/.
const PERMISSIONS = {
  contents: 'write',
  issues: 'write',
  pull_requests: 'write',
  actions: 'read',
  checks: 'read',
  statuses: 'read',
  metadata: 'read',
};

function parseArgs(argv) {
  const args = { port: 8976 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo') args.repo = argv[++i];
    else if (a === '--prefix') args.prefix = argv[++i];
    else if (a === '--port') args.port = Number(argv[++i]);
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

function gh(args, { input } = {}) {
  const r = spawnSync('gh', args, { input, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`gh ${args[0]} ${args[1] ?? ''} failed: ${r.stderr.trim()}`);
  return r.stdout.trim();
}

function savedApp(role) {
  const meta = join(STORE, `${role}.json`);
  const pem = join(STORE, `${role}.pem`);
  if (!existsSync(meta) || !existsSync(pem)) return null;
  return { ...JSON.parse(readFileSync(meta, 'utf8')), pemPath: pem };
}

function saveApp(role, app) {
  mkdirSync(STORE, { recursive: true, mode: 0o700 });
  const pemPath = join(STORE, `${role}.pem`);
  writeFileSync(pemPath, app.pem, { mode: 0o600 });
  chmodSync(pemPath, 0o600);
  const meta = { id: app.id, slug: app.slug, client_id: app.client_id, html_url: app.html_url };
  writeFileSync(join(STORE, `${role}.json`), JSON.stringify(meta, null, 2) + '\n', { mode: 0o600 });
  return { ...meta, pemPath };
}

function manifest(role, prefix, port, homepage) {
  const r = ROLES[role];
  return {
    name: `${prefix}-${r.suffix}`.slice(0, 34),
    url: homepage,
    description: r.description,
    public: false,
    hook_attributes: { url: 'https://example.invalid/agent-ci-webhook', active: false },
    redirect_url: `http://127.0.0.1:${port}/callback`,
    default_permissions: PERMISSIONS,
    default_events: [],
  };
}

const escapeHtml = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

function page(title, body) {
  return `<!doctype html><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font:16px system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.5}
button{font:inherit;padding:8px 16px;cursor:pointer}code{background:#f3f3f3;padding:1px 4px}</style>
<h1>${escapeHtml(title)}</h1>${body}`;
}

async function createApps(missing, prefix, port, homepage) {
  const states = new Map(missing.map((role) => [randomBytes(16).toString('hex'), role]));
  const created = {};

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');

      if (url.pathname === '/') {
        const forms = [...states]
          .filter(([, role]) => !created[role])
          .map(([state, role]) => {
            const m = escapeHtml(JSON.stringify(manifest(role, prefix, port, homepage)));
            return `<form method="post" action="${WEB}/settings/apps/new?state=${state}">
<input type="hidden" name="manifest" value="${m}">
<p><button type="submit">建立 ${escapeHtml(ROLES[role].suffix)} App</button>
<code>${escapeHtml(manifest(role, prefix, port, homepage).name)}</code></p></form>`;
          })
          .join('');
        res.end(
          page(
            '建立 agent 的 GitHub Apps',
            forms
              ? `<p>逐一按下按鈕，在 GitHub 頁面上按「Create GitHub App」。完成後會回到這裡。</p>${forms}`
              : '<p>全部完成，可以關閉這個頁面。</p>',
          ),
        );
        return;
      }

      if (url.pathname === '/callback') {
        const role = states.get(url.searchParams.get('state') ?? '');
        const code = url.searchParams.get('code');
        if (!role || !code || !/^[\w-]+$/.test(code)) {
          res.statusCode = 400;
          res.end(
            page('無效的回呼', '<p>state 或 code 不正確，請回到 <a href="/">首頁</a> 重試。</p>'),
          );
          return;
        }
        try {
          const r = await fetch(`${API}/app-manifests/${code}/conversions`, {
            method: 'POST',
            headers: { Accept: 'application/vnd.github+json' },
          });
          if (!r.ok) throw new Error(`conversion failed: HTTP ${r.status}`);
          created[role] = saveApp(role, await r.json());
          console.log(`✓ Created ${created[role].slug} (client ID ${created[role].client_id})`);
          const remaining = missing.filter((x) => !created[x]);
          res.end(
            page(
              `已建立 ${created[role].slug}`,
              remaining.length
                ? '<p><a href="/">回到首頁，建立下一個 App</a></p>'
                : '<p>全部完成，可以關閉這個頁面並回到終端機。</p>',
            ),
          );
          if (!remaining.length) server.close(() => resolve(created));
        } catch (err) {
          res.statusCode = 500;
          res.end(
            page(
              '轉換失敗',
              `<p>${escapeHtml(String(err.message))}</p><p><a href="/">重試</a></p>`,
            ),
          );
        }
        return;
      }

      res.statusCode = 404;
      res.end(page('Not found', ''));
    });

    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const local = `http://127.0.0.1:${port}/`;
      console.log(`Open ${local} and create the Apps in your browser.`);
      if (!process.env.AGENT_CI_NO_OPEN) {
        spawnSync(process.platform === 'darwin' ? 'open' : 'xdg-open', [local]);
      }
    });
  });
}

function configureRepo(repo, apps, login) {
  for (const [role, app] of Object.entries(apps)) {
    const prefix = ROLES[role].secretPrefix;
    gh(['secret', 'set', `${prefix}_CLIENT_ID`, '--repo', repo], { input: app.client_id });
    gh(['secret', 'set', `${prefix}_PRIVATE_KEY`, '--repo', repo], {
      input: readFileSync(app.pemPath, 'utf8'),
    });
  }
  const authorBot = `${apps.author.slug}[bot]`;
  const variables = {
    AGENT_TRIGGER_ACTORS: `${login},${authorBot}`,
    AGENT_PR_AUTHORS: `${login},${authorBot}`,
    REVIEWER_BOT_LOGIN: `${apps.reviewer.slug}[bot]`,
    HUMAN_OWNER: login,
  };
  for (const [name, value] of Object.entries(variables)) {
    gh(['variable', 'set', name, '--body', value, '--repo', repo]);
  }
  console.log(
    `✓ Set secrets AGENT_APP_*, REVIEWER_APP_* and variables ${Object.keys(variables).join(', ')} on ${repo}`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      readFileSync(new URL(import.meta.url))
        .toString()
        .split('\n')
        .slice(1, 15)
        .join('\n'),
    );
    return;
  }

  const login = gh(['api', 'user', '--jq', '.login']);
  const prefix = args.prefix || login;
  const homepage = args.repo ? `${WEB}/${args.repo}` : `${WEB}/${login}`;

  const apps = {};
  const missing = [];
  for (const role of Object.keys(ROLES)) {
    const saved = savedApp(role);
    if (saved) {
      apps[role] = saved;
      console.log(`• Reusing ${saved.slug} from ${STORE}`);
    } else {
      missing.push(role);
    }
  }
  if (missing.length) Object.assign(apps, await createApps(missing, prefix, args.port, homepage));

  if (args.repo) configureRepo(args.repo, apps, login);

  console.log('\nNext steps:');
  for (const app of Object.values(apps)) {
    console.log(`  - Install ${app.slug} on the repo: ${WEB}/apps/${app.slug}/installations/new`);
  }
  if (args.repo) {
    console.log(`  - Model credentials (choose one):`);
    console.log(`      gh secret set ANTHROPIC_API_KEY --repo ${args.repo}`);
    console.log(
      `      gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo ${args.repo}   # from: claude setup-token`,
    );
    console.log(`  - Branch protection and repo settings: docs/agent-ci.md, step 3`);
  } else {
    console.log('  - Run again with --repo owner/name to store the credentials on a repository.');
  }
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
