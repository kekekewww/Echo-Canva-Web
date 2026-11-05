# 音訊、緩衝區、執行緒與錄製提案

日期 2026-11-06。各案狀態皆為 **Proposed**。程式基準、既有決策與現行量測請見 [Repository 基準](../../raw/sources/repository.md)、[音訊與緩衝區研究](../audio/buffers.md) 與 [既有 ADR 索引](../../../docs/adr/README.md)。採用須分別通過 [Benchmark 與數值驗證](../performance/benchmark-plan.md)。

## XR-007 · Audio Backend Abstraction

| 欄位 | 內容 |
| --- | --- |
| Context | Browser `AudioEngine` 具備常駐 graph、HRTF／equal-power、Raw／Simulated 與既有淡化時序。Desktop 初期需要保留這些互動，專業裝置控制有獨立驗證需求。 |
| Decision Proposal | Web 和第一個 Desktop 殼重用 Web Audio。等目標 WebView 與裝置已量測，再以 CPAL 測試 Native adapter。定義小型平台介面，涵蓋使用者啟動、播放意圖、停止、重試、場景／獲採用幀、裝置能力與診斷。聲學 core 只交付純資料。 |
| Alternatives | Web Audio-only 支援最早交付，原生裝置控制受 WebView 能力限制。Native-first 及早接觸裝置 API，也提早承擔 DSP、HRTF、裝置及輸出格式的相容風險。 |
| Trade-offs | 分期可把 WebView、聲學、DSP 及裝置問題各自定位，仍需維護兩套實現與共同合約。相同控制意圖不保證兩平台採用相同 HRTF 或產生逐位一致的波形。 |
| Compatibility | 先保持場景資料、單活躍 listener、audio asset relink、六個 tap 與 Raw／Simulated 行為。裝置、路由、sample rate 和 Native HRTF 標為能力，模型公式與 ranking 沿用共同 core。 |
| Performance Implications | 原生 I/O 可探索不同 buffer 和裝置配置。減少延遲或提高連續性是待驗證假設，應用時間戳與實體裝置量測。 |
| Migration Cost | 第一階段接出 Web Audio 最小 adapter 和合約測試，第二階段實作獨立 CPAL spike 及預配置 DSP，含錯誤、拔插、回呼及權限處理。 |
| Validation Plan | Web／WebView 跑既有 graph identity、離線 render、tap、fade 及聆聽驗收。Native 加入預設／自選裝置、USB、藍牙及 hot-plug，檢查 sample rate、buffer、callback overrun 與輸出延遲。 |
| Rollback Plan | 關閉 Native adapter 的功能旗標並回到已驗證的 WebView Web Audio 預覽。若目標 WebView 無法保持既有行為，延後該平台殼的試用。 |

## XR-008 · Buffer Strategy

| 欄位 | 內容 |
| --- | --- |
| Context | 聲學結果可合併，PCM 必須保留時間順序，錄製要求連續完整；目前採用完整幀和瀏覽器內建圖。 |
| Decision Proposal | 聲學採不可變最新有效快照，保留單一 in-flight 與 latest pending。Native DSP 用固定大小最新參數快照，雙槽或三槽只在已證明 slot 交接和 p99 時引入。順序 PCM 串流或錄音才使用有界 FIFO／SPSC，裝置輸出與 DSP scratch 可使用單 buffer。 |
| Alternatives | 單槽跨執行緒覆寫容易撕裂，僅用於單一所有者。所有資料皆 FIFO 容易把舊 pose 堆成延遲。所有資料採 SharedArrayBuffer 增加隔離、生命週期及錯誤處理成本。 |
| Trade-offs | Latest-only 維持 UI 回應，需記錄 skipped 與 pose age。多槽和池提高常駐記憶體，串流預填增加首音與 seek 時間。 |
| Compatibility | 保留 `INSTALL_STATIC`／`COMPUTE_SHARD`、static fingerprints、ordered source IDs、revision 及完整 serial fallback。可丟 pose 的策略只用於預覽資料。 |
| Performance Implications | 短固定資料可減少序列化與配置，實際收益依邊界及設備而異。複本、排隊、GC、warm-up、cache 與 underrun 各自量測。 |
| Migration Cost | 第一階段只加診斷。之後才做 binary payload、slot 協定及壓力測試，另審 Web isolation 與部署。 |
| Validation Plan | 模擬突發更新、交棒競爭、停止及重啟；注入 full／empty、lost lease、detached transfer、malformed payload。檢查 revision／generation、torn reads、無分配、peak memory 和 p99。 |
| Rollback Plan | 保留普通 structured clone／小型 IPC 和 immutable snapshot。若串流未達標，初版限制為合適大小的整檔資產。 |

## XR-009 · Worker and Thread Ownership

| 欄位 | 內容 |
| --- | --- |
| Context | Browser 池持有靜態資料並按來源並行，主端接納完整幀。Native 可能同時有求解、UI／IPC、裝置回呼、解碼與錄音寫入。 |
| Decision Proposal | Web 先保留有界 Worker 池。Native 統一由控制器接納 solve job、持有場景 generation 及 dispatch quota，計算池共讀同一份不可變靜態幾何。控制器獨佔聲學發布；Audio callback 獨佔 DSP 狀態；解碼／寫入持有各自的非即時資源。預覽 pose 可合併，lifecycle 走有界事件或獨立 intent／ack。 |
| Alternatives | 每來源啟無限制執行緒會增加競爭與記憶體。共用一個 task pool 跑音訊與求解容易把求解阻塞帶進回呼。單執行緒求解為參照與低核心數候選。 |
| Trade-offs | 資源隔離可量測 scheduler interference，也需要處理 shutdown、取消和 slot 釋放。Native pool 大小依實測配置，Web 保留既有 hardwareConcurrency 公式。 |
| Compatibility | 同一靜態 generation 才發布，完整並保持來源順序。失敗後以完整 serial fallback 重算；過期結果不可覆蓋新狀態。UI 和音訊使用同一 accepted frame ID。 |
| Performance Implications | 按工作量限制併發，保留音訊和 UI 的 CPU 空間。比較池尺寸、分片偏斜、冷／暖快取、執行中取消成本、CPU／thermal 和 p99。 |
| Migration Cost | Desktop 先測單執行緒 runner，再測明確擁有的計算池。增加 generation、watchdog、錯誤診斷及一鍵切回。 |
| Validation Plan | 固定 CPU／負載比較 serial 與小型 pool。注入 Worker crash、舊結果、資料不完整、快速裝置重啟及 UI 連續拖曳。驗證 exact / pose-lagging 接納和實機音訊連續性。 |
| Rollback Plan | 桌面切回 serial runner，維持既有 Web Worker 策略；audio 負載證據不足時延後 Native I/O。 |

## XR-010 · Recording and Persistence

| 欄位 | 內容 |
| --- | --- |
| Context | Web 資產用 IndexedDB 與可重連 JSON。正式 take 涉及逐樣本完整性、配額、使用者授權、暫存檔、長時間持續寫入與 crash recovery。 |
| Decision Proposal | 專案與音訊各自走平台 persistence adapter。Web 先保持 IndexedDB 與 JSON relink；Desktop 專案檔和資產僅透過經授權的本機路徑。正式錄音經有界 SPSC block pool 和非即時 writer，驗證段落與 frame count 後，從暫存檔完成最終檔。溢位標記失敗並保留可驗證的連續前綴。 |
| Alternatives | 全程記憶體累積僅可做短預覽。瀏覽器 MediaRecorder 適合便捷輸出試驗，需另證 codec／取樣完整性。直接在 callback 寫檔的執行時間不可預期，予以排除。 |
| Trade-offs | 有界 staging 控制 RAM，writer stall 過長須終止 take。checksum／flush 增加 I/O，支援可診斷的恢復。採樣格式和可攜性需權衡。 |
| Compatibility | 現有 JSON 格式、檔案 relink 與 browser-only Blob 保留。新格式另審 version、migration、媒體授權、權限、名稱衝突與跨平台路徑。 |
| Performance Implications | 測最大可吸收 writer stall、峰值 RAM、持續寫入率、flush／finalize 及復原時間。預覽 latency 與錄製保存時間分別評估。 |
| Migration Cost | 先決定取樣點與格式，再做 chunk schema、writer、權限和故障注入。Web 的 OPFS／下載和 Desktop 的檔案 publish 各自驗證。 |
| Validation Plan | 用已知 PCM 正弦及計數序列驗證 sample count、hash、檔案解碼、權限撤回、裝置斷線、writer stall、磁碟滿及 crash 後連續前綴。 |
| Rollback Plan | 關閉錄製能力，維持現有匯入／匯出及 relink。失敗暫存 take 以復原工具唯讀列出，使用者選擇保留或另存。 |
