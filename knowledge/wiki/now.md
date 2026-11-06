# 目前狀態

更新日期為 2026-11-06。研究依據為 [GitHub main 98a4374](../raw/sources/repository.md)。目前產品為 Browser-first Web workbench。Desktop、共享 Rust Core、WASM adapter、Native Audio 皆是研究提案。當前有效產品政策由 [AGENTS.md](../../AGENTS.md) 和 [正式 ADR](../../docs/adr/README.md) 維護。

## 接續工作

1. 讀 [最近交接 EC-101](../handoffs/2026-11-06-ec-101-claude.md)，它回鏈 [EC-001 交接](../handoffs/2026-11-06-ec-001-codex.md) 與 [EC-001 記憶基礎](../tasks/EC-001.md)。
2. [EC-101](../tasks/EC-101.md) 的語料已由 GPT-Sol 獨立驗證（Verified，候選 `b0807ae`），見 [語料來源](../raw/sources/ec-101-corpus-baseline.md) 與 [驗證工作階段](../sessions/2026-11-06-codex-ec-101-verification.md)。維護者合併後，依 [EC-102 Runtime profiling](../tasks/EC-102.md) 準備第一輪工程驗收。讀 [本機執行紀錄](../raw/sources/windows-baseline.md) 和 [Benchmark 計畫](performance/benchmark-plan.md)。
3. 依 [路線圖](roadmap.md) 審查後續待認領項目。XR 提案供實驗前討論，正式採用狀態見 [決策索引](index.md#proposed-adrs)。

## 未決事項

- 歷史 Worker p95／Long Task 樣本有環境變異。先取得同機、相同版本與可重現互動的主執行緒／Worker trace。
- 已釘選（TypeScript）：86 個 case 的共同語料與凍結的比較規則、並列反射的順序（`compute-frame.ts:156-161`），以及 fingerprint 對場景名稱的雜湊行為，包含非 BMP 低代理項碰撞（`LC03`、`LC05`），已獨立驗證於 `b0807ae`（[報告](../../benchmarks/corpus/v1/evidence/verification-b0807ae.md)）。字串比較在強制的九個 locale 間輸出不變，由第一次完整驗證在 `cd0d6ab` 重現（[報告](../../benchmarks/corpus/v1/evidence/verification-cd0d6ab-not-verified.md)），兩個版本的凍結輸入與期望輸出相同。見 [語料來源](../raw/sources/ec-101-corpus-baseline.md)。
- 仍未決：跨語言移植的浮點容差；八處 `localeCompare`（`room-acoustics:62`、`image-source:151`、`:225`、`:238`、`bvh:42`、`:79`、`:156`、`second-order:82`）單獨變異時沒有任何 case 改變，語料抓不到；語料只涵蓋 TypeScript 對 TypeScript；另有 15 項待維護者處理的發現。
- WebView2／WKWebView 的包裝、檔案權限、Web Audio 及硬體裝置行為需要代表性機器。Native DSP 與錄製另設驗收。
