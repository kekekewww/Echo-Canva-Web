# 即時音訊與緩衝區

檢視日期 2026-11-06。現行行為以 [Repository 基準](../../raw/sources/repository.md) 為準。新設計使用 Proposed Design，待測效益使用 Hypothesis。技術成熟度與來源版本收錄於 [音訊與緩衝區來源](../../raw/references/audio.md)。設計提案收錄於 [音訊與資料所有權 ADR](../decisions/0002-audio-and-ownership.md)。

## 現行路徑與證據

| 證據類別 | 現況 | 來源 |
| --- | --- | --- |
| Verified Fact · 程式檢視 | Workbench 保有一個跨模式的 `AudioEngine`，在使用者啟動後取得 `AudioContext`。聲源的已解碼 `AudioBuffer` 交給瀏覽器播放，通常只在 clip 或 loop 設定改變時重建該聲源圖。音量、遮擋低通、HRTF／equal-power、Raw／Simulated、Schroeder 晚期殘響與六個早期反射 tap 使用常駐節點及音訊時鐘排程。 | [架構](../../../docs/ARCHITECTURE.md) · [AudioEngine](../../../src/audio/AudioEngine.ts) · [SourceGraph](../../../src/audio/SourceGraph.ts) |
| Verified Fact · 程式與測試 | 模擬參數跟隨完整獲採用的聲學資料，兩幀間保持上一組目標。新圖只有在無對應聲學結果時使用自由場估計。相同 target 和 time constant 的平滑更新被略過。Raw／Simulated 的等功率交叉淡化為 80 ms，連續參數的指數時間常數也是 80 ms，兩者具有不同的時間語意。反射路徑在六個 tap 內保持槽位，路徑被替換時先淡出再調整延遲。 | [平滑實作](../../../src/audio/parameter-smoothing.ts) · [tap 分配](../../../src/audio/reflection-slots.ts) · [音訊引擎測試](../../../tests/unit/audio-engine.test.ts) · [反射 tap 測試](../../../tests/unit/early-reflection-bank.test.ts) |
| Verified Fact · 程式與測試 | Classic／Hybrid 主端協調器按來源分片，每池一個執行中工作並合併最新待處理輸入，節流到 10–15 Hz。靜態資料用 `INSTALL_STATIC` 安裝，動態計算用 `COMPUTE_SHARD`，收到完整且有效分片才發布。相同靜態結構及有序 source IDs 才允許採用較舊的 pose 幀。靜態變更時舊幀不可冒充新結構，音訊平滑保留上一狀態。逾時或 Worker 失敗進入完整 serial fallback。 | [Classic 池](../../../src/workers/classic-source-pool.ts) · [Hybrid 池](../../../src/workers/hybrid-direct-pool.ts) · [既有 ADR 0008](../../../docs/adr/0008-adopt-pose-lagging-frames.md) |
| Verified Fact · 程式檢視 | 本機 WAV／MP3／Ogg 資產驗證為單聲道。Blob 儲存在 IndexedDB，應用層限制 25 MiB／檔與 100 MiB／庫，儲存失敗可降級為明示的記憶體模式。JSON 攜帶重連資訊。解碼快取按 clip ID 記憶 Promise 並合併重複載入，失敗項移除，dispose 清除。現行 cache 沒有已解碼 byte budget 或 LRU。 | [本機資產庫](../../../src/domain/audio-assets/local-library.ts) · [AudioEngine](../../../src/audio/AudioEngine.ts) · [持久化 E2E](../../../tests/e2e/local-audio-persistence.spec.ts) |
| Measured Result · 已封存資料 | 既有三輪交錯測試在 Linux VM、4 logical CPUs／2 Classic Workers、headless Chrome 153 與假輸出上，比較更早的提交。拖曳 render capacity 平均值在 PR #40 前為 0.211–0.219，PR #40 後為 0.146–0.182。後續採用 pose-lagging 的分支為 0.145–0.170，三輪各 39/39 個取樣點有獲採用幀，前兩組各輪皆為 0。取樣間隔 250 ms，10 秒拖曳，容量峰值受共享 VM 干擾。這批數據的 commit 與目前基準不同。 | [方法和環境](../../../docs/maintenance/evidence/audio-render-capacity/README.md) · [三輪原始結果](../../../docs/maintenance/evidence/audio-render-capacity/runs.json) |
| Verified Fact · 測試覆蓋 | Chromium 離線渲染測試覆蓋 Schroeder RT60（目標 ±20%）、有限且峰值 ≤1 的立體聲輸出、Raw／Simulated 與聲源起停相鄰樣本步幅（≤峰值的 1%），以及遮擋相對於 direct 的高頻能量降低。此路徑的觀測量為波形與能量。耳機聆聽與實機 underrun 必須另測。 | [離線渲染 E2E](../../../tests/e2e/audio-rendering.spec.ts) · [聆聽驗收](../../../docs/testing/browser-listening.md) |

**Hypothesis · 待量測。** 目前需要定位的成本是解碼峰值、長時換 clip 後的已解碼常駐 bytes、HRTF／tap 的實機 CPU 壓力、React/Worker 通訊與音訊排程的競爭、實機端到端延遲。先取得時間軸、記憶體與輸出證據，再決定 cache、AudioWorklet、IPC 或緩衝區是否需要改動。詳見 [效能基準](../performance/baseline.md) 與 [最佳化研究](../performance/optimization.md)。

## 兩個時鐘與執行緒邊界

**Verified Fact · 標準。** Web Audio 的 render quantum 是圖的運算單位。Web Audio 1.0 為 128 frames，1.1 Working Draft 定義預設 128 並提供可能不獲採用的 `renderSizeHint`。128 frames 在 48 kHz 約 2.67 ms，44.1 kHz 約 2.90 ms，這是單個 quantum 的時間。音訊裝置 callback 週期、`baseLatency`、`outputLatency`、藍牙路徑及端到端輸出延遲應各自記錄。瀏覽器可能合併多個 quantum 供硬體輸出。音訊事件用 `AudioContext.currentTime` 排程，UI 用 monotonic clock 量測。AudioWorklet 適合需要逐 block DSP 或自行餵 PCM 的功能，需檢查實際 block 長度與可用能力。現行瀏覽器圖直接保留已解碼 buffer 與原生節點，這條路徑不需應用層 PCM ring。 [WA-10、WA-11](../../raw/references/audio.md)

**Verified Fact · SDK。** CPAL 可探索 `Host → Device → Stream` 及支援的 sample format、channel count、sample rate 和 buffer 配置。先測預設輸出配置與實際回呼大小，再在裝置允許時掃描固定大小。指定 `BufferSize::Fixed` 是要求，應依實際 frame count 渲染。macOS 先測 CoreAudio 預設有線裝置與拔插。Windows 先測 WASAPI shared、預設／支援週期與 device invalidation，exclusive 另做裝置與使用者互斥測試。Linux 將 CPAL 版本支援的 ALSA 等 host 與實際 PipeWire 路由分別記錄。測試環境應含內建、USB 與藍牙，藍牙只和同一路由比較。 [CPAL、CA、WA-SAPI、ALSA、PW](../../raw/references/audio.md)

**Proposed Design · 桌面原型。** 純聲學 core 生產低頻的結果，控制執行緒驗證並轉成有界的 audio target，例如每聲源的 direct gain、cutoff、位置、穩定 tap ID、delay 與 reverb 參數。介面用既有邏輯對應開始、停止、重試、Raw／Simulated 和錯誤狀態，瀏覽器 graph 與 native DSP 有各自能力。桌面第一個殼使用經目標 WebView 驗證的 Web Audio，native playback 作下一階段實驗。裝置、Tauri IPC、AI、檔案、解碼和聲學 Worker 與 DSP callback 獨立。聲學幀經唯一接納點後供 UI 與音訊使用，native 參數快照保留 frame ID、scene／static generation、revision 和 pose 序號。在 block 邊界接納一份快照，再於音訊 sample clock 以插值、斜坡或等功率淡化過渡，位置與 listener pose 使用該 adapter 定義且經相容性檢查的座標基準。停止或裝置重啟時遞增 generation，舊 IPC／音訊事件因此失效。 [跨平台設計](../platforms/web-desktop.md)

**Proposed Design · 回呼約束。** Native 回呼只擁有預配置 DSP 狀態、前一份完整目標與當前裝置 PCM slice。每次只做有界、可預估的控制讀取、混音、重取樣或轉型及計數。配置、釋放（含最後一次引用銷毀）、mutex、等待、I/O、阻塞式 channel、動態記錄和等待 AI／physics／聲學皆留在非即時端。回呼寫入緊湊數值計數器，由控制執行緒匯出。回呼長度突增時，在預配置的 scratch block 內分段處理，超出支援條件則回報並輸出有界的安全靜音。裝置更換先淡出、停止、釋放並重新協商，再以新 sample rate／通道配置暖機，失敗維持可重試狀態。依測試結果評估大小，例如要求 64／128／256／512 frames 或 host default。週期以實際 `frames / sampleRate` 計算，降低 block 長度須同時驗證 CPU、能源、underrun 與聽感。 [CPAL、PA](../../raw/references/audio.md)

## Buffer 選型

以下為 Proposed Design。(S) 是一份快照或一個 block 的 payload bytes，(C) 是容量，(R) 是 sample frames/s。記憶體估算另加 metadata、暫存與對齊開銷，延遲用實際佔用量量測。

| 策略／用途 | 生產者 → 消費者、所有權及生命週期 | 容量、延遲及記憶體 | 滿／空、失敗 | 驗證方式 |
| --- | --- | --- | --- | --- |
| Single buffer · 回呼輸出、單執行緒 scratch | Native callback 的 DSP → 裝置，單次回呼獨佔裝置借出的輸出 slice。Scratch 為該 DSP 實例專有。 | 1 block 或有限 scratch，約 (S)，無額外排隊。實際裝置週期另計。 | 格式／長度超出支援時分段或填零並報錯。不可並行覆寫讀取中的資料。 | 掃描實際 callback 大小、分段等價、截止時間與 alloc/free 探針。 |
| Double buffer · 有明確交棒的快照 | 控制端寫 back slot，音訊端讀 front；讀者釋放後才允許再寫。確認 slot 所有權後以 release／acquire 發布及接收。 | 2 個 slot，約 (2S)。通常在下一個 block 消費，快寫慢讀會有跳幀或寫入受限。 | 無空槽時合併新目標，無新目標時沿用 front。發布指標的 atomic swap 需要搭配回收協議，避免讀到被覆寫的 slot。 | 高速更新與消費端暫停，驗證無 torn reads、generation monotonicity，量 pose age p99。 |
| Triple buffer · latest-only Native 參數 | 控制端寫入、已發布待取、callback 讀取各有專用 slot；交換使用有界的所有權協議。 | 約 (3S)，多一份待取空間，讀者取得最新完整值，無歷史排隊。 | 過時的未讀值可被替代，空時維持最後已接納值。代碼需涵蓋初始化、停止及交棒競爭。 | 比較 immutable／雙／三槽在突發寫入下的音訊 p99、publication age、drop／alloc；競爭測試含停用及 wrap。 |
| Ring buffer · DSP delay line 或連續 PCM 儲存 | Delay line 是 DSP callback 獨佔的 circular array。跨執行緒 PCM ring 要另定 producer／consumer 與游標所有權。 | Delay line 依最大合法 delay 及插值所需鄰近樣本配置，(C) frames。PCM ring 的排隊時間約已佔用 frames/(R)，容量上限約 (C/R)。 | DSP 回繞由讀／寫延遲距離定義，越界驗證或設為安全值。PCM 由下方 FIFO 規範滿／空。 | Impulse、邊界與 wrap 的樣本驗證，量 measured delay、peak memory、分支與 callback 耗時。 |
| FIFO／SPSC · 一個解碼器到一條 Native 串流 | 非即時解碼執行緒持有寫端，callback 持有讀端，frame 直到被依序取用。多來源各自 FIFO，或由非即時端先合成一個生產者。 | 預配置 (C) frames 或固定 block，設定 low/high water 與啟播預填。記憶體 (C × channels × bytes/sample)。 | 滿時解碼端節流，callback 從不等候。空時預覽淡出至靜音、計數、預填後淡入。裝置中斷、seek、重連用新 generation 清除舊流。 | 設定 jitter、模擬 sample-rate drift、seek 與解碼停頓，比較不同 watermarks 的 underrun／overrun、延遲與 CPU。 |
| Bounded event queue · ordered lifecycle 控制 | UI／IPC → 非即時控制端 → callback。控制端序列化，callback 每 block 最多取固定數量的小型命令。只在需要逐一處理時排隊。 | 容量以 burst 上界及每 block 服務量設計，約 (C × S)。記錄排隊年齡，避免累積過期的 pose。 | 過期 generation 丟棄，佇列滿對非即時送方回覆 busy／retry，停機用獨立 intent／ack 防止丟失。空時無新事件。 | 模擬 start/stop/retry 交錯、裝置切換及洪泛，檢查命令順序、最大 drain time 與錯誤回饋。 |
| Immutable snapshot · 預設的完整聲學幀 | Worker shards → 協調器驗證與合併 → 主端畫面及音訊控制。發布後唯讀，UI／音訊持有目前接受版本，替換後回收。Native 回呼只讀事先準備的固定大小快照。 | 一個 in-flight、一個 coalesced pending 和最新獲採用幀，另加各 shard 暫存；約 (O(S))。延遲由求解、傳輸、接納和跨 block 應用決定。 | 未獲驗證幀不發布，背壓合併，跨 generation 丟棄，無新幀保持上一 audio target，失敗走完整 fallback。 | 連續拖曳、靜態變更、來源重排、惡意 shard、Worker 故障；量 starvation、accepted age、publication p95/p99。 |
| Buffer pool · 反覆使用的固定型別 block | Producer 向池取得有界 lease；IPC／encoder 消費後歸還。Transferable 往返需明確交接；渲染端使用預先配置的資源。 | (C) 個 slot，約 (CS)。可減少配置，常駐空間提高。池大小以並行中的最大 leases 決定。 | 無槽時非即時端 backpressure、跳過可丟預覽或觸發錄音故障；遺失／detached 的 lease 以 epoch 關閉，避免重用。 | 量 allocation/GC、peak resident memory、轉移失敗、漏還、池耗盡後的恢復。 |
| Streaming buffer · 大型資產 | File reader／解碼／重取樣 Worker 生產定長 PCM chunks，播放端按樣本位置消費；僅保有播放窗及預讀。 | 有界預讀加 codec state 與 decode scratch。較大預讀抵抗磁碟／decoder jitter，同時增加啟播及 seek 等待。 | 讀取錯誤、格式錯誤或 underrun 於預覽端淡化、回報、停止或重試；解碼端在 high water 暫停。 | 同 codec、長度與輸出裝置對比 whole-file decode，量首音／seek p95、峰值 bytes、連續播放與錯誤恢復。 |
| Recording buffer · 無損取樣交接 | 裝置輸入或選定的 DSP mix tap → 預配置 SPSC block pool → I/O writer／encoder → 暫存檔。每段包含 monotonic sample-frame index 與 checksum；worker 釋放已寫入的 block。 | (C) 由目標最大可吸收 writer stall 與實測寫入量決定。錄音緩衝的排空時間影響 finalize，另行量測監聽延遲。 | High water 優先降其他非必要負載並告警。滿、裝置斷線、序號 gap 或寫入失敗即標記 take 失敗，保留已完成連續前綴與故障標記供復原。無輸入時 writer 可離線等待。 | 模擬 disk stall／full、權限撤回、掉電、停止同時寫入與 crash recovery；校驗 sample count、順序、hash 與輸出解碼。 |

Thread 間的最新參數用單一發佈者、有界容量、嚴格的 slot 交接與明確的停止協議。採用 `rtrb` 等 SPSC 候選時，先驗證依賴版本、payload 型別的配置和析構、目標架構與實際 callback 堆疊。用小型固定資料與實際有界演算法，回呼內禁止為了 full／empty 無限重試。多消費者 UI 顯示若要觀察 DSP 資訊，以計數器或另一路低頻診斷快照輸出。 [SPSC、Rust Atomic](../../raw/references/audio.md)

## 靜態資料、IPC 與時間同步

**Proposed Design。** 維持現行「大而低頻的 static install、小而高頻的 pose、完整發布」分工。Native core 或 Web Worker 擁有靜態幾何／BVH。前端持有不透明 handle、generation 與可渲染幀，不持有每個 Native Worker 的 BVH 副本。重建期間仍可運作於最後可用狀態，發布驗證依目標 generation。所有 pose、ID 和長度在邊界驗證；UI 與音訊應看到相同 accepted frame identity，兩者實際套用時間分開記錄。Web Worker 目前用 `postMessage` 傳普通結構化物件，之後可用相同資料集實測以下選項。 [傳輸契約研究](../platforms/rust-core.md) · [HTML 結構化資料](../../raw/references/audio.md)

| 選項 | 導入條件與量測 |
| --- | --- |
| 結構化 clone、Tauri 小型 command／channel 訊息 | 保留診斷可讀性，先量 encode／decode、傳輸 bytes、跨邊界等待與到達後 validation。大資料使用 handle，批次合併最新 pose。避免 WebView IPC 載入逐 block PCM。 |
| TypedArray + Transferable ArrayBuffer | 需要顯式 binary layout、版本、長度、alignment、endian、f64 或其他經證明的精度。轉移底層 ArrayBuffer 會 detach 舊 view，須重新建立 view 或明確交還 lease。從原始物件打包、WASM 線性記憶體來回及接收驗證仍可能複製。以端到端資料測試實際 copy bytes、pack/unpack 時間與 p99，不能以 API 名稱推斷零拷貝。 |
| SharedArrayBuffer／Atomics | 多 agent 同一 agent cluster 且跨來源隔離能力符合要求時才試。先驗證 COOP/COEP 對第三方資源與部署的影響，以及瀏覽器／WebView 支援。需要無撕裂發布、所有權和生命週期協議。和 clone／transfer 同樣負載對比，保留無隔離 fallback。 |

## 資產與正式錄製

**Proposed Design · 已解碼記憶體。** 壓縮 Blob 的配額與 PCM 預算分開。Float32 PCM 以 (duration × sampleRate × channels × 4) bytes 粗估，另加 decoder、原始 Blob 與分配開銷。48 kHz 單聲道 10 分鐘的 Float32 PCM 約 110 MiB，這是估算。可先以 cache hit/miss、in-flight decode bytes、active/retiring graph pin、GC 與常駐記憶體量測，若確認累積才試依 bytes 的 LRU、快取按 clip/版本與 sample rate 分代及並發解碼限制。播放中及淡出中的資產需要 pin，淘汰選不再引用的項目，memory-only 與 relink 提示保留。大檔 streaming 原型另行量測解碼、重取樣、seek、codec 支援與權限。 [WA-10、IndexedDB](../../raw/references/audio.md)

**Proposed Design · 錄音與匯出。** 先定義錄製點（裝置輸入、Raw 或 Simulated mix、是否 post-master）、sample format／rate／channel map、起始 sample index 和對應場景版本。Native writer 將有界 PCM chunks 按序寫同一檔案系統的暫存 take，記錄已確認段落、frame count、hash 與格式。停止後排空、驗證、完成 header 或 container、執行符合平台的 flush 與最終 publish／replace。Crash 後只復原可驗證的連續前綴，保留失敗證據，使用者明確另存。Writer 已滿時無法回推硬體時鐘或等待消費，應停止 take 並顯示失敗，禁止無聲補樣並標作完整。48 kHz 雙聲道、每樣本 4 bytes 的輸入率為 384,000 bytes/s。選定最大容許 writer stall 後，以輸入率乘上 stall 秒數，加上在途 blocks 與測得餘裕來估容量。WAV 長度上限及 RF64／分段策略須隨格式一併驗證。若錄 Float32 並選 FLAC，要先確認規格及是否可保留既有 PCM 表示；量化成整數是獨立格式決策。Web 可評估 origin storage、OPFS 配額與檔案權限的 chunks，`MediaRecorder` 當快捷預覽匯出候選，codec、可恢復性與無損能力另驗證。當權限不足時明確拒絕正式錄製，不能默默改成 memory-only 長錄。 [FS、REC、RF64、FLAC、Win Replace](../../raw/references/audio.md)

## 測量入口與採用條件

- 重用 [Chromium opt-in render-capacity spec](../../../tests/e2e/audio-render-capacity.spec.ts) 作可比較的虛擬輸出診斷，記錄 `renderCapacity`、callback interval mean/variance 與 accepted revision。新增測試之前先收集 source count、HRTF 設定、Raw／Simulated、tap 活躍數、sample rate、瀏覽器版本與背景工作。利用離線波形檢查 RT60、delay、滑動期間的相鄰樣本幅度與削波。
- 在 Windows、macOS 實機以同一場景與操作腳本跑 idle、拖曳、密集反射、靜態重建、最大來源、解碼換檔及長時負載。用開發版有界 telemetry 收集 callback duration/budget p50/p95/p99/max、裝置 underrun／overrun 或可信代理值、queue watermarks、GC、每次分配、CPU、peak memory、裝置變更恢復時間。取樣放在回呼之外，比較探針開關的成本。
- 同步記錄 editor timestamp、送出及收到 Worker／IPC、accepted frame ID、AudioParam 排程／Native DSP 套用的 sample index，分開計算「互動到已採用」、「已採用到音訊套用」、「實體出聲」。若需實體出聲時刻，用共同參考訊號及 loopback／測量設備，報告裝置、音量與路由。聆聽驗收仍是獨立的操作者結果。
- 各條件交錯重跑，分開冷啟、暖機與持續運行。保存完整 per-run 記錄、失敗與擾動。對照 [Benchmark 矩陣](../performance/benchmark-plan.md)，沿用正式門檻。新門檻先用基準方差與場景定義書寫，再揭露實驗數據。
- Native callback 應在測試負載與故障注入下維持有界執行，錄製成功的 take 必須逐樣本完整。若額外緩衝對同一裝置和負載沒有可重現收益，保留目前瀏覽器圖、不可變獲採用幀與簡單傳輸；若跨平台出現音色、tap 或空間定位差異，先釐清 DSP／HRTF 的語意與量測，再決定如何公開標示。
