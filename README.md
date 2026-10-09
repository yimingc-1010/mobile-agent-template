# Agent Template Base

「由 agent 端到端開發產品」的平台無關 base。不直接用來開發產品；每個平台 template（例如 [mobile-agent-template](https://github.com/yimingc-1010/mobile-agent-template)）從這裡衍生，並透過 git merge 同步更新。

- 流程規範：[`docs/process.md`](docs/process.md)
- 分層、檔案所有權、script 契約、同步方式、如何建立新平台 template：[`docs/template.md`](docs/template.md)
- Agent 的進入點：[`CLAUDE.md`](CLAUDE.md)（會匯入平台提供的 `docs/platform.md`）

## 內容

| 路徑 | 用途 |
| --- | --- |
| `docs/process.md` | 平台無關的流程：七個階段、閘門、角色、label 狀態機、驗證分層、例外處理 |
| `docs/template.md` | base 與平台 template 的分工 |
| `.claude/skills/` | `pm`、`architect`、`implement`、`review`、`qa` 五個角色（`release` 由平台提供） |
| `.claude/hooks/` | Stop hook 強制 `npm run verify`；PreToolUse hook 保護流程檔案，並讀取平台的 `.claude/protected-paths.platform` |
| `.claude/agents/reviewer.md` | 獨立 context 的 reviewer subagent |
| `.github/` | 票、bug、PR 範本，CODEOWNERS |
| `scripts/setup-labels.sh` | 建立 label 狀態機，並執行平台的 `setup-labels.platform.sh` |
| `packages/core/` | 純 TS 領域邏輯與 port/fake 範例（Vitest，覆蓋率門檻 80%） |
| `docs/` 其餘 | PRD、ADR、設計、agent 實驗紀錄範本 |

## 開發 base 本身

```bash
npm install
npm run verify
```

`npm run e2e` 在 base 中會刻意失敗：e2e 由平台 template 實作。

修改受保護路徑時，以 `CLAUDE_ALLOW_PROTECTED_EDITS=1 claude` 啟動 Claude Code。修改後，到各平台 template 執行 `git fetch base && git merge base/main` 同步。
