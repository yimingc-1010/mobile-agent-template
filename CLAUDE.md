# CLAUDE.md

由 agent 依 `docs/process.md` 端到端開發的產品 repo。平台相關的技術棧、程式碼位置與指令，見本檔最後匯入的 `docs/platform.md`。開始任何工作前，先確認你被指派的角色，並載入對應的 skill。

## 角色與 skill

| 角色 | Skill | 何時使用 |
| --- | --- | --- |
| PM | `/pm` | 撰寫或修改 `docs/prd.md` |
| Architect | `/architect` | 設計（ADR、`docs/design/`）與拆票 |
| Implementer | `/implement` | 實作一張 GitHub issue |
| Reviewer | `/review` | 審查一個 PR（不修改程式碼） |
| QA | `/qa` | 回歸測試、維護 e2e 與 fixtures、回報 bug |
| Release | `/release` | 預發布、release notes、發布素材（由平台提供） |

沒有被指派角色時，不要開始實作；先詢問。

## 文件地圖

- `docs/process.md`：流程、閘門、label 狀態機、例外處理（流程的 source of truth，與平台無關）
- `docs/platform.md`：本 repo 的平台設定：技術棧、程式碼位置、測試配置、發布管道
- `docs/template.md`：base 與平台 template 的分層、檔案所有權、同步方式
- `docs/prd.md`：需求與 user stories（US-NN）
- `docs/adr/`：技術決策；`docs/design/`：領域模型、模組、畫面
- `docs/agent-log.md`：人類介入與回顧紀錄
- `.github/ISSUE_TEMPLATE/ticket.md`：票的格式

## 程式碼地圖

- `packages/core/`：純 TypeScript 領域邏輯，不得 import 任何 UI 框架或平台 API。外部依賴的 port 放在 `src/ports/`。
- `apps/`：平台應用程式，結構見 `docs/platform.md`。
- `e2e/`：端到端測試，一個 user story 一個檔案，檔名以 `us-NN-<slug>` 開頭；工具見 `docs/platform.md`。
- `fixtures/`：測試資料與回放檔。

## 指令（所有平台共用的 script 契約）

```bash
npm install                    # 安裝所有 workspace
npm run verify                 # T1：typecheck + lint + test + format check（完成任何程式碼變更前必跑）
npm run format                 # 自動排版
npm run e2e                    # 全部 e2e
npm run e2e:one -- <file>      # 單一 e2e 檔案
```

平台專屬指令見 `docs/platform.md`。

## 規則

- 驗收標準先寫成會失敗的測試，再實作。
- 新的外部依賴（時間、定位、網路、儲存、感測器…）必須先在 `packages/core/src/ports/` 定義 port，並提供 fake 實作，再到平台的 service registry 註冊（位置見 `docs/platform.md`）。UI 不得直接使用 real 實作。
- e2e 以穩定的識別方式選取元素（見 `docs/platform.md`），不以畫面文字選取。
- 不修改票上「檔案範圍」以外的檔案。
- 需求不清就停下來提問並標記 `needs-spec`，不要自行假設。同一個問題失敗 3 次就標記 `blocked`。

## 受保護路徑

以下路徑由 `.claude/hooks/protect-paths.sh` 阻擋修改，變更必須開票並由人類執行：

`.github/workflows/`、`.github/CODEOWNERS`、`.claude/settings.json`、`.claude/hooks/`、`.claude/skills/`、`.claude/agents/`、`.claude/protected-paths.platform`、`CLAUDE.md`、`docs/process.md`、`docs/platform.md`、`docs/template.md`，以及 `.claude/protected-paths.platform` 列出的平台路徑。

## 永遠不做

- 讀取、輸入或印出任何金鑰、密碼、`.env` 內容
- `git push --force`、合併自己的 PR
- 正式發布：商店送審、production 部署（平台指令見 `docs/platform.md`）
- 刪除或跳過測試、放寬斷言來讓檢查通過

---

@docs/platform.md
