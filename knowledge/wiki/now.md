# 目前狀態

更新日期為 2026-11-06。研究依據為 [GitHub main 98a4374](../raw/sources/repository.md)。目前產品為 Browser-first Web workbench。Desktop、共享 Rust Core、WASM adapter、Native Audio 皆是研究提案。當前有效產品政策由 [AGENTS.md](../../AGENTS.md) 和 [正式 ADR](../../docs/adr/README.md) 維護。

## 接續工作

1. 讀 [最近交接 EC-101](../handoffs/2026-11-06-ec-101-claude.md)，它回鏈 [EC-001 交接](../handoffs/2026-11-06-ec-001-codex.md) 與 [EC-001 記憶基礎](../tasks/EC-001.md)。
2. [EC-101](../tasks/EC-101.md) 的語料已實作（Implemented），等待 GPT-Sol 獨立重跑，見 [語料來源](../raw/sources/ec-101-corpus-baseline.md)。其後依 [EC-102 Runtime profiling](../tasks/EC-102.md) 準備第一輪工程驗收。讀 [本機執行紀錄](../raw/sources/windows-baseline.md) 和 [Benchmark 計畫](performance/benchmark-plan.md)。
3. 依 [路線圖](roadmap.md) 審查後續待認領項目。XR 提案供實驗前討論，正式採用狀態見 [決策索引](index.md#proposed-adrs)。

## 未決事項

- 歷史 Worker p95／Long Task 樣本有環境變異。先取得同機、相同版本與可重現互動的主執行緒／Worker trace。
- 已定案：TypeScript 共同語料與其比較規則已於 2026-11-06 凍結（待獨立驗證），見 [語料來源](../raw/sources/ec-101-corpus-baseline.md)。未決：跨語言移植的浮點容差、並列排序、字串比較與 fingerprint producer 邊界。語料只涵蓋 TypeScript 對 TypeScript，另有 12 項待維護者處理的發現。
- WebView2／WKWebView 的包裝、檔案權限、Web Audio 及硬體裝置行為需要代表性機器。Native DSP 與錄製另設驗收。
