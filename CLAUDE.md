# CLAUDE.md

雙平台（iOS + Android）行動 App，由 agent 依 `docs/process.md` 端到端開發。開始任何工作前，先確認你被指派的角色，並載入對應的 skill。

## 角色與 skill

| 角色 | Skill | 何時使用 |
| --- | --- | --- |
| PM | `/pm` | 撰寫或修改 `docs/prd.md` |
| Architect | `/architect` | 設計（ADR、`docs/design/`）與拆票 |
| Implementer | `/implement` | 實作一張 GitHub issue |
| Reviewer | `/review` | 審查一個 PR（不修改程式碼） |
| QA | `/qa` | 回歸測試、維護 e2e 與 fixtures、回報 bug |
| Release | `/release` | 內測 build、release notes、商店素材 |

沒有被指派角色時，不要開始實作；先詢問。

## 文件地圖

- `docs/process.md`：流程、閘門、label 狀態機、例外處理（流程的 source of truth）
- `docs/prd.md`：需求與 user stories（US-NN）
- `docs/adr/`：技術決策；`docs/design/`：領域模型、模組、畫面
- `docs/agent-log.md`：人類介入與回顧紀錄
- `.github/ISSUE_TEMPLATE/ticket.md`：票的格式

## 程式碼地圖

- `packages/core/`：純 TypeScript 領域邏輯，不得 import React Native 或 Expo。外部依賴的 port 放在 `src/ports/`。
- `apps/mobile/`：Expo App。路由在 `src/app/`（Expo Router，此目錄每個檔案都是一個畫面，測試放 `src/__tests__/`）；real/fake 切換在 `src/services/registry.ts`。Expo 專屬規則見 `apps/mobile/AGENTS.md`。
- `e2e/maestro/`：一個 user story 一個 flow，檔名 `us-NN-<slug>.yaml`。
- `fixtures/`：測試資料與回放檔。

## 指令

```bash
npm install                     # 安裝所有 workspace
npm run verify                  # T1：typecheck + lint + test + format check（完成任何程式碼變更前必跑）
npm run format                  # 自動排版
npm test -w @app/core           # 只跑 core 的 Vitest
npm test -w @app/mobile         # 只跑 App 的 Jest
npm run start:fakes -w @app/mobile   # 以 fake services 啟動 dev server
maestro test e2e/maestro        # E2E（需要已安裝 App 的模擬器）
```

在 `apps/mobile` 新增套件一律用 `npx expo install <pkg>`，不要用 `npm install`。

## 規則

- 驗收標準先寫成會失敗的測試，再實作。
- 新的外部依賴（時間、定位、網路、儲存、感測器…）必須先在 `packages/core/src/ports/` 定義 port，並提供 fake 實作，再到 `registry.ts` 註冊。畫面不得直接使用 real 實作。
- 元素以 `testID` 標記，e2e 以 `id` 選取，不以畫面文字選取。
- 不修改票上「檔案範圍」以外的檔案。
- 不手動建立或修改 `apps/mobile/ios`、`apps/mobile/android`（由 Expo 產生）。
- 需求不清就停下來提問並標記 `needs-spec`，不要自行假設。同一個問題失敗 3 次就標記 `blocked`。

## 受保護路徑

以下路徑由 `.claude/hooks/protect-paths.sh` 阻擋修改，變更必須開票並由人類執行：

`.github/workflows/`、`.github/CODEOWNERS`、`.claude/settings.json`、`.claude/hooks/`、`.claude/skills/`、`.claude/agents/`、`CLAUDE.md`、`apps/mobile/eas.json`、`docs/process.md`

## 永遠不做

- 讀取、輸入或印出任何金鑰、密碼、`.env` 內容
- `git push --force`、合併自己的 PR、`eas submit`、商店送審
- 刪除或跳過測試、放寬斷言來讓檢查通過
