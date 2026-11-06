# 2026-11-06 Claude Code EC-101 語料工作階段

任務為 [EC-101](../tasks/EC-101.md)，依賴 [EC-001](../tasks/EC-001.md)。分支 `test/ec-101-corpus`，worktree `.claude/worktrees/ec-101-corpus`，草稿 PR [#60](https://github.com/kekekewww/Echo-Canva-Web/pull/60)。分支起點 `dd57934c31915c64c0c505face8cdb7534a24346`，驗收基準 `98a4374fa839aa5dee7c6c35e575b8003f7f1a31`。來源登錄見 [EC-101 語料來源](../raw/sources/ec-101-corpus-baseline.md)，它記錄最終 86 個 case 的版本。

## 工作與變更

- 認領（`e5de2f3`）。比較器與修正（`c61ca1f`、`7980625`）。Classic、Hybrid 與 kernel case（`63f91de`）。預期結果與精簡的可見度輸出（`442caa2`）。遷移、退化與 tape（`e45a465`）。遷移歷史與精確的門邊幾何（`aa5b985`）。規則、CLI 與證據（`6e6c454`）。證據綁定規則，產品檢查忽略 scripts（`27d7048`）。原始 NUL 修正與未知產品 tree（`e8a1024`）。
- 第一次凍結（歷史）：`d82092b` 凍結規則，`9f60c93` 記錄 72 個 case 的驗收重跑。
- 全分支審查與變異測試之後，維護者於 2026-11-06 決定在驗證前把 clamp、cap 與 locale case 加進 v1。規則為此在合併前重新開啟一次。後續提交：`68fb16b`（凍結強制與不再綁定基準 tree 的測試）、`5c7bf6e`（clamp、cap 與 locale case）、`899ed91`（更緊的 locale 釘選，記錄不可達 guard）、`95d28e1`（重新凍結）、`cb2ef6d`（86 個 case 的驗收重跑）。重新凍結後 `comparison-rules.json` 與第一次凍結逐位元組相同，所有容差決定不變。
- 維護者同時決定後續變更政策：改變輸出的產品 PR 需要 ADR 加新的語料版本，`v1` 保留為基準證據，見 [README](../../benchmarks/corpus/README.md#changing-the-product-on-purpose)。
- 交付物：`benchmarks/corpus/v1/`（86 個 case）、`benchmarks/corpus/harness/`、`scripts/corpus/`、`tests/corpus/`、`vitest.corpus.config.ts`、三個單元測試檔、`package.json` 的 `corpus:*` scripts、`.dockerignore` 與 `.gitignore` 的對應項目。清單見來源登錄。
- 知識頁提交只加知識頁與 `CLAUDE.md` Commands 表，不改 `src/`、既有測試、`benchmarks/results/*`、公式、參數與門檻。

## 已跑檢查

**Measured Result**，細節與限制見來源登錄。

| 檢查 | 結果 |
| --- | --- |
| 基準 SHA 驗收重跑（Windows x64、Node 22.23.3，證據提交 `cb2ef6d`）：`node scripts/corpus/cli.mjs rerun --out .corpus-runs/acceptance --evidence evidence-acceptance.json` | A、B、C 三個 aggregate 相同（`76d6ad8b3a2b5d1fe0dbec6b0372676903821332c56fb4ecbe53ec897c1598e6`），0 violations，86/86 bit-exact，`productTreesMatchBaseline: true`。工件 [acceptance-rerun.json](../../benchmarks/corpus/v1/evidence/acceptance-rerun.json) |
| GitHub Actions run 42170487625，提交 `cb2ef6d`，Node v22.23.3 | `linux` 與 `win32` aggregate 相同，`bitExact=86/86`，三個 CI job 通過 |
| 單元測試套件，`cb2ef6d` | 85 個檔案、794 個測試通過 |
| 敏感度 [sensitivity.json](../../benchmarks/corpus/v1/evidence/sensitivity.json)，`899ed91` | 見來源登錄 |
| 變異測試（審查者在 `src` 暫存副本上執行） | 見來源登錄 |
| 本次知識頁提交的 `node scripts/lint-knowledge.mjs` | 結果見 PR #60 與最終工作階段紀錄 |

**歷史，不是目前結果**：第一次驗收（72 個 case，GitHub Actions run 42160363814，提交 `e8a1024`，rules 凍結於 `d82092b`，`9f60c93` 記錄）當時 aggregate 為 `027f31592b3e8c72adee2a9c079363f4f82624aa9238159cfdad9445543fa4c3`，manifest SHA-256 為 `0d0d268b9af6da26192aae12fee97c219bc3834787ddcd3222cc554a26c65eb4`，acceptance-rerun 為 `c340782c78d57cd975b75b5fc0f47a19ac886287b03722426924fe6ed1583481`。該次確實發生，已被 86 個 case 的版本取代。

## 失敗與未跑

- 未跑：macOS；Worker pool、WASM、Rust、Desktop 變體；計時或剖析；實體音訊與聽測。
- 本工作沒有記錄失敗的檢查。開發中修正的比較器與證據問題在上列提交。

## 最終檢查

最終的 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`node scripts/lint-knowledge.mjs`、`node scripts/verify-source-baseline.mjs` 由控制者在知識頁提交之後執行。結果見 PR #60 與後續的最終工作階段紀錄。此處不預填結果。

## 未決與發現

15 項發現列於 [來源登錄](../raw/sources/ec-101-corpus-baseline.md#報告的發現)。它們是報告，不是已修復項目，產品未被修改。與移植直接相關的有：Classic 與 Hybrid 在牆邊與門邊的路由不同、並列反射的順序由精確 gain 相等決定（`compute-frame.ts:156-161`）、`azimuthDeg` 在正上方未定義、八處單獨變異時沒有 case 改變的 `localeCompare`。跨語言浮點容差仍未決，見 [目前狀態](../wiki/now.md)。

## 本機事件

不含路徑。系統磁碟曾被占滿並短暫阻擋工具，維護者已釋出空間，工作在第二個磁碟，分支已推送。兩個子代理把暫存檔寫到 worktree 之外，違反工作規則。控制者移除一個檔案，另有一個暫存目錄待維護者移除，因為安全檢查擋下了遞迴刪除，控制者沒有繞過。

## 可重開入口

看 [交接](../handoffs/2026-11-06-ec-101-claude.md)。
