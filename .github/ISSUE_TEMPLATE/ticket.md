---
name: Ticket
about: 一張可由 Implementer agent 獨立完成的票（≤ 1 個 PR）
title: '<type>: <一句話描述>'
labels: []
---

## 目標

<!-- 一句話說明這張票完成後的變化。 -->

## 對應需求

<!-- 例如 US-03（docs/prd.md）、ADR-004 -->

## 驗收標準

- Given ... When ... Then ...

## 對應測試

<!-- 測試位置見 docs/platform.md 的「測試配置」。 -->

- unit: `packages/core/src/xxx.test.ts`
- component:
- e2e: `e2e/.../us-NN-xxx`

## 檔案範圍

- 可修改：
- 不可修改：其他所有路徑

## 依賴

- 需先完成 #

## 不做

- <!-- 明確排除的項目 -->

## 標記

- [ ] 修改共用介面、schema 或導覽結構 → 這是契約票，加上 `contract`
- [ ] 符合 `docs/platform.md`「平台特有 labels」的條件 → 加上對應 label
