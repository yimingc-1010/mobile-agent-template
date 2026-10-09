# Mobile Agent Template

用來開始「由 agent 端到端開發雙平台 App」專案的 template repo。流程規範見 [`docs/process.md`](docs/process.md)，agent 的進入點是 [`CLAUDE.md`](CLAUDE.md)。

## 內容

| 路徑 | 用途 |
| --- | --- |
| `apps/mobile/` | Expo SDK 57 App（Expo Router、dev client、Jest + RNTL） |
| `packages/core/` | 純 TS 領域邏輯與 port（Vitest，覆蓋率門檻 80%） |
| `e2e/maestro/` | Maestro flows，一個 user story 一個檔案 |
| `fixtures/` | 測試資料與回放檔 |
| `docs/` | 流程、PRD、ADR、設計、實機測試腳本、agent 實驗紀錄 |
| `.claude/` | 六個角色的 skill、reviewer subagent、hooks、權限設定 |
| `.github/` | 票與 bug 範本、PR 範本、CODEOWNERS |
| `scripts/setup-labels.sh` | 建立 label 狀態機 |

## 從 template 建立新專案

1. 在 GitHub 以此 repo 為 template 建立新 repo，clone 下來後執行 `npm install`。
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

修改受保護路徑（`.claude/`、`CLAUDE.md`、`docs/process.md`、workflows、`eas.json`）時，以 `CLAUDE_ALLOW_PROTECTED_EDITS=1 claude` 啟動 Claude Code。

## 常用指令

```bash
npm run verify                        # typecheck + lint + test + format check
npm run format                        # 自動排版
npm run start:fakes -w @app/mobile    # 以 fake services 啟動 dev server
maestro test e2e/maestro              # E2E
```

## 尚未包含（流程第 2 步）

- `.github/workflows/`：CI（T1–T3）、agent 調度（implement、review）、auto-merge、QA、release
- 原生層 fingerprint 快取與 dev client 的 e2e 連線方式（見 `e2e/README.md`）
