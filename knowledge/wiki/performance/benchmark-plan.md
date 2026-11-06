# 跨平台 Benchmark 與數值驗證規格

> Proposed Design · 2026-11-06 · 程式碼基準為 [main @ 98a4374](../../raw/sources/repository.md)。

[目前效能證據](baseline.md) · [計算最佳化](optimization.md) · [跨平台驗證提案](../decisions/0003-cross-platform-testing.md) · [音訊與 Buffer](../audio/buffers.md)

## 1. 既有基準與可執行入口

- **Verified Fact**。Classic 的十場景測試把計算輸出投影、取小數六位，再與核准 JSON 逐欄比較。它是數值 oracle，缺少 wall-clock 量測。另有 data-only P5 stationary benchmark 比較採樣數、連接率、能量波動，適合驗證 P5 的重現性。產品聲學效能需另用執行路徑量測。[Classic 產生器](../../../src/benchmarks/classic-baseline.ts) · [Classic oracle](../../../benchmarks/results/mvp-baseline.json) · [P5 測試](../../../tests/unit/hybrid3d-receiver-connection-benchmark.test.ts)
- **Verified Fact**。目前 Chromium 全實體 fixture 有 100 walls、8 Portals、4 sources、8 listeners，三次 warm-up 後切 listener 24 次。收集 24 筆相異的完整 Worker sequence、前進的 accepted revision、正確 Worker count 與有限非空 timing。原 gate 為 nearest-rank Worker compute p95 **嚴格小於 12 ms**，24 次測量視窗內觀察到的 Long Task 均 **≤ 50 ms**。另一個 100-wall Outliner case 對點選測得的時間要求 **嚴格小於 50 ms**。此 p95 對 Hybrid pool 的 wall duration 取樣，從 dispatch 開始到結果齊備時的 timestamp，結束點在 frame assembly 前。它與最慢 shard、各 shard 累計及 input→accepted elapsed 分開。[現行壓力測試](../../../tests/e2e/workspace.spec.ts) · [Hybrid pool 計時](../../../src/workers/hybrid-direct-pool.ts) · [人工驗收](../../../docs/ACCEPTANCE_TESTS.md) · [歷史波動與缺口](../../../docs/maintenance/REMAINING_TECHNICAL_DEBT.md)
- **Verified Fact**。Web Audio 離線測試驗證衰減、跨淡化連續性和遮擋後高頻能量。歷史 audio JSON 的數字屬其標註的 commit，執行當前案例使用現行測試名稱。CDP render-capacity 測試是 opt-in 的 Chromium 診斷，採樣的是瀏覽器 render-capacity、callback interval 和拖動期間觀測的 revision 子集。真實輸出中斷仍需硬體證據。[離線測試](../../../tests/e2e/audio-rendering.spec.ts) · [歷史音訊 artifact](../../../benchmarks/results/mvp-baseline-audio.json) · [CDP 測試](../../../tests/e2e/audio-render-capacity.spec.ts) · [聽測程序](../../../docs/testing/browser-listening.md)

使用 repo 指定的 Node 和 pnpm、乾淨且獨立的 checkout，記錄 SHA、lockfile、browser build、環境與每次結果。以下為現有命令，執行各段前確認 port 3000 可用且 Playwright 瀏覽器已安裝。完整產品 gate 仍以 repo 的 `pnpm verify`／CI 與人工驗收為準。

```sh
pnpm install --frozen-lockfile
pnpm test tests/unit/classic-baseline-capture.test.ts tests/unit/hybrid3d-receiver-connection-benchmark.test.ts
pnpm exec playwright install chromium
pnpm build
pnpm exec playwright test tests/e2e/workspace.spec.ts --grep "survives the full entity-limit" --workers=1 --retries=0
pnpm exec playwright test tests/e2e/audio-rendering.spec.ts --workers=1 --retries=0
```

PowerShell 另跑一個獨立行程以記錄播放負載的 opt-in 診斷。該行程應沿用同一個 production build。

```powershell
$env:ECHO_AUDIO_BENCHMARK = '1'
try {
  pnpm exec playwright test tests/e2e/audio-render-capacity.spec.ts --workers=1 --retries=0
} finally {
  Remove-Item Env:ECHO_AUDIO_BENCHMARK
}
```

每次執行後保存 `test-results` 內對應的 metrics JSON、stdout、stderr 與 exit status 到獨立 run 目錄，避免下一次 Playwright 清理覆蓋。保留失敗與所有 retry 的紀錄。Run 失敗在採樣完成前時，記錄缺失階段與測試錯誤。命令、toolchain 及 Chromium 啟動方式可回溯至 [package.json](../../../package.json) · [Node 版本](../../../.nvmrc) · [Playwright 設定](../../../playwright.config.ts)。

## 2. Variant 矩陣

以下矩陣為 **Proposed Design**。現有程式可執行 TS serial 和 Worker pool，各階段的統一 harness 與新 backend 待實作。Classic 與 Hybrid 分別對照自己的 oracle。純 kernel、solver job、完整互動與音訊分開報表，避免混用邊界。

| ID | Variant / 現況 | 比較方式與執行邊界 |
| --- | --- | --- |
| TS-S | TypeScript serial，現有 | 現行 pure Classic／Hybrid serial adapter。分開計量同一 JS runtime 上的建圖、warm solve、完整 frame assembly。瀏覽器測試版從同一 editor 派 job 到 production fallback。Node 只作 core 檢查，和瀏覽器結果分欄。 |
| TS-W | TypeScript Worker Pool，現有 | 同一 corpus 呼叫 production pool，保留 static install ACK、shards、驗證與 coalescing。以原 policy 為首，額外標記 1/2/4 threads 與實際上限的單變因研究。 |
| RS-S | Rust native serial，待實作 | 同一輸入、相同演算法子集與結果欄位。獨立 runner，release profile，分開記 input decode、static compile、pose solve、frame assembly。 |
| RS-P | Rust native parallel，待實作 | 同一 binary／工作範圍，以固定的 1/2/4 compute threads 對照 RS-S。合併按輸入順序與原 tie-break，報 wall critical path 和 CPU time。 |
| WA-S | Rust WASM，待實作 | 同一瀏覽器以單 thread module 跑 core。另列冷啟動 compile/instantiate、JS glue、memory growth 與 warm calls。主執行緒量測以受控 harness 執行，UI 佔用須另記。 |
| WA-W | Rust WASM + Worker，待實作 | 從單一持有 static context 的 Worker 起步，以相同頁面對 TS-W。記錄 JS↔Worker 與 JS↔WASM 兩條邊界及有無傳輸 ownership。多 Worker/WASM threads/SIMD 另作 feature 列，記 isolation 與 fallback。 |
| IPC | Desktop IPC pipeline，待實作 | 正式模式 WebView → Tauri → bounded Rust job → 驗證 → accepted frame → overlay/audio parameter handoff。同機加設 WebView TS control，另測空回應、固定大小 echo、真實 frame，定位 encode、crossing、queue 及 decode 成本。 |

只完成 Direct 的 prototype 記錄在 Direct 子矩陣，完整 Reflection／RT60／audio 流程欄位標為 `not-implemented`。Canonical baseline 在每組固定反射候選 budget、材質、速度、輸入序列及輸出欄位。固定品質實驗與 adaptive 獨立，各自收集每個品質檔位及變檔事件。

## 3. Corpus 與場景矩陣

固定順序的 fixture 清單存來源 commit 或生成器版本、seed、完整 PRNG 演算法及版本、輸入座標、active ID、限制與授權。場景輸入使用現有 schema 可驗證的 JSON。每個檔案與 byte-for-byte 事件 tape 固定 UTF-8/LF，manifest 保存逐檔 SHA-256。記錄模式、精確牆/Portal/primitive/有效面數、啟用 Source、active Listener、靜態安裝策略、事件頻率、視窗、反射候選數與 seed。重跑取同一 corpus SHA 和 event tape，不依賴不同平台即時生成排序。授權可重用的現有 fixtures 或合成音訊進 repo，測試私有音訊時只留下去識別的量測資訊。

| Case | 起始素材與控制變因 | 主要比較 |
| --- | --- | --- |
| S1 Small | Hard Room，1 source，靜態 listener。兩個引擎各用自己的投影。 | kernel、cold/warm、跨邊界成本 |
| S2 Medium | Concrete Partition 改編 25 牆、2 Portals、2 sources。固定 open/closed 子例、房間與材質。 | direct/blocked/portal 比例、選路及 cache |
| S3 Complex | 沿用 100/8/4/8 瀏覽器 fixture；另用 Hybrid rotated Box/Cylinder/Sphere 增加 patch 數，Classic 另做合法 footprint，兩種最大壓力分報。 | compile、BVH、main thread、worker p95/99 |
| S4 Multi-source | 同一場景與 pose tape 下分 1、2、4 個啟用 source，剩餘輸入相同。 | shard scaling、busy time、組裝 |
| S5 Continuous Listener | 固定 60 Hz、60 秒連續 listener pose tape，在牆前後與開口邊緣移動。另有 source 拖曳 control。 | lag、drop、throughput、accepted age |
| S6 Frequent Static Edit | 30 秒中以固定 5 Hz 交替 wall endpoint/material、Portal toggle、primitive pose，與固定 60 Hz listener tape 交錯。 | invalidation、reinstall、舊 geometry 結果拒收 |
| S7 Reflection Heavy | 有界硬質場景，blocked direct、達候選預算、高對稱 tie、反射點靠近面邊；open path control。 | first/second-order 評估量、保留路徑、tap ranking |
| S8 Long Session | 60 分鐘重播 S4/S5/S6，固定 idle 段落與 preset reload 點。獨立跑至少三次。 | RSS 斜率、GC、cache 回收、thermal drift |
| S9 Playback Under Load | 固定 clip/hash、兩種 sample rate/device profile、idle vs. S3/S5，校準 loopback、拖曳、切換播放模式。另做 device-loss/recovery。 | audio deadline、缺樣、latency、CPU 競爭 |
| S10 Fault / Backpressure | 注入 delayed/missing/duplicate shard、Worker deny、stale fingerprint、native cancel/restart、malformed frame。相同輸入序列。 | 原子採納、queue bound、fallback 與 recovery time |

實作狀態：S1–S7 的 TypeScript 部分已由 [EC-101 固定語料](../../raw/sources/ec-101-corpus-baseline.md) 實作，待獨立驗證。S8–S10 尚未實作。

S1–S7 適用 7 個 variants 的共同 workload，能測哪些層由各 variant 能力決定。S8 追加 TS-W／WA-W／IPC 壓力。S9 僅在連接真實 renderer 的完整路徑執行，必要時含 TS-S fallback。S10 依各 adapter 支援的邊界執行，純 core 僅測輸入錯誤及取消合作點。Audio opt-in 10 秒輸出保留為現行短測，額外長時驗證另用此規格。

## 4. 計時、採樣與環境

1. **Cold / warm 分離。** 冷啟動取 10 個新頁面／行程各自的首個有效 frame，清楚標註 HTTP cache、WASM cache、Worker/IPC 啟動和首次 static install。熱測每種 scene/variant 暖機 100 個 job 或 5 秒取較長者，每組至少 5 個獨立行程。短 workload 每行程目標 ≥ 1,000 次完整 job，互動 case 可以重播 tape 取得足量樣本，保留每段完整事件和休息窗口。原 24-sample gate 照原樣執行。未達採樣目標的 p99 標探索性並保留樣本數。
2. **同機配對。** 至少一台 Windows x64 和一台 macOS arm64 實機，分別跑同機 A/B；Ubuntu/Windows CI 做決定性功能與可用性檢查。配對內同 OS、同實體硬體、相同 concurrency cap、browser/WebView build、電源方案、音訊設定與負載，交錯 A/B 順序以減少熱偏差。跨機器報各自分布，跨平台彙整報相對同機 baseline 的變化。Headless/headed、實機/虛擬、cold/warm、開電/省電分組。
3. **可比較的 build。** 使用 production Next build、Chrome/Edge 版本及 WebView runtime 明記。Native 記 `rustc -Vv`、Cargo、target triple、`Cargo.lock`、profile、`opt-level`、LTO、codegen units、CPU/SIMD flags；WASM 額外記 `wasm-bindgen`／打包工具、target/features、threads、memory 和 COOP/COEP。Latency 測試使用 release；除錯符號與 profiler 的成本另外測。[Cargo Profiles](https://doc.rust-lang.org/cargo/reference/profiles.html)
4. **同 clock 量 duration。** Browser 主執行緒用 `performance.now()` 打同一 trace ID 的 input、enqueue、dispatch、receive、validated/accepted、overlay commit、audio parameter schedule。Worker 回傳自己 clock 的 encode/build/solve durations；Native 同行程用 `Instant` 記每階段。WASM 無宿主時計依賴，從 host 計批次 elapsed。跨 clock 資料依 trace ID 合併，跨時鐘 one-way 時間需另行校正並記 uncertainty；直接報主執行緒量到的 dispatch→response roundtrip，避免用未同步 timestamp 相減。樣本短於時鐘解析度時以多次 batch 加 checksum 防最佳化消除，單列 harness overhead。Audio schedule、browser render 與 loopback 的物理輸出時間分開記錄。[W3C HR-Time Level 3 Working Draft 2026-11-04](https://www.w3.org/TR/2026/WD-hr-time-3-20261104/) · [Rust std 1.99.1 Instant](https://doc.rust-lang.org/std/time/struct.Instant.html)
5. **通量與尾端。** 每 run 報 `N`、p50/p95/p99、max，nearest-rank 取 `ceil(p*N)`，保留原始未四捨五入數字、每 run 統計、配對差值與離散程度。需要區間時，以配對 run 為重抽樣單位（連續 tape 可依時間 block），附 CI 種類與 seed。記錄 submitted/coalesced/completed/accepted/stale/fallback/error/timeout 各分母，將最新 pose 的等待（含未採納的 censored 樣本）與 accepted latency 並列。超時與崩潰有專屬紀錄。標記測量工具造成的額外負荷，無 profiler 的主要 pass 和帶 trace 的診斷 pass 各自保留。
6. **環境指紋。** 記日期時區、fixture/runner SHA、CPU 型號/架構/核心、RAM、OS build、電源模式、起訖溫度、背景程序、browser visibility、實際 worker/threads、音訊設備/driver/backend/route/sample rate/buffer frames、trace 工具及抽樣頻率。鎖定變因並保存開始與結束 clock 校準、執行順序及中斷資訊。熱降頻、睡眠或 noisy neighbor 以具名標記保留原 run。實驗前固定可排除條件，報含／不含該組的敏感度。

## 5. Metrics 與 evidence 格式

| Metric | 邊界、採樣與單位 |
| --- | --- |
| Compute time p50 / p95 / p99 | 分項 static compile/BVH build、visibility、first/second-order、material/room、assemble、validate。並行報 job elapsed/最慢 shard 和各 shard CPU time，後者依 profiler 能力填寫。 |
| End-to-end latency / throughput | Input 到對應 trace accepted，另記 accepted→overlay commit/AudioParam schedule。報 accepted frames/s、有效 pose age、coalescing/drop rate、queue depth、完成時間與 fallback 使用比例。 |
| Main-thread occupancy | Trace 量 renderer main-thread busy time／wall time、per-event task duration、rAF/render cadence。Chromium 長任務用現有 observer，先檢查 API 支援並在獨立 control 注入已知 >50 ms block 驗證 telemetry；無支援標 `unavailable` 並附 trace 診斷。 |
| Worker utilization / CPU | 每 Worker/thread 的 busy wall time／window、host measured CPU core-seconds、context switches／run queue。進程樹含 renderer、Worker、WebView/native backend，清楚標 CPU 百分比是單核還是整機。 |
| IPC / serialization | 同端 encode/decode、bytes/msg、messages/job、queue wait、dispatch→response。Structured clone/transfer/SAB/native binary 只在相同語意與 payload 比較。由 profiler 或可驗證 ownership 路徑確認 copies；只取得 bytes 時標為傳輸量。 |
| Allocation / peak memory / GC | 分 JS heap、WASM pages、native allocations、process tree working set/RSS，報 alloc count/bytes、峰值、steady p95、清理後 retained、GC 次數與 pause distribution。多行程共享頁可能重複計數，注明工具及口徑。 |
| Audio continuity | 保留 `OfflineAudioContext` 的數值輸出。CDP render capacity 及 callback interval 是 browser load 指標。實體 loopback 用固定音訊計數／對齊標記測 expected frame count、gap、click、saturation 與輸出延遲。Native 另外記 callback duration/deadline、missed callbacks、xrun、underrun/overrun、設備重開及記錄 sample count。 |
| Numerical error | 每欄位報 max/median/percentile absolute error、適用時 relative error，列首個反例、field path、input seed、模式、expected/actual 和被觸發的 branch。Exact-ID/order 及 visibility mismatch 逐件列。 |
| Energy / thermal | 同機同電源設定報 CPU core-seconds/job、頻率/溫度、是否 throttle，工具支援時記同測量域的 J/job 或能耗估計。不同 OS 的 proxy 分欄。未能採集功耗時填 `unavailable`。 |

Trace 技術參考於 2026-11-06 檢閱。CDP WebAudio/Tracing 為 Chromium Tip-of-tree 診斷介面，使用固定 Chromium build 並記錄可用欄位。Long Tasks Level 1 的 W3C 文件目前為 Discontinued Draft，現有 Chromium gate 繼續使用，其他引擎需記能力與 trace 方法。Windows 可用 WPR/WPA ETW。macOS 可用 Instruments 的 CPU/Allocations 觀測並記錄 Xcode 版本。[CDP WebAudio](https://chromedevtools.github.io/devtools-protocol/tot/WebAudio/) · [CDP Tracing](https://chromedevtools.github.io/devtools-protocol/tot/Tracing/) · [W3C Long Tasks 2026-10-20](https://www.w3.org/TR/2026/DISC-longtasks-1-20261020/) · [Microsoft WPT](https://learn.microsoft.com/en-us/windows-hardware/test/wpt/) · [Apple Instruments](https://developer.apple.com/tutorials/instruments)

Phase 1 harness 的介面需可輸入 `variant`、`case`、`corpus manifest`、`run ID`、`repeat count`、`output directory`，並有 `verify-corpus`、`run`、`summarize` 三個入口，實作後將精確命令與工具鎖定寫入任務紀錄。每 run 保留 `environment.json`、`input-manifest.json`、`samples.jsonl`、`summary.json`、`parity-diffs.jsonl`、logs、適用的 profile/trace/artifact SHA-256。每筆 sample 至少有 `runId, variant, caseId, requestSeq, mode, sceneRevision, staticFingerprint, phase, duration, units, outcome`。Encode/dispatch/accepted counters 與上述 percentile 的邊界在 machine-readable schema 標版本。缺值標 `not-applicable` 或 `unavailable`，不可填 0。大型 trace 保留 artifact URI、checksum、保留期限與必要重跑指令。循 [知識規則](../../schema.md) 註冊證據及來源。

## 6. 數值和協定等價

建立 TS oracle 的 **精確欄位** 與 **有容差欄位** 兩個驗證層。固定依現行經典投影進行原有小數六位 equality，另外輸出未捨入 TS 參考；自動比對程式遇到新增未分類的欄位就報告。Native/WASM 使用 f64 做第一版，feature 對照另記 FMA／SIMD。用分析解或 brute-force 小型 fixture 驗證 oracle 涵蓋的幾何情況。原始公式、existing expected outputs、比較次序和門檻留存。

| 範圍 | 必須驗證的輸出與邊界 | 回歸入口 |
| --- | --- | --- |
| Scene / coordinates | Schema/version/units、Classic x/y 到世界 X/Z、Hybrid Y elevation、來源數、單 active listener、disabled entities、舊 import/cache migration、local audio relink IDs。拒絕無限/NaN、超界、重複 ID、錯 mode。 | [SceneDocument](../../../tests/unit/scene-document.test.ts) · [座標](../../../tests/unit/coordinates.test.ts) · [transfer](../../../tests/unit/workspace-transfer.test.ts) · [cache](../../../tests/unit/workspace-persistence.test.ts) |
| Geometry / BVH | Compare segment/ray、finite patch、hit/no-hit、命中 ID 次序、point/t/distance/normal、portals open/closed/above opening、occluder IDs、負方向與 grazing、端點、平行/共線、零長、等距與 ignore reflector。用 brute-force 對 BVH，保留測試內既有 epsilon 與 endpoint 規則。 | [Classic geometry](../../../tests/unit/geometry.test.ts) · [Hybrid visibility](../../../tests/unit/hybrid3d-visibility.test.ts) · [Hybrid primitives](../../../tests/unit/hybrid3d-primitives.test.ts) |
| Direct / Portal | Route enum、visibility、每條有效與遮蔽 polyline、Portal / occluder 順序、physical/effective length、gain、filter 與 arrival direction。測交錯 Portal、阻擋 Portal 後段與 source/listener 重合。 | [Classic frame](../../../tests/unit/compute-frame.test.ts) · [Portal](../../../tests/unit/portal.test.ts) · [Hybrid audible direct](../../../tests/unit/hybrid3d-audible-direct.test.ts) |
| Reflections | Exact path ID、order、ranking/ties、reflector order、候選截點、tap 上限；容差比較一階與受限二階所有 hit 點、長度、delay、gain/low-pass。保留 Classic 相對 delay clamp 和 Hybrid 絕對 delay，採現行單位。測對稱佈局、相等 gain、近門檻、block/unblock 和 cap 內外。 | [Classic image source](../../../tests/unit/image-source.test.ts) · [Hybrid reflections](../../../tests/unit/hybrid3d-reflection.test.ts) · [Hybrid second-order](../../../tests/unit/hybrid3d-second-order.test.ts) · [Hybrid rendering](../../../tests/unit/hybrid3d-reflection-rendering.test.ts) |
| Material / RT60 | Material IDs、三帶 energy/reflection/scattering、gain 與 cutoff、RT60 及 clamp、開門面積與 volume。保留原系統 material domain constraints。只依有效公式關係設定不變量，模型研究資料 P5/P6/P7 獨立驗證。 | [Material registry](../../../tests/unit/material-registry.test.ts) · [Room acoustics](../../../tests/unit/room-acoustics.test.ts) · [模型參考](../../../docs/ACOUSTICS.md) |
| Atomic Frame / adapters | Exact mode、request/revision/static identity、source set/order、shape/bounds。Pose lag 需同一 static identity 與 ordered source IDs，驗證可採納的完整 frame 及 overlay/audio 一致。注入舊 generation、取消重試、遺漏/重複/錯派 shards 和 malformed payload。合成只出完整 frame 或整個 serial fallback。 | [Frame acceptance](../../../tests/unit/frame-acceptance.test.ts) · [Classic pool](../../../tests/unit/classic-source-pool.test.ts) · [Hybrid pool](../../../tests/unit/hybrid-direct-pool.test.ts) · [ADR 0008](../../../docs/adr/0008-adopt-pose-lagging-frames.md) |

補測結構 fingerprint 在 static edit／pose edit 的契約、Classic 的 JS JSON 欄位順序與字串 FNV 行為，以及 Hybrid 的 geometry hash。第一版保留 TS 端作 compatibility authority，收集合法 ASCII ID（大小寫、數字、底線與連字號）的 locale tie fixture，並以合法 Unicode scene name 確認 fingerprint 位元相容，含非 BMP 字元。跨平台 locale、負零、科學記數法或 JSON escaping 差異需要追查原語意；變更 canonicalization、tie-break 或 identity 的提案另走 ADR。Corpus SHA-256 用於重現測試素材，與產品 static identity 分開。

實作狀態：TypeScript 比較器與凍結規則見 [EC-101 固定語料](../../raw/sources/ec-101-corpus-baseline.md) 與 [語料 README](../../../benchmarks/corpus/README.md)。跨語言容差尚未決定。

新 parity 比較器的初始容差以同單位的欄位表呈現，先把現有測試各自的 precision 保留下來。對新增的連續數值欄位，先將 `abs(actual-expected) ≤ max(atol, rtol × max(abs(actual), abs(expected)))` 當候選比較式，再依解析解、原有精度、條件數與允許感知差異設定欄位值並送審。現行 pool validator 某些數值使用 `atol = 1e-5`、`rtol = 1e-6`，它們適合作為研究上界的起點，現行幾何分支使用自己的 epsilon，分類與 ID 仍須精確相等。量測不符時列出最小反例、來源與門檻的理由，交給 review 判斷。[Classic validator](../../../src/workers/classic-source-pool.ts) · [Hybrid validator](../../../src/workers/hybrid-direct-pool.ts) · [Classic fingerprint](../../../src/acoustics/compute-frame.ts) · [SceneSpec schema](../../../src/domain/scene/schema.ts)

## 7. 採用條件與執行順序

| 階段 | 交付證據與 gate |
| --- | --- |
| Phase 1，建立可信 TS 量測 | Corpus 和 manifest 在 Windows/macOS 至少可跑出一致的 TS discrete 結果與原 oracle。以 production TS serial/Worker 在同機完成配對量測，保存所有樣本與結果，呈現環境變異。先凍結 P95/P99、CPU、memory、acceptable pose age、audio/compatibility 欄位及影響該指標的主要場景。 |
| Phase 2–3，Rust/WASM | 同一 corpus 對每個已移植子集逐欄通過 parity 與失敗注入後才比較速度。預先註冊平台組別、主要指標、同機配對、最小值得的改善及副作用上限。可先評估預設候選門檻為主要互動場景 end-to-end p95 改善 ≥ 10%，配對區間超過基準噪音且 p99、記憶體、audio continuity 符合事先凍結的界線。這些候選值待 Phase 1 實測與 review。 |
| Phase 4–5，Desktop / Native Audio | 完成 IPC 路徑和冷啟動、取消、錯誤恢復、安全、storage/asset roundtrip。實機 Windows 和 macOS 分別做現行行為對照、連續播放、裝置恢復與長時測試，硬體證據與離線輸出分列。 |
| Release | 原瀏覽器 12/50 ms gate、其他 repo 驗收、精確契約及人工必要項目持續有效。只發布已驗證的平台。若不達採用條件，維持現行 TS 路徑與 Web Audio；先修正定位到的瓶頸或延後該 adapter，保存測量紀錄供後續重試。 |

開工順序是固定 corpus／TS oracle、建立計時和 trace 正向控制、Windows/macOS TS 基準、跨語言 kernel parity、async adapter fault/latency、真實 UI 與 audio。每一階段附可重跑命令和對應 run/artifact。以 [跨平台驗證提案](../decisions/0003-cross-platform-testing.md) 管理未決門檻。
