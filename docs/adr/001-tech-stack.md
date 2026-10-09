# ADR-001：技術基線

- 狀態：已接受
- 日期：2026-10-09
- 決策者：人類 Owner（template 建立時）

## 背景

由 agent 端到端開發雙平台 App。技術選型以「agent 是否容易操作與驗證」為首要考量。

## 決策

| 層 | 選擇 |
| --- | --- |
| App | Expo SDK 57（React Native + TypeScript），Expo Router，dev client |
| Monorepo | npm workspaces：`apps/mobile`、`packages/core` |
| 領域邏輯 | `packages/core`：純 TypeScript，不依賴 React Native |
| 單元測試 | Vitest（`packages/core`） |
| 元件測試 | Jest（jest-expo）+ React Native Testing Library（`apps/mobile`） |
| E2E | Maestro，iOS 與 Android 共用 flow |
| 靜態檢查 | `tsc --noEmit`、ESLint（eslint-config-expo）、Prettier |
| Build / 上架 | EAS Build、EAS Submit、EAS Update |
| 協作與 CI | GitHub Issues、PR、Actions |

## 考慮過的選項

| 選項 | 優點 | 缺點 |
| --- | --- | --- |
| Expo（選定） | 單一程式碼、CLI 完成簽章與送審、型別回饋即時 | 原生客製需透過 config plugin |
| Flutter | 單一程式碼、效能穩定 | Dart 生態與 agent 訓練資料較少 |
| 原生 Swift + Kotlin | 平台能力完整 | 工作量加倍，雙平台行為容易不一致 |

## 後果

- 外部依賴一律以 port + fake 實作（見 `packages/core/src/ports/`），由 `apps/mobile/src/services/registry.ts` 切換。
- `apps/mobile/ios`、`apps/mobile/android` 由 Continuous Native Generation 產生，不手動修改、不納入版控。
- 新增套件一律使用 `npx expo install`，確保與 SDK 版本相容。
