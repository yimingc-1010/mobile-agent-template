# Agent CI 設定

讓 `docs/process.md` 的「Agent 協作機制」在 GitHub Actions 上自動運轉。以下設定全部由人類完成一次；agent 不經手任何金鑰。平台的 e2e 與發布 workflow 另見 `docs/platform.md`。

## Workflow 一覽

| Workflow | 擁有者 | 觸發 | 執行身分 | 做什麼 |
| --- | --- | --- | --- | --- |
| `verify.yml`（Verify） | base | PR、push main | `GITHUB_TOKEN` | T1：`npm run verify`、core 覆蓋率、`npm audit`、gitleaks |
| `agent-implement.yml` | base | issue 被受信任的帳號加上 `ready`；reviewer bot 要求修改 | author App | Implementer：實作並開 PR，或依 review 修正 |
| `agent-review.yml` | base | 受信任作者的 PR 開啟或更新 | reviewer App | 等 required checks 跑完，Reviewer 審查；核准後開啟 auto-merge |
| `agent-qa.yml` | base | main 上 Verify 或 E2E 失敗 | author App | QA：分類失敗原因並開票 |
| `agent-escalate.yml` | base | 加上 `blocked`、`needs-human`、`needs-spec`、`needs-design` | `GITHUB_TOKEN` | 指派並 @ 人類 owner |
| `ci-*.yml`（E2E）、`release-*.yml` | 平台 | 見 `docs/platform.md` | 依平台 | T2/T3 e2e、預發布 |

## 為什麼需要兩個 GitHub App

- 用 `GITHUB_TOKEN` 建立的 PR、push、label 不會觸發其他 workflow，agent 之間就無法接力。App token 產生的事件會觸發。
- PR 作者不能核准自己的 PR。Implementer（author App）和 Reviewer（reviewer App）必須是不同身分，branch protection 的「需要 1 個核准」才有意義。
- 兩個 App 都**不給** Workflows 權限：agent 無法修改 `.github/workflows/`。

## 1. 建立 GitHub App（兩個）

**用腳本（建議）**：在 repo 根目錄執行

```bash
node scripts/create-agent-apps.mjs --repo <owner>/<repo>
```

腳本會開啟本機頁面，你在 GitHub 上各按一次「Create GitHub App」（GitHub 沒有用 token 建立 App 的 API），其餘自動完成：以 App Manifest 設定下表的權限、把 private key 存到 `~/.config/agent-ci/`（權限 600）、設定第 2 步的 App secrets 與四個 variables。金鑰不會印出。App 建立一次即可，之後的 repo 只要再以 `--repo` 執行，就會沿用已存的 App。最後仍需點開腳本印出的連結，把兩個 App 安裝到 repo，並自行設定模型的 secret。

**手動**：在 GitHub → Settings → Developer settings → GitHub Apps → New GitHub App，各建立一個：

| 設定 | author App（例：`<名稱>-agent`） | reviewer App（例：`<名稱>-reviewer`） |
| --- | --- | --- |
| Webhook | 取消勾選 Active | 取消勾選 Active |
| Contents | Read and write | Read and write（auto-merge 需要） |
| Issues | Read and write | Read and write |
| Pull requests | Read and write | Read and write |
| Actions | Read-only（QA 讀取失敗的 log） | Read-only |
| Checks、Commit statuses | Read-only | Read-only |
| Workflows | No access | No access |
| Where can this App be installed | Only on this account | Only on this account |

建立後：

1. 記下 **Client ID**，按 Generate a private key 下載 `.pem`。
2. Install App → 只選要使用的 repo。
3. 記下 bot 帳號名稱：`<app-slug>[bot]`。

## 2. Secrets 與 variables

```bash
gh secret set AGENT_APP_CLIENT_ID
gh secret set AGENT_APP_PRIVATE_KEY < path/to/agent.private-key.pem
gh secret set REVIEWER_APP_CLIENT_ID
gh secret set REVIEWER_APP_PRIVATE_KEY < path/to/reviewer.private-key.pem
gh secret set ANTHROPIC_API_KEY            # 或改設 CLAUDE_CODE_OAUTH_TOKEN（claude setup-token 產生）
```

| Variable | 範例 | 用途 |
| --- | --- | --- |
| `AGENT_TRIGGER_ACTORS` | `yimingc-1010,my-agent[bot]` | 誰加的 `ready` 會啟動 Implementer（逗號分隔，不留空白） |
| `AGENT_PR_AUTHORS` | `yimingc-1010,my-agent[bot]` | 誰開的 PR 會由 Reviewer 審查 |
| `REVIEWER_BOT_LOGIN` | `my-reviewer[bot]` | 只有這個帳號的「要求修改」會啟動 Implementer |
| `HUMAN_OWNER` | `yimingc-1010` | escalate 時指派的人（預設 repo owner） |
| `IMPLEMENTER_MODEL` | `claude-opus-5-5` | 選填，預設值如左 |
| `REVIEWER_MODEL` | `claude-sonnet-5-5` | 選填；刻意與 Implementer 不同 |
| `QA_MODEL` | `claude-sonnet-5-5` | 選填 |
| `AGENT_MAX_BUDGET_USD` | `10` | 選填；每次 agent 執行的花費上限 |

```bash
gh variable set AGENT_TRIGGER_ACTORS --body "<you>,<agent-slug>[bot]"
gh variable set AGENT_PR_AUTHORS --body "<you>,<agent-slug>[bot]"
gh variable set REVIEWER_BOT_LOGIN --body "<reviewer-slug>[bot]"
gh variable set HUMAN_OWNER --body "<you>"
```

## 3. Repo 設定與 branch protection

```bash
gh repo edit --enable-auto-merge --enable-squash-merge --enable-merge-commit=false \
  --enable-rebase-merge=false --delete-branch-on-merge
```

main 的 branch protection（Settings → Branches，或 Rulesets）：

- Require a pull request before merging；Require approvals：1；Dismiss stale approvals
- Require review from Code Owners（`CODEOWNERS` 列出的路徑必須由人類核准）
- Require status checks：`verify`、`audit`、`secrets`，加上平台列出的 e2e checks（見 `docs/platform.md`）
- Block force pushes；不允許繞過規則

## 運作方式與限制

- **成本控制**：每次 agent 執行有 `AGENT_MAX_BUDGET_USD` 上限與 job timeout；同一張票或 PR 同時只跑一個 Implementer。
- **防 prompt injection**：prompt 只帶 issue/PR 編號，不帶任何內文；Reviewer 與修正中的 Implementer 一律使用預設分支的 `.claude/` 與 `CLAUDE.md`，PR 無法改變自己的審查規則；只審查 `AGENT_PR_AUTHORS` 列出的作者，不處理 fork。
- **權限**：每個 agent 以 `--permission-mode dontAsk` 搭配明確的工具 allowlist 執行；Reviewer 與 QA 沒有寫檔權限。
- **對外連線**：`harden-runner` 目前是 `audit` 模式，只記錄連線。觀察幾次執行後，把實際需要的 endpoint 填入 `allowed-endpoints` 並改成 `block`。
- **review 輪數**：Reviewer 要求修改超過 3 輪時，workflow 直接標記 `needs-human`，不再啟動 Implementer。
- **T2 在 agent job 中**：Implementer 跑在一般 Linux runner，T2 若需要模擬器或特定瀏覽器就略過，交由 PR 後的 CI 關卡。
- **尚未自動化**：PM、Architect、Release agent 由人類以 skill 啟動；依賴合併後自動加上 `ready` 也尚未實作。
- **`npm audit`**：critical 擋合併；high 只在 job summary 報告。行動平台目前的工具鏈（Expo、Jest）有無法直接修正的 high 等級傳遞依賴。

## 第一次驗證

1. 開一張很小的票（例如修改一段文字）並加上 `ready`。
2. 確認依序發生：Agent · Implement 開 PR → Verify 與平台 checks → Agent · Review 核准 → auto-merge → main 上的 checks。
3. 每個 agent 的完整紀錄在該次 run 的 artifacts（`implementer-*`、`reviewer-*`、`qa-*`），結果摘要在 job summary。
