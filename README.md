# Mobile Agent Template

用來開始「由 agent 端到端開發 iOS + Android App」專案的平台 template，衍生自 [agent-template-base](https://github.com/yimingc-1010/agent-template-base)。

- 流程規範（與平台無關）：[`docs/process.md`](docs/process.md)
- 本平台設定：[`docs/platform.md`](docs/platform.md)
- Template 分層、檔案所有權與同步方式：[`docs/template.md`](docs/template.md)
- Agent 的進入點：[`CLAUDE.md`](CLAUDE.md)

## 內容

| 路徑 | 來源 | 用途 |
| --- | --- | --- |
| `apps/mobile/` | 平台 | Expo SDK 57 App（Expo Router、dev client、Jest + RNTL） |
| `e2e/maestro/` | 平台 | Maestro flows，一個 user story 一個檔案 |
| `docs/platform.md`、`docs/adr/001-tech-stack.md`、`docs/qa/` | 平台 | 平台設定、技術選型、人工驗收腳本 |
| `.claude/skills/release/`、`.claude/protected-paths.platform` | 平台 | 發布 skill、平台受保護路徑 |
| `packages/core/` | base | 純 TS 領域邏輯與 port（Vitest，覆蓋率門檻 80%） |
| `.claude/`（其餘） | base | 五個角色 skill、reviewer subagent、hooks |
| `.github/`、`scripts/` | base（+ 平台 labels） | 票與 bug 範本、PR 範本、CODEOWNERS、label 狀態機 |
| `docs/`（其餘） | base | 流程、PRD、ADR、設計範本、agent 實驗紀錄 |

## 從 template 建立新專案

建議保留與 template 的 git 關聯，之後才能同步 template 的更新（見 `docs/template.md`）：

```bash
git clone git@github.com-yimingc1990:yimingc-1010/mobile-agent-template.git <name>
cd <name>
git remote rename origin template
gh repo create yimingc-1010/<name> --private
git remote add origin git@github.com-yimingc1990:yimingc-1010/<name>.git
git push -u origin main
```

接著：

1. `npm install`
2. 替換佔位值：

   | 檔案 | 欄位 |
   | --- | --- |
   | `apps/mobile/app.json` | `name`、`slug`、`scheme`、`ios.bundleIdentifier`、`android.package` |
   | `e2e/maestro/*.yaml` | `appId`（與 bundle id 相同） |
   | `.github/CODEOWNERS` | `@OWNER` |
   | `package.json` | `name` |

3. 建立 labels：`scripts/setup-labels.sh`（需要已登入的 `gh`）。
4. 在 GitHub 設定 main 的 branch protection：要求 PR、要求 status checks、要求 Code Owners review、只允許 squash merge、禁止 force push。
5. 連結 EAS 專案：`cd apps/mobile && npx eas-cli@latest init`。
6. 確認一切正常：`npm run verify`。

修改受保護路徑時，以 `CLAUDE_ALLOW_PROTECTED_EDITS=1 claude` 啟動 Claude Code。

## CI

| Workflow | 來源 | 用途 |
| --- | --- | --- |
| `verify.yml`（Verify） | base | T1：verify、覆蓋率、npm audit、gitleaks |
| `agent-*.yml` | base | Implementer、Reviewer + auto-merge、QA、escalate |
| `ci-e2e.yml`（E2E） | 平台 | T2 Android 模擬器、T3 iOS 模擬器上的 Maestro |
| `release-preview.yml` | 平台 | tag `v*` → EAS build → TestFlight / Play 內部測試 |

啟用前要先完成 `docs/agent-ci.md`（GitHub App、secrets、branch protection）與 `docs/platform.md` 的「一次性設定」（`EXPO_TOKEN`、`eas.json` 的 submit 設定）。

## 尚未包含

- 以 fingerprint 沿用 dev client、跳過 native build（見 `docs/platform.md`「驗證分層」）
- PM、Architect、Release agent 的自動觸發（目前由人類以 skill 啟動）
