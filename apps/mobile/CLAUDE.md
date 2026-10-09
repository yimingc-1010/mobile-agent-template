@AGENTS.md

## 本專案補充

- 本 App 位於 npm workspaces monorepo 中；指令從 repo 根目錄以 `-w @app/mobile` 執行，或在本目錄執行。
- 領域邏輯放 `packages/core`（以 `@app/core` 匯入），本目錄只放 UI、導覽與平台整合。
- 測試放 `src/__tests__/`，不可放在 `src/app/`（Expo Router 會把它當成路由）。
