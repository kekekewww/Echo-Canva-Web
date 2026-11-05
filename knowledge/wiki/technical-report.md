# Echo Canvas 跨平台與效能技術報告

研究基準為 [GitHub main 98a4374](../raw/sources/repository.md)。本輪交付共享 Markdown 知識、驗證工具和移植／效能研究。以下平台選擇為 Proposed Design，產品實作、歷史量測與待驗假設分別記錄。

## 現行產品和研究邊界

**Verified Fact.** Web workbench 具有獨立 Classic/Hybrid 專案、純 TypeScript solver、受控 Worker pool 與持久 Web Audio graph。資料由作者場景投影成計算合約。Static install 與 pose request 分離，完整 frame 經比對後才交給 overlay 和 Audio，符合結構與來源條件時可採 pose-lagging frame。Hybrid 的 BVH 由主執行緒建好後按 fingerprint 複製給各 Worker。P5/P6/P7 有可測資料能力，現行聲音使用三頻段早期反射與 Schroeder reverb。[架構稽核](architecture/current.md) [聲學公式](../../docs/ACOUSTICS.md) [現行效能控制](performance/baseline.md)

**Measured Result.** Windows 本輪執行通過 699 項單元測試與 production build。現行 100-wall Chromium 壓力案例四個 Worker 收到 24 筆不同完成序號，報告 p50/p95/p99 為 2/5/6 ms，觀察窗內沒有 Long Task。Classic 音訊拖曳診斷有 39 筆採樣，各觀察到不同的 accepted revision。兩項瀏覽器測試各為一次 headless 跑次。歷史壓力測試另有失敗樣本，硬體輸出、重複跑次及跨平台結果仍待量測。[Windows 工件與指令](../raw/sources/windows-baseline.md) [歷史效能證據](performance/baseline.md)

## Proposed Design

| 邊界 | 設計與採用條件 |
| --- | --- |
| Repository 與 UI | 初期同一儲存庫管理共用 schema、語料、核心與 UI。Web 保留 Next.js 和選用伺服器 API。Desktop 用靜態 React/Vite 前端加 Tauri shell，經平台 adapter 重用工作台。按各自發行線部署，驗證 WebView2/WKWebView 相容性。 |
| Core 與所有權 | `echo-acoustics-core` 逐步移植 pure f64 geometry、finite intersections、BVH、Direct、first-order，再做完整 Portal／二階／frame。Native 和 WASM 由 adapter 封裝。Static geometry 按結構生命週期留在計算側，動態工作只帶 validated snapshot、revision 與 handle。 |
| 資料傳輸 | Web 先 TS oracle／fallback，於既有 Worker 內試單執行緒 WASM。Desktop 用 Tauri Command 啟動或替換計算，依證據選有限回傳或 Channel。先量 JSON、structured clone、TypedArray transfer 的端到端成本，Binary／SharedArrayBuffer 按量測導入。 |
| Audio／錄製 | 初期沿用 Web Audio。若實測需要 native backend，solver 與 callback 分離，用預配置參數快照及具容量規則的 queue。PCM streaming、可丟棄的預覽和要求資料完整性的錄製各有所有權。 |
| AI／存檔 | AI 只產生待驗證候選或解釋 deterministic snapshot。Web 保留瀏覽器快取，Desktop 以顯式檔案權限提供本機儲存及可審查的 migration。遠端 AI 採與產品相同的 opt-in、安全與驗證邊界。 |

[跨平台架構](platforms/web-desktop.md) [Rust 移植與資料合約](platforms/rust-core.md) [音訊與 Buffer](audio/buffers.md) [XR 提案](index.md#proposed-adrs)

## 先做的工程工作

1. 固定 TS 語料、schema 與逐欄位 oracle，記錄空間幾何、材料、ID、路徑排序、座標及 revision 的反例。以現有公式和期待輸出為準。[EC-101](../tasks/EC-101.md)
2. 在同機相同輸入切開 static compile、queue/dispatch、clone、shard、驗證與 presentation。補上 continuous pose、static edit、播放中負載與資源使用。依 trace 決定先改傳輸、幾何、React 更新或 Audio 更新。[EC-102](../tasks/EC-102.md) [最佳化實驗](performance/optimization.md)
3. 用 isolated Rust prototype 與同機 Native/WASM 比較量出淨收益，再試 Desktop shell 與真裝置。每條新路徑使用能力標記並保留完整 fallback。採用與發行依 [路線圖](roadmap.md) 逐關驗收。[Benchmark 規格](performance/benchmark-plan.md)

## 未決事項

Windows/macOS 尾延遲和音訊裝置表現、WASM 與 Native 的端到端淨收益、IPC payload 對互動的成本、錄製長時間失敗策略仍需量測。需依 TS 語料凍結兼容容差與排序，並決定 Desktop 支援的 WebView、裝置、檔案系統、發布矩陣與能力範圍。[目前狀態與交接](now.md)

## Documentation／Infrastructure Integration Report

研究基準的新增範圍為 `knowledge/`、`scripts/lint-knowledge.mjs`、薄 `CLAUDE.md` 及 AGENTS／文件／ADR 索引導覽。正式 ADR 狀態與上游來源證據保留。此研究以本機分支提供審查。

整合時比對候選提交與最新主線，核對 `src/`、schema、測試門檻、套件鎖、部署和 CI 的差異為空，執行 `node scripts/lint-knowledge.mjs`、`git diff --check` 及來源查核。若尚有別的 `CLAUDE.md` 候選，採共同政策匯入並依實際程式避免複製過時架構。合併依維護者審查。[工作階段與驗證紀錄](../sessions/2026-11-06-codex-cross-platform.md)
