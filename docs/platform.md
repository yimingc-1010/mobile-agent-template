# 平台設定：行動 App（iOS + Android）

> 本檔由 mobile 平台 template 擁有，定義 `docs/process.md` 中所有「見平台設定」的具體內容。技術選型的理由見 `docs/adr/001-tech-stack.md`。

## 技術棧

| 層 | 選擇 |
| --- | --- |
| App | Expo SDK 57（React Native + TypeScript）、Expo Router、dev client |
| 領域邏輯 | `packages/core`（共用，Vitest） |
| 元件測試 | Jest（jest-expo）+ React Native Testing Library |
| E2E | Maestro，iOS 與 Android 共用 flow |
| Lint | ESLint（eslint-config-expo，`expo lint`） |
| Build / 發布 | EAS Build、EAS Submit、EAS Update |

## 程式碼位置

- `apps/mobile/`：Expo App；Expo 專屬規則見 `apps/mobile/AGENTS.md`。
- `apps/mobile/src/app/`：路由（Expo Router，此目錄每個檔案都是一個畫面）。
- `apps/mobile/src/__tests__/`：元件測試（不可放在 `src/app/`）。
- `apps/mobile/src/services/registry.ts`：service registry，real/fake 切換的唯一位置。
- `e2e/maestro/us-NN-<slug>.yaml`：E2E flow。
- `apps/mobile/ios`、`apps/mobile/android`：由 Continuous Native Generation 產生，不手動修改、不納入版控。

## 指令

Script 契約的實作：

| 契約 | 實作 |
| --- | --- |
| `npm run verify` | typecheck（tsc）+ `expo lint` + Jest + Vitest + Prettier check |
| `npm run e2e` | `maestro test e2e/maestro` |
| `npm run e2e:one -- <file>` | `maestro test <file>` |

平台專屬指令：

```bash
npm run start:fakes -w @app/mobile   # 以 fake services 啟動 dev server
npm run doctor -w @app/mobile        # expo-doctor：檢查套件版本與設定
cd apps/mobile && npx expo install <pkg>   # 新增套件一律用這個，不要用 npm install
```

## 測試配置

| 層級 | 工具 | 位置 |
| --- | --- | --- |
| 單元測試 | Vitest | `packages/core/src/**/*.test.ts` |
| 元件測試 | Jest + RNTL | `apps/mobile/src/__tests__/*.test.tsx` |
| E2E | Maestro | `e2e/maestro/us-NN-<slug>.yaml` |

- 元素以 React Native `testID` 標記，Maestro 以 `id` 選取。
- Fake 切換：`EXPO_PUBLIC_USE_FAKES=1`。`eas.json` 的 `development` 與 `e2e` profile 已預設開啟。

## 驗證分層

| 層 | 內容 | 環境 |
| --- | --- | --- |
| T1 | `npm run verify` | Linux runner |
| T2 | Android 模擬器 + Maestro（KVM 硬體加速） | Linux runner |
| T3 | iOS 模擬器 + Maestro | macOS runner |

- Implementer 本機驗證全綠的定義是 T1 + T2。
- **原生層快取**：以 `@expo/fingerprint` 計算原生層雜湊；未變則從快取取出已 build 的 app 安裝到模擬器，只更新 JS；改變才重新 native build。
- **Runner 演進**：起步全部用 GitHub-hosted runner（macOS 只跑 T3）；macOS 費用或排隊成為瓶頸時，改用自架 Mac mini，以 Tart 一類工具為每個 job 開用完即丟的 macOS VM；或改用 EAS Workflows、Maestro Cloud。
- 對外連線白名單另需放行 Expo 服務。

## 平台特有 labels

以 `scripts/setup-labels.platform.sh` 建立。

| Label | 意義 | 誰可以加 |
| --- | --- | --- |
| `native-change` | 動到原生層（原生套件、config plugin、權限），需提早做 iOS 驗證 | Architect（拆票時） |

## 發布管道

| 環境 | 實作 |
| --- | --- |
| 開發 | `eas.json` 的 `development` profile（dev client + fakes，iOS 模擬器） |
| 測試 | `e2e` profile（內嵌 JS bundle + fakes，供 Maestro） |
| 預發布 | `preview` profile → TestFlight 與 Google Play 內部測試軌道 |
| 正式 | `production` profile → App Store 與 Google Play 正式版 |

- 版本號：`apps/mobile/app.json` 的 `expo.version`；build number 由 EAS 遠端自動遞增（`appVersionSource: remote` + `autoIncrement`）。
- 預發布：`eas build --profile preview` + `eas submit`，由 CI 執行。
- 正式發布：人類在 App Store Connect 與 Play Console 核對素材後按下送審，採分階段發布（phased rollout）。
- 熱修復與回滾：只動 JS 層的修正可以用 EAS Update 發布或回滾；動到原生層一律重新 build 並送審。

## 人工驗收

- 腳本：`docs/qa/device-test.md`，由人類在實體 iOS 與 Android 裝置上執行。
- 商店截圖：Release agent 用 Maestro 產生各尺寸截圖。

## 正式發布前檢查

- 有帳號註冊就要提供 app 內刪除帳號。
- 提供第三方登入時，評估是否必須提供 Sign in with Apple。
- 每個敏感權限（定位、相機、通知、背景執行）都要有用途說明文字，經人類確認。
- 隱私權聲明：App Store 的 App Privacy 與 Google Play 的 Data safety。

## 一次性設定（人類）

- 申請 Apple Developer Program（以公司名義需 D-U-N-S 編號）與 Google Play Console 帳號。
- 2023 年 11 月後建立的 Google Play 個人帳號，上正式版前須完成 12 位測試者、連續 14 天的封閉測試。
- 建立 App Store Connect / Play Console 的 app 條目；`apps/mobile/app.json` 的 `ios.bundleIdentifier` 與 `android.package` 必須一致。
- 連結 EAS 專案（`npx eas-cli@latest init`），設定 EAS secrets。

## 平台受保護路徑

列於 `.claude/protected-paths.platform`：`apps/mobile/eas.json`。
