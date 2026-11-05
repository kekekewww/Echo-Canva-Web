# 聲學運算最佳化研究

狀態 **Proposed Design**，對照 2026-11-06 的 [Web 基準](baseline.md)、[基準版本](../../raw/sources/repository.md)及[第一手來源](../../raw/references/performance.md)。以現行 TypeScript 為數值 oracle，保留固定品質、有限幾何、排序、場景相容性及 Worker 安全驗證。優先做不改模型的單變項實驗。

## 定位瓶頸再決定介入點

先用現有 Chromium 驗收、Classic/Hybrid serial 與連續拖曳 harness 建立同機重現。trace 切開 projection、靜態編譯、Worker install/clone、job 等待、每 shard kernel、reply queue、hostile payload validation、assembly、presentation、React commit 和 AudioParam apply。渲染負載、CPU time、allocation 與運行記憶體須同時記錄。任一探針或 tracing 增加的負擔在診斷批次單獨標記。[基準與計時邊界](baseline.md) · [量測規格](benchmark-plan.md)

| 研究順序 | 成本訊號 | 最小實驗與採用門檻 |
| --- | --- | --- |
| 1. 暖態反射腿與候選 | **Confirmed by Profiling（歷史）**。BVH/intersection/validation 和 GC 曾出現在 hot stack。**Not Yet Measured**。目前各子步的長尾占比。 | 先量每 source 的 candidate、node visits、patch tests、early-out、valid paths、各階段 allocation。用同輸入、同順序核對每個輸出。針對占比高的步驟單獨 A/B，必要時再查 Worker 與 main 重疊。 |
| 2. 冷態、幾何常改 | **Confirmed by Code Inspection**。Hybrid 編譯建 BVH，Worker 各存一份安裝資料。**Hypothesis**。cold static install 可能在高 patch／多 Worker 時吃掉收益。 | 分開量編譯、單 Worker install/ack、pool-ready、first frame 與每次結構改動後的記憶體峰值。warm pose-only 另做控制組。 |
| 3. React／Audio | **Confirmed by Profiling（歷史）**。eager projection、UI render、GC 和 graph automation 曾有成本，後續已合入 lazy/stable projections、pose-lagging 和 AudioParam 去重。 | 新 build 以 Perf/React 診斷區分 commit、layout、paint、效果套用與 Audio render capacity。以同一拖曳軌跡切換 overlay／playback，記錄受影響的 render 次數、pose age 和音訊連續性。 |
| 4. 跨 runtime 對照 | **Not Yet Measured**。Rust compute、WASM 邊界和 Desktop IPC 的交叉點未知。 | 分別量 TS serial/Worker、Rust native serial/parallel、WASM main/Worker、Desktop IPC，切開 cold/warm、codec 與 kernel。候選必須先過數值與端到端基準。[Rust 移植](../platforms/rust-core.md) |
| 5. Adaptive preview | **Hypothesis**。在長尾常見的低資源機，控制 dispatch 與呈現頻率可能降低飢餓。 | 實驗模式要以同負載固定模式為控制，報告 queue、pose age、每秒 accepted frame、音訊與模型差異。保留固定品質測量和輸出模式。 |

## Geometry 與 BVH

- **Verified Fact**。Hybrid binary BVH 以最長 AABB 軸排序 centroid 後取中位切分，葉節點最多四個 patch。同 centroid 用 ID tie-break。建樹的反覆排序、centroid 重算、陣列複製與 AABB union 各有成本。均衡二元分割每層對分割後陣列重排序，若排序比較上界為 O(P log P)，整棵建樹的比較上界為 O(P log² P)。單次 segment query 可跳過不相交的子樹，重疊很高的情況仍可能拜訪線性數量的 node／patch。全交點結果另做距離／ID 排序。[BVH 程式](../../../src/acoustics/hybrid3d/bvh.ts)
- **Proposed Design**。沿用靜態上下文 cache。先測以 stable patch index 預存 centroid 和 bounds、以 contiguous nodes 代替樹狀 object 的收益。分開比較現有 median split、相同 leaf budget 的固定桶 SAH、以及將葉 budget 作為單獨變量。每個 variant 記 build latency、node visits、patch tests、bytes、分布尾端和有無相同全交點順序。[PBRT 第四版，PERF-S01](../../raw/references/performance.md)
- **Hypothesis**。相同 patch 拓樸與 identity 的 endpoint/height 小變動，refit 可能減少重建。任何新增／刪除、開口拓樸改變、primitive tessellation 改變走完整 rebuild。只在專案 fixture 量到頻繁局部編譯值得介入時試作。refit 對每一代輸出新的 immutable generation，重新量 node overlap、訪問數、refit/rebuild time，品質衰退時 rebuild。pose-only 繼續走快取而免 refit。[動態 BVH 研究，PERF-S02](../../raw/references/performance.md) · [靜態 compiler](../../../src/acoustics/hybrid3d/compile.ts)
- **Proposed Design**。同一 source/listener pose 的腿可以在保留結果索引的前提下 batch，測共享 origin、空間鄰近性、預算下的 scalar loop 和 SIMD packet。過度分散的 rays 可能造成 lane divergence。布林反射可見性維持現有 early-out，需保留 reflector allowlist 與 Portal aperture。直達／透射、排序診斷保留完整交點與 tie-break。[反射可見性](../../../src/acoustics/hybrid3d/reflections.ts) · [有限 patch oracle](../../../tests/unit/hybrid3d-visibility.test.ts)
- **Proposed Design**。Classic segment scan 若在固定 100 walls 上量到熱點，先做不可漏碰撞的粗 AABB 篩選或重用已編譯 segment/material/portal lookup。以端點、平行、共線 overlap、開口及排序的原始 oracle 驗證，Classic 的 2D 幾何與 Hybrid 有限 patch 保持各自合約。[Classic geometry](../../../src/acoustics/geometry.ts) · [Classic oracle](../../../tests/unit/geometry.test.ts)

## Reflection Solver

**Verified Fact**。令 `S` 是 active sources、`P` 是代表性反射面、`B` 是第二階受限的 surface budget。Hybrid 一階每 source 先找代表 patch，全 frame 最多約 `2SP` 次可見腿查詢，候選再排序。經選面後二階有至多 `B(B-1)` 有序 pair，每組有效候選最多三條腿。現行 Hybrid direct frame 只在 direct blocked 時呼叫二階，`B=24` 最多 552 pairs/source，先剪長度（預設 50 m）與估計中頻 gain（預設 -36 dB），再依路長、ID 取至多六個。非窮舉 runtime，有限規模（最多 32 代表 patch）的 exhaustive reference 用於測試。Classic 也使用 blocked 條件及有界二階搜尋，保留自己的排名、材質與 tap 合併行為。[Hybrid 求解](../../../src/acoustics/hybrid3d/direct.ts) · [二階實作](../../../src/acoustics/hybrid3d/second-order.ts) · [Classic ISM](../../../src/acoustics/image-source.ts) · [Allen／Berkley，PERF-S03](../../raw/references/performance.md)

| 候選最佳化 | 需保持與驗證 |
| --- | --- |
| 靜態 generation 快取 representative patches、plane 常數、material band amplitudes | 減少每 source 濾 patch 和 material lookup。每次幾何或材質改動須失效。保持有限面、Wall front 選擇、代表面 ID 及 band 公式。 |
| 每 source 在 rank 前預算一次 image point 與 projected length | 目前 Hybrid sort comparator 重做計算，且部分 pair 的 image point 在剪枝與求解重算。以 exact pose/source/geometry 鍵測中介重用。在等距與近等距 tie 檢查完整路徑 ID 順序。 |
| 剪枝及 top-K | 先測既有 `orderedPairs`／`pathLengthPruned`／`energyPruned`／`evaluatedPairs`／`validPaths`／`topKPruned`。維持同一總順序和既有候選集合時才試 bounded selection。近似距離、降低 budget 或新可聽門檻列為模型差異，另比較 exhaustive recall、能量偏差與聽測。可重用 [second-order evaluation](../../../src/acoustics/hybrid3d/second-order-evaluation.ts) 的 precision、recall、delay RMSE 與 retained mid energy。 |
| 可見性 cache／incremental | 精確 segment、reflector allowlist、Portal/patch generation 都相同才可重用。任一 pose、開口、遮擋物或 geometry version 變動應失效。跨連續 pose 的「仍可見」推論屬未驗證近似，預設延後。以 cache hit rate、memory、false positive 和 stale hit 數作決策。 |
| Higher order | 所有有序候選近似隨 `P^k` 成長，實際由幾何、有限合法路徑和剪枝決定。獨立離線規格與 fixture 先量成本、coverage、精度，再評估是否適合互動。P5/P6/P7、FDN 和 ray-parameterized reverb 為另線研究。[PERF-S04、PERF-S05](../../raw/references/performance.md) |

**Rejected Approach（本研究建議淘汰）**。移除 main 端 hostile payload 驗證或幾何覆核以取得更小的表面 pool timing。安全與完整性測試是固定條件。若 profile 確定主因為驗證，應量可重用的查詢／索引、或另以信任邊界設計及測試評估 IPC 封包，維持全部 stale、malformed、over-budget 及 partial frame 拒絕。[Hybrid 驗證](../../../src/workers/hybrid-direct-pool.ts) · [歷史驗證調查](baseline.md)

## Native 與 WASM

| 階段 | Proposed Design | 驗證 |
| --- | --- | --- |
| Native scalar | 從可讀的 `f64` AoS 與 reusable `Vec` scratch 起步，輸出按穩定索引歸併。靜態 generation 一次建 geometry/BVH、引用共享。scratch 每 job/worker 擁有，frame publish 完成才移交，避免結果仍被讀取時回收。 | release／target flags 明確，測 allocation count/bytes、峰值 RSS、steady-state、尺寸倍增；保留邊界 epsilon、比較器、source/path order。 |
| Native memory layout | profile 指向訪問 locality 時，隔離 contiguous node、SoA AABB/plane 或 per-worker arena。SoA 方便同欄位 SIMD，AoS 可能更適合每次要用全部欄位的有限 patch 求交。arena 設高水位與生命週期，歸還後不可持有指標。 | 同 input 比較 allocated/resident/peak bytes、cache-miss proxy、分支事件與 p95/p99。分配對齊按 target 與 layout 驗證，避免假定 CPU cacheline 大小與裝置相同。 |
| Native parallel | 先測固定大小 Rayon pool，按 source 或靜態 candidate chunk，執行緒在 audio callback 外。source 少或工作細碎時選 serial，避免多層 pool 競爭。跨 chunk 合併排序與 any-hit 結果維持 deterministic。 | 1/2/4 threads 及主機適合的上限各跑，量 idle／load 下 worker CPU busy、queue wait、tail、CPU/energy、音訊 deadline。應用分派由測得 crossover 控制。[Rayon，PERF-S06](../../raw/references/performance.md) |
| SIMD | 先處理經證明熱的 batch AABB／dot 或整齊 layout。Native x64／arm64 各具 scalar path，WASM scalar 與 SIMD artifact 做 feature detection。 | 與 scalar 同 build 模式，測 alignment、lane 使用率、分支、標量 fallback。比較相近幾何與排序，避免 FMA／relaxed semantics 讓分類在 epsilon 邊界翻轉。[Rust wasm32，PERF-S07](../../raw/references/performance.md) |
| WASM + Worker | 一個長壽 Worker 掌握 WASM instance 與靜態 handle，送批次 pose/job。先量 typed-array staging、線性記憶體 copy、序列化、compile/instantiate 與 steady-state。無 Worker 測法只在受控 harness；產品保有 TS fallback。 | 比較 JS object clone、Transferable ArrayBuffer 與一次呼叫批次資料，記 bytes、encode/decode、main occupancy、heap/linear memory peak。transfer 使 sender 放棄該 buffer 的所有權，跨 JS/WASM heap 仍可能 copy。 |
| WASM 記憶體 | 把 `memory.grow` 當作 view lifetime 邊界。對 reuse pointer/offset 加入容量、對齊與 generation 檢查，fixed-length view 按需求重取，將 JS 記憶體和 WASM heap 分開量。 | 測 cold/warm、低記憶體、超容量、grow 後 view、取消及 Worker 重啟。先記記憶體高水位和增長次數，再試預留容量。[JS API 與 transfer，PERF-S08](../../raw/references/performance.md) |
| WASM threads／SAB | 列為後期實驗。需 COOP/COEP、cross-origin isolation、依賴載入與能力檢查，再比較共享記憶體同步成本、部署影響與每一 target 的回退。 | 壓測 non-isolated、isolated 與 target browser/WebView，確認 Worker、外部資源、錯誤／回退，數值順序不隨完成順序改變。[Rust Web 支援與 Chrome isolation，PERF-S07／S09](../../raw/references/performance.md) |

## Rendering、Audio 和品質控制

- **Proposed Design**。保持持久 graph、tap slot key reuse 和等值 AudioParam 更新去重，個別量 tap retune、HRTF/equalpower、filter update 與 graph lifecycle。先用同音量同曲線的離線 regression 排除聲音差異，再用固定取樣率／裝置／buffer 的長 session 測 xruns 或有效的 loopback signal。生產預覽不得只憑 headless render capacity 調整 `latencyHint` 或六 tap budget。[音訊與 Buffer](../audio/buffers.md) · [CDP 歷史證據](baseline.md)
- **Proposed Design**。量 React commit 次數及 render/paint 期間的主執行緒占用。以 source drag、純相機運動、選擇／Inspector、路徑 overlay 和頻繁結構更新各別取樣。若 presentation 明確占用尾端時間，先試穩定 props、只計可見診斷、依 accepted frame 排程 UI。保留 editor pose 當下響應及路徑／音訊同一已接受 revision。LoAF 可補充呈現長幀，現有 Chromium Long Tasks 驗收維持原指標。[React／Chrome／W3C，PERF-S10／S11](../../raw/references/performance.md)
- **Proposed Design**。Preview 可實驗分級。先減少 visualization detail，觀察 queue age／render frame；再在現有 10–15 Hz 調度範圍內試 acoustic cadence 或 admission，保留一個 in-flight 和一個 pending latest 的 backpressure。不同等級標出實際使用模式、切換原因、在 load 恢復時的 hysteresis 和最低停留時間。只處理 presentation、cadence 或候選預算其中一項，以定位收益。
- **Proposed Design**。反射候選降級影響模型，須顯式 opt-in、有品質標記及可重現固定高品質模式。高品質比較沿用當前預算、固定 seed、完整輸出與 stable 排序。可丟棄舊 preview frame 的決策不適用正式錄音或離線匯出。任何採用需同時檢查 p95/p99、pose-age、錄音完整性、聽感和 cross-platform numerical parity。[驗收規格](benchmark-plan.md)

## 驗證與回退

保留既有 12/50 ms gate。A/B 採交錯順序與獨立重複批次，記每次結果、效應量、波動、失敗及診斷 trace。先定義本次試驗的主要指標與可接受的次要回歸，使用同一 fixture 版本、同 machine/runtime/tier 與 audio mode。候選只有在量到可重現收益且現有數值、故障 fallback、主執行緒和音訊門檻全數通過時才進入 ADR review。未達標時保留現行 TS 路徑、固定品質與原始資料，回退單一實驗 feature。
