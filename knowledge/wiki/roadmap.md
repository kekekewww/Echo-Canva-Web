# Web／Desktop 工程路線圖

Phase 0 交付本次的研究與記憶系統。下列實作工作由任務記錄管控。優先排序以先固定產品基準，再用可回退原型證明方案為原則。效能決策採 [Benchmark 與數值規格](performance/benchmark-plan.md)，架構調整走 [ADR 審查](../../docs/adr/README.md)。

| 階段與依賴 | 交付與工作拆解 | 風險與預期收益 | 驗收與量測 | 回退 |
| --- | --- | --- | --- | --- |
| **0 知識基礎** · [EC-001](../tasks/EC-001.md) | 建入口、schema、索引、task、session、handoff、來源和 lint。 | 索引漂移與重複認領。降低查找成本並保留證據脈絡。 | 獨立 Agent 可找到下一步。lint 正反控制、可達性、diff 邊界與 Git 歷史來源查核。 | 還原入口和工具的整合，保存已記錄的原始證據。 |
| **1 基準** · [EC-101](../tasks/EC-101.md)、[EC-102](../tasks/EC-102.md)，依賴 0 | 建固定語料及 TS oracle → 量測 Windows/macOS → 定位 queue、Worker、UI、Audio 的尾延遲。 | JIT、排程、GC 與量測擾動。取得有環境可追溯的瓶頸排序。 | 可重播輸入與精確欄位／容差規則，保留所有跑次及原始工件。現有 12/50 ms gate 獨立執行。 | 移除測試專用 instrumentation，保留 fixture／工件。 |
| **2 Rust 原型** · [EC-201](../tasks/EC-201.md)，依賴 1 | 純 crate → f64 幾何與交點 → BVH → Direct → first-order。用隔離 corpus adapter 接線。 | 容差、端點、排序及材料重現。量出純 kernel 的改善空間。 | 幾何與路徑逐欄位 parity，加上 cold/warm kernel time 和 alloc。缺功能列明能力集合。 | 丟棄原型 adapter，保留 TS oracle 與反例。 |
| **3 Native／WASM 對照** · [EC-301](../tasks/EC-301.md)，依賴 2 | 按 serial、native pool、WASM inline、WASM Worker 分組。分開初始化、搬移、執行、合併和接受。 | WASM boundary、熱機、倍增 Worker 記憶體或 native 過度併行可抵消 kernel 收益。獲得採用或停止的數據。 | 同機配對採樣，含尾延遲、correctness、CPU/記憶體。通過目標場景且維持完整 fallback 才開下一關。 | 預設保留 TS，淘汰無淨收益的變體。 |
| **4 Desktop 原型** · [EC-401](../tasks/EC-401.md)，依賴 3 | 靜態 Vite/Tauri shell → 共用 workspace UI → capability-bound IPC → 選檔與保存 → WebView 音訊。 | Windows/macOS WebView 行為、權限及封裝分歧。證明可重用 UI 及本機專案工作流。 | 端到端序列化／IPC、故障恢復、開啟／編輯／重開／匯出、mock AI，保留路徑與版本。 | 停用 native compute／shell。繼續用獨立 Web 發行線。 |
| **5 即時音訊** · [EC-501](../tasks/EC-501.md)，依賴 4 | 先驗證 WebView Audio；隔離 Native I/O、DSP deadline、裝置變更、預配置 queue 與錄製 writer。 | xrun、重取樣、HRTF 差異及錄製資料缺口。取得裝置控制或錄製是否值得投入的證據。 | 頭戴聽測、硬體 loopback/裝置矩陣、callback tail 與 underrun、長錄製／disk stall／停止恢復。 | 預覽保留 Web Audio。未達完整性前關閉錄製能力。 |
| **6 雙平台產品** · [EC-601](../tasks/EC-601.md)，依賴 4、5 | 版本表、獨立 CI／release、簽署更新、平台 QA、跨版檔案與回退演練。 | 雙線發布與相容性維護成本。保有同一語料、知識與場景來源。 | 平台工件可溯源，保存跨版本互通、崩潰復原、簽名權限及效能基線，逐平台通過。 | 分平台停止發行或降級，維持可讀檔案與 TS 路徑。 |
| **7 進階最佳化** · [EC-701](../tasks/EC-701.md)，依賴 3、6 | 逐項驗證 locality、SIMD、平行度、larger scenes、視覺層級。GPU／高階反射另案評估。 | 不可重現的自動品質與排序漂移。集中投入經 profiling 找到的瓶頸。 | 各方案單變因 A/B，凍結高品質 oracle。模型差異、CPU/記憶體、尾延遲與熱/能耗分開報告。 | 關閉各實驗 flag，回到固定品質和已驗證路徑。 |

## 採用與停止條件

- Phase 1 得到可重現的 Windows/macOS TypeScript 與瀏覽器量測前，原型的閾值仍是研究設定。若瓶頸落在 UI、資料搬移或裝置，優先做同模型的局部修正與重測。
- Phase 2 到 3 以正確性作前置門檻。速度結果只在相同場景、功能集合、硬體條件及量測邊界間比較。若 Rust 缺少使用者需用的功能，維持能力分流或整幀回退。
- Phase 4 前可以獨立確認最小 Tauri shell 能啟動，但正式 Desktop 計算採用依 Phase 3 的證據。Phase 5 另以硬體音訊、主觀定位、錄製資料完整性核准。
- 發行前正式 ADR 核准、完整的場景往返測試、正式壓力驗收、相關平台實測與 rollback 演練都需具名證據。
