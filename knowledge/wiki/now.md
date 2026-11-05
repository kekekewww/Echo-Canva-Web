# 目前狀態

更新日期為 2026-11-06。研究依據為 [GitHub main 98a4374](../raw/sources/repository.md)。目前產品為 Browser-first Web workbench。Desktop、共享 Rust Core、WASM adapter、Native Audio 皆是研究提案。當前有效產品政策由 [AGENTS.md](../../AGENTS.md) 和 [正式 ADR](../../docs/adr/README.md) 維護。

## 接續工作

1. 讀 [最近交接](../handoffs/2026-11-06-ec-001-codex.md) 與 [EC-001 記憶基礎](../tasks/EC-001.md)。
2. 依 [EC-101 基準與可重現語料](../tasks/EC-101.md) 和 [EC-102 Runtime profiling](../tasks/EC-102.md) 準備第一輪工程驗收。讀 [本機執行紀錄](../raw/sources/windows-baseline.md) 和 [Benchmark 計畫](performance/benchmark-plan.md)。
3. 依 [路線圖](roadmap.md) 審查後續待認領項目。XR 提案供實驗前討論，正式採用狀態見 [決策索引](index.md#proposed-adrs)。

## 未決事項

- 歷史 Worker p95／Long Task 樣本有環境變異。先取得同機、相同版本與可重現互動的主執行緒／Worker trace。
- 跨語言浮點容差、排序、字串比較與 fingerprint producer 邊界需由共同語料鎖定。
- WebView2／WKWebView 的包裝、檔案權限、Web Audio 及硬體裝置行為需要代表性機器。Native DSP 與錄製另設驗收。
