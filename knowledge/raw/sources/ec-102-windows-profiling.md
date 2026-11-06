# EC-102 Windows 剖析來源登錄 · 2026-11-06

**取得日期** 2026-11-06 至 2026-11-07 Asia/Taipei。**系統** Echo Canvas TypeScript 實作，由 Claude Code (Opus 5.5 orchestrator) 在分支 `perf/ec-102-profiling` 量測。**基準** `46c61c5`。**授權** 與儲存庫相同的 MIT。**證據目錄** [benchmarks/perf/results/ec-102-windows-2026-11-06/](../../../benchmarks/perf/results/ec-102-windows-2026-11-06/README.md)。**新工作負載** [benchmarks/perf/workloads/v1/manifest.json](../../../benchmarks/perf/workloads/v1/manifest.json)，SHA-256 `9b42b02286054b4321b791c39e07f1266804c9300165a3614a9dced89bcf78f3`。**執行計畫** [benchmarks/perf/plans/ec-102/](../../../benchmarks/perf/plans/ec-102/)。

本登錄記錄 EC-102 在 Windows 上的實測。EC-102 的 Status 為 Implemented，獨立驗證待進行。macOS 沒有執行，EC-102 的 macOS 一半仍未完成。本頁沒有任何項目標為 Verified，也沒有任何問題被宣稱已修復。

## 環境

**Verified Fact**：下列值來自每次執行的 `environment.json`。

- Windows 11 build 26200 x64，單一筆電。Intel i9-13980HX，24 實體核心、32 邏輯核心，31.63 GB RAM。AC 電源，電源配置 "Turbo"，電量 80%。
- Node 22.23.3、pnpm 11.7.0、Playwright 1.64.1。
- 瀏覽器：Chromium headless shell 156.0.8078.4（與 stock gate 相同的預設），執行檔 SHA-256 前綴 `f77d8e27c8db1e4a`。
- `navigator.hardwareConcurrency` 為 32，因此 4 source 場景用 4 個 Worker，tape 用 2 個。
- 時鐘解析度 main 與 Worker 皆 0.1 ms（非 cross-origin isolated，與正式環境相同）。
- 每個試過的瀏覽器變體都是 `gpu_compositing: disabled_software`。
- Audio context 48000 Hz、baseLatency 0.01、outputLatency 0.04、state running。沒有實體音訊驗證，render capacity 只是瀏覽器指標。
- 產品程式未變：相對 `46c61c5`，`src/`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`patches/` 沒有 diff。正式 build id `6clNDW1jsebGMFdZcnh9p`，`.next/static` 聚合 SHA-256 `476a881934ef395989faa2b070b7b174e3fddd62c896a1995592b26a2952bd9d`。
- 使用的 harness 提交：Round 1 在 `973eddc`，控制組與 Round 2 在 `bac507a`，scheduler、attribution 與 invalidation trace 在 `dc1bfe3`。`src/` 在這些提交間相同。

macOS：沒有執行。一台 Mac 在 Tailscale 上線且 port 22 開著，但 SSH 在這台機器上拒絕金鑰。維護者這一輪選擇只跑 Windows。

## 機器狀況

依 [Benchmark 計畫](../../wiki/performance/benchmark-plan.md) 4.6 節列出。

- Round 1 期間 IK Product Manager 以 10 至 54 MB/s 寫入 D:，Windows Defender 在掃描（占機器 3 至 4%）。Round 1 之前，維護者核准停止一個遺留的 `find`。維護者被詢問後選擇「現在跑，標示雜訊」。
- 執行前其他程序全程占機器 CPU 約 5 至 18%。
- Round 2 與控制組期間 IK Product Manager 安靜。REAPER、Waves、ChatGPT、Brave 與 Discord 保持開著。每次執行的 `environment.json` 在 `otherActivity` 記前後的程序名與寫入率。
- Commit charge 全程偏高（41 至 43 GB 中的 37 至 41 GB），page file 從約 10 GB 增至 12 GB。C: 降到約 400 MB，D: 降到約 3.7 GB。C: 的損失有一部分原因不明。
- 磁碟保護在 D: 低於 15 GB 時停止 Round 1，進度為 73 次執行中的 51 次。`r1-node-th01` 狀態停在 `started`，保留在磁碟上。其餘群組在之後的安靜時段計畫以 `r1b-*` 與 `par-*` 執行。

結論：所有計時都是單機、桌面有負載。執行間離散度大。Round 1 與安靜時段不可合併成同一條件。

## 命令

細節與旗標見 [perf README](../../../benchmarks/perf/README.md)。

```text
node scripts/perf/cli.mjs run --plan <plan> --out .perf-runs/<id>
node scripts/perf/cli.mjs summarize --out .perf-runs/<id> --to benchmarks/perf/results/ec-102-windows-2026-11-06
node scripts/perf/pack-evidence.mjs
node scripts/perf/cli.mjs scan <paths...>
node scripts/corpus/cli.mjs verify --require-frozen
```

五份計畫在 [benchmarks/perf/plans/ec-102/](../../../benchmarks/perf/plans/ec-102/)：`plan-r1.json`、`plan-q.json`、`plan-sched.json`、`plan-attr.json`、`plan-inv.json`。

## 執行與工件

**Measured Result**：索引 109 次執行，其中 stock gate 12 次（含 2 次 pilot）。沒有刪除，沒有自動重試。[stock-gate.jsonl](../../../benchmarks/perf/results/ec-102-windows-2026-11-06/stock-gate.jsonl) 列出每次 stock 執行。失敗的 gate 執行保持失敗。

- 六次 in-app 執行起初因 harness 對某個計算階段的驗證 bug 而結束為 `failed`，不是量測失敗。它們用 `rederive` 從保留的原始檔重建，`rederive` 保留 `originalStatus` 與 `originalError`，[tables.md](../../../benchmarks/perf/results/ec-102-windows-2026-11-06/tables.md) 列出它們。它們的 render capacity 樣本因只存在記憶體而遺失，由 Round 2 補上。
- 工件：[runs-index.jsonl](../../../benchmarks/perf/results/ec-102-windows-2026-11-06/runs-index.jsonl)、[tables.md](../../../benchmarks/perf/results/ec-102-windows-2026-11-06/tables.md)、[comparisons.json](../../../benchmarks/perf/results/ec-102-windows-2026-11-06/comparisons.json)、`groups.json.gz`、`selected/`、`runs.tar.gz`、`exemplar-slices.tar.gz`、`raw-cpu-alloc-gc.tar.gz`、[artifacts.sha256](../../../benchmarks/perf/results/ec-102-windows-2026-11-06/artifacts.sha256)、[large-artifacts.sha256](../../../benchmarks/perf/results/ec-102-windows-2026-11-06/large-artifacts.sha256)。大型 trace 不在 git，校驗碼在 `large-artifacts.sha256`，本機放在 `.perf-runs/ec102-win-1`，不保證保留，要取回只能重跑。
- 三個壓縮檔在打包前做過隱私掃描，解開後可用 `node scripts/perf/cli.mjs scan <dir>` 再掃。

## 工作負載與一致性

**Verified Fact**：凍結 tape TC01、TC02、TH01、TH02 以 closed-loop 重播。新的長工作負載在 `benchmarks/perf/workloads/v1/`，有自己的來源、種子與雜湊，corpus v1 未動，`verify --require-frozen` 通過。W01／W02 為 Hybrid 100/8/4/8，W03／W04 為同場景的 Classic 投影，60 Hz pose 持續 60 s，5 Hz 靜態編輯持續 30 s。in-app fixture 產生的 `staticGeometryHash` `6dc9f361` 與 `classicProjectionHash` `2483580d` 與工作負載 manifest 相同。

**Measured Result，一致性**：Node serial 在四個 tape 上 bit-exact（7145、2357、10472、3443 個葉節點中差異皆為 0）。Chromium 的 serial、正式 fallback 與真實 pool 各自得到相同的計數：差異葉節點 29、19、21、4，違反規則 0，步數 64、24、64、24。最大 2 ulp。欄位：`gainDb` 33、`azimuthDeg` 21、`lowpassHz` 15、`estimatedMidGainDb` 4。三條瀏覽器路徑的計數相同，所以 pool 沒有增加差異。

**Verified Fact（結果）**：EC-101 的 bit-exact 結論在 Node 成立，在 Chromium 不成立。瀏覽器輸出在凍結容差內。

**Hypothesis**：差異來自 Node（V8 12.4）與 Chromium 156 的 V8 `Math` 函式版本差異。反證方法：在兩邊直接計算這些運算並比較。

## 計時對齊

**Measured Result**：trace 時間對 `performance.now()` 的擬合。Worker pool W01：main 1251 個 mark，基線 23.2 s，漂移 -0.34 ppm，最大殘差 132 us。Worker 每個 264 個 mark，漂移 -0.94 至 +0.06 ppm，殘差 95 至 411 us。in-app：main 1040 個 mark，基線 31.2 s，漂移 0.04 ppm，殘差 223 us。in-app Worker 沒有 mark。

回報的 compute 對照 trace 中對應的 Worker task：W01 928／928 配對，差 min -0.09、中位 0.12、max 5.08 ms。TH01 384／384，-0.06、0.14、3.27。in-app 800／800，-0.83、0.23、2.27（回報值為整毫秒，以排名配對，屬近似）。

正向控制全部觀察到：main 60 ms 阻塞被 long-task observer 看到，trace task 約 60.3 ms，具名函式在 CPU 清單。Worker 40 ms 阻塞，trace 40.5 ms，具名函式在清單。GC 在 main 與 Worker 都被看到。音訊：移動 source 後 197 個 AudioParam 操作，render capacity 有限。這些控制顯示儀器看得到它聲稱看得到的東西。

限制：in-app 逐 Worker 配對是排名式近似。結論使用不需配對的 job 層級分解。

## 發現

### 1. in-app gate 的尾端主要是 main thread 等待 raster 的 commit

**Measured Result，in-app `APP_H100_SWITCH`、100/8/4/8、TS-W、4 Worker、warm**。`app.worker-compute-metric`（整毫秒，與 gate 同定義）：

| 執行 | N | p50 | p95 | p99 | max |
| --- | ---: | ---: | ---: | ---: | ---: |
| `r1-app-w-audioon` | 900 | 2 | 4 | 9 | 128 |
| `r2-app-w-audioon` | 900 | 2 | 3 | 6 | 74 |

`shard.compute-reported` 兩次的 p99 都是 3，max 19 與 7。`shard.roundtrip` p99 7.3 與 4.7，max 128 與 73.9。`merge.handler` p95 0.3 至 0.4，max 2.4。

**Measured Result，trace，1280x720 的 traced 執行**：`r1-traced-app-w-1` 與 `-2` 各 200 個 job，共 11 個 job 達 12 ms 以上。這 11 個中，最後一個 Worker 完成後的回覆等待都超過最慢的 Worker task，重疊的 main task 有 frame 子事件（`Commit`、`Layerize`、`PrePaint`），raster 在 4 個 `ThreadPoolForegroundWorker` 執行緒上執行。例：metric 104 ms，Worker 在 12.6 ms 完成，回覆等待 90.9 ms，main off-CPU 估計 78.7 ms，等待期間的 raster 牆鐘 196.5 ms。有一個 job（273 ms）還有約 201 ms 的慢 Worker 路徑，所以不只一個原因。

**Measured Result，`cc` scheduler trace 的直接觀察（`sched-app-w`）**：155 ms 的 main task，`ProxyMain::BeginMainFrame` 內的 `LayerTreeHost::WaitForCommitCompletion` 牆鐘 149.4 ms、CPU 12.6 ms，最後一個 raster 結束在 +155。48 ms 的 task：等待 47.1 ms、CPU 2.1，`ReadyToActivate` 與 `ActivateSyncTree` 在 +46，最後 raster 結束 +46。30 ms 的 task：等待 29.6 ms、CPU 1.3，啟用在 +29，最後 raster 結束 +29。依 layer 的 raster：layer 21 為 15156 ms，其他為 556 與 16 ms。

**Measured Result，因果控制，單一變數（viewport）**：headless shell、TS-W、clean、500 次切換，順序 1280、1920、full、fullgpu、fullgpu、full、1920、1280。warm N 各 400。

| | 1280x720（c1, c2） | 1920x1080（c1, c2） |
| --- | --- | --- |
| metric p99 | 40, 4 | 73, 67 |
| metric max | 119, 7 | 220, 243 |
| `shard.compute-reported` p99 | 5, 3 | 7, 4 |
| `shard.roundtrip` p99 | 39.4, 3.5 | 71.8, 66.5 |
| 視窗內 long task（warm N） | 6, 1 | 20, 32 |
| `display.overlay-commit-to-frame-end` p95 | 18.8, 17.8 | 48.3, 50.6 |

traced，100 個樣本：1280x720 為 raster task 3696、總牆鐘 14.0 s；1920x1080 為 7924 與 40.6 s。像素多 2.25 倍，raster 牆鐘多 2.9 倍，尾端跟著移動。注意兩次 1280x720 的 p99 差 10 倍：離散度大，N 400 的 p99 是第 4 大的值。

**Measured Result，無結論的控制**：完整 Chromium（`--browser-channel chromium`）與加 `--use-angle=d3d11 --enable-gpu-rasterization --ignore-gpu-blocklist` 的完整 Chromium：rasterization 狀態為 `enabled` 與 `enabled_force`，但 `gpu_compositing` 維持 `disabled_software`，raster task 留在 renderer，數量相近（3638 與 3657，對照 3696）。所以本次工作階段沒有達成 GPU raster。

**Hypothesis，未測**：有真正的 GPU raster 時，這個 commit 等待會縮小或消失，代表 gate 尾端有一部分只屬於 headless 軟體路徑。反證方法：在 `gpu_compositing` 啟用的環境跑同一個 fixture，例如在一般桌面工作階段開有頭瀏覽器。

**Hypothesis，未測**：layer 21 為何需要這麼多 raster。trace 顯示 `#text`、`LayoutSVGText`（Hybrid viewport 標籤）、`outliner-item`、`outliner-row` 與文件和 workspace 格線有 paint invalidation，50 次切換中有 505 個 `transitionrun` 事件。raster 跨 385 個來源 frame、1853 個 task。哪個 invalidation 驅動昂貴的 raster 沒有被隔離。反證方法：以測試專用樣式停用 `transition`，或逐一隱藏 Outliner 與 Viewport 標籤，對同一 fixture 比較 `traced.rasterTotalWallUs`；若 raster 總量不變，即反證該來源。

### 2. stock gate 的結果取決於罕見尖峰與同機的其他負載

**Verified Fact（算術）**：24 個樣本的 nearest-rank p95 是第 23 個值，即第二大。一個尖峰不能使 p95 預算失敗，兩個可以。

**Measured Result**：12 次正式 build 的 stock 執行，9 次通過，3 次失敗。`p21` p95 29；`r1-stock-4` p95 49；`r1-stock-2` p95 6 但有 114 ms long task。`r1-stock-1` 通過，有一個 101 ms 的樣本，p95 7。Round 1 在 IK Product Manager 負載下 5 次中 2 次失敗，安靜時段 5 次中 0 次失敗。樣本小：這暗示對負載敏感，並未證明。更早的兩次 smoke 執行也失敗（p95 49 與 114），可能與子代理工作重疊，不計入。

**Measured Result**：每個 job metric 達 12 ms 以上的比率，warm、1280x720：9/900、5/900、6/400、0/400，合併 20/2600 = 0.77%。若獨立，預測 24 個中兩個以上的機率約 1.5%，低於 12 次 p95 失敗中看到的 2 次。

**Hypothesis**：尖峰成群或依賴負載。反證方法：在受控負載下，用多次較長的執行檢驗尖峰獨立性。沒有提出或更改任何門檻，12 ms 與 50 ms 預算維持原樣。

### 3. 視窗內 long task 有三類，其中一類是測試驅動程式

**Measured Result，trace，量測視窗內 50 ms 以上的 task**：依牆鐘對 CPU、子事件與程式碼來源分類。兩次執行各 14 與 17 個 long task，列出最大者。

- A，等 commit 與 raster：牆鐘遠大於 CPU，`(program)`、`Commit`。例：234 ms／CPU 22 ms、102／24、88／6、87／5。
- B，輸入處理中的產品 JS：`EventDispatch`、產品 chunk、`HitTest`。例：215 ms／CPU 131（`EventDispatch` 161、`HitTest` 35）、190／98、179／107、167／101。
- C，測試驅動程式：`query`、`elementSafeTagName`、`getExplicitAriaRole`、`computeBox`、`querySelectorAll`、`elementsFromPoint`。例：189 ms／CPU 90、129／62、76／41、63／28。

**Verified Fact**：C 類的函式名稱出現在 `playwright-core`，在 `.next/static` 與 `src` 中出現次數為零。stock spec 使用同類定位器（`getByRole` 加 `locator(...).nth(i).click()`）。

**Hypothesis，未測**：gate 自己的驅動程式對 stock 視窗中的 long task 有貢獻。stock 執行沒有 trace，所以 `r1-stock-2` 的 114 ms task 沒有歸入任何一類，歸因未定。反證方法：與不做 role 查詢、直接派送輸入的驅動程式比較。

產品 JS 名稱（no-mangling build、整個視窗、main 上的 self 樣本，產品樣本共 1171）：anonymous 130、`projectClassicScene` 118、`updateProperties` 50、`projectHybridDocument` 45、`stableJson` 41、`commitHostUpdate` 32、`estimateRoomAcoustics` 27。該次執行 `click` 派送 101 次，共 447 ms，最大 17 ms。B 類 long task 沒有在 no-mangling 執行中再出現，所以 B 類 task 沒有逐一命名。

### 4. Hybrid 靜態安裝是獨立且可重現的成本

**Measured Result，W02 Hybrid 100 面牆，靜態安裝 job**：TS-W `pool.compute-metric`：Round 1 p50 15.8、p95 23.7、p99 51.2、max 215。安靜時段 p50 20.4、p95 24.0、p99 43.9、max 53.1。TS-S fallback W02 全部 job（安靜）：p50 4.7、p95 6.1、p99 7.0、max 9.4。`install.post`（main 上同步，每個 Worker）：p50 3.3、p95 3.8、max 9.1（安靜），4 個 Worker。`install.ack-roundtrip` p50 11.2、p95 17.7。`shard.transport` p50 7.5，在同一 Worker 上排在 install 後面。`job.submit-to-accepted` p50 34.8，TS-S 為 15.9。

**Classic 控制，W04**：`install.post` p50 0.1、`install.ack-roundtrip` p50 0.6、compute p50 2.2。

**Verified Fact**：Hybrid 安裝對每個 Worker 以 structured clone 帶 BVH 與 patch（`hybrid-direct-pool.ts:705-716`）。這是 Worker 路徑比 serial 慢最明確的案例。

### 5. pose 延遲由排隊決定

**Measured Result**：`pose.latest-wait` warm、安靜：

| 工作負載 | 路徑 | p50 | p95 | p99 |
| --- | --- | ---: | ---: | ---: |
| W01 | TS-W | 48.9 | 91.2 | 95.1 |
| W01 | TS-S | 51.5 | 91.5 | 95.4 |
| W03 | TS-W | 50.5 | 89.3 | 93.5 |
| W03 | TS-S | 49.6 | 87.8 | 89.2 |

場景頻率 12 Hz，間隔 83.3 ms。各路徑幾乎相同，與速率限制間隔主導一致。W01 提交 3600、合併 2920、完成 680。每次執行會回報被截斷的樣本。速率限制是產品參數（10 至 15 Hz clamp），只回報，不質疑。

closed-loop 計時器遲到：tape 的 `queue.timer-lateness` p50 約 9 ms、p95 約 11，請求的是 83 ms。open-loop W03：p50 約 0.3。

**Hypothesis，未測**：頁面閒置時 Windows 計時器合併。反證方法：頁面保持計時器迴圈活躍重播同一資料，或請求高解析度計時器。

### 6. Worker 對 serial

**Measured Result，`pool.compute-metric`，warm**：跨輪離散度大，p99 的正負號會變。

| | TS-W R1 | TS-W 安靜 | TS-S R1 | TS-S 安靜 |
| --- | --- | --- | --- | --- |
| W01 p50/p95/p99/max | 1.9/10.9/40.0/60.2 | 2.3/5.5/7.6/19.1 | 2.2/7.2/23.3/58.2 | 4.5/6.6/12.1/54.3 |
| W03 p50/p95/p99/max | 1.2/2.5/9.1/33.6 | 1.7/3.7/15.0/33.5 | 3.1/4.9/6.5/10.0 | 3.7/5.3/7.5/37.1 |

Worker 在兩者上降低 p50 與 p95。p99 時，W03 在兩輪都是 Worker 較差，W01 在兩輪間反轉。不宣稱通則。in-app：TS-W p50 2、p95 3 至 4、p99 6 至 9；TS-S fallback p50 3、p95 6 至 7、p99 11 至 14。in-app 視窗內 long task：TS-S 11 與 15，TS-W 14 與 7。

小 tape（Round 1、closed-loop）：TC01 TS-W p50 0.6、p95 1.8、p99 7.8，對 TS-S `job.total` 0.3、0.6、2.1。TH01 0.6、1.3、2.8 對 0.4、0.9、1.0。TC02 0.6、1.0、1.9 對 0.3、0.5、0.7。TH02 1.2、3.7、9.3 對 1.1、3.3、3.9。這些小場景上 serial 較快。Node core `job.total`：TC01 0.34、0.66、1.13；TC02 0.41、0.80、1.06；TH01 0.51、1.04、1.12；TH02 1.88、4.44、4.89（自己的欄，不可當產品路徑比較）。

Worker 數量，W01 安靜：1 個 Worker p50 6.1、p95 12.6、p99 87.2（`shard.compute` p99 53.9）；2 個 3.7、10.2、19.7；4 個 2.4、6.5、16.9（預設執行同組態為 2.3、5.5、7.6，顯示離散度）。in-app 1 個 Worker：p50 6、p95 7、p99 12、max 64。

### 7. 在這份證據上不是尾端原因的項目

**Measured Result**：

- `merge.validate` W01 p95 0.4 至 0.6、p99 0.7 至 2.1。in-app `merge.handler` p95 0.3 至 0.4。惡意 payload 驗證在這裡不是尾端驅動。不建議移除（最佳化頁已否決）。
- GC：`r1-traced-app-w-1` 全部 200 個 job 的 `gcOnMainInWindow` p99 1.6 ms、max 2.1，`gcOnWorkersInWindow` p99 3.2 ms。該次執行整體：main 43 次 minor 共 64 ms、3 次 major 共 40 ms，Worker 317 次 minor 共 143 ms，視窗 30 s。兩次 traced 執行的 11 個慢 job 中，有一個 job（50 ms，`r1-traced-app-w-2`）在 commit 等待旁有 11.6 ms 的 main GC。這些 job 中 GC 存在而且小。
- 音訊控制：`audio.apply-window` p95 0.4、max 1.1 ms。`audio.param-ops` p50 21、p95 139。`audio.param-call-total-ms` p95 0.2。`accept.to-first-param` p50 0.9、p95 6.5 至 7.6、p99 14.9 至 30.8、max 66 至 164。呼叫便宜，等待發生在它們之前。

音訊開對關，TS-W：metric p99 6 至 9 對 5；`accept.to-status-commit` p95 9.1 至 10.9 對 5.2 至 7.3，p99 32.3 至 54.6 對 12.7 至 22.3；視窗內 long task 14 與 7 對 3 與 4。render capacity（CDP，瀏覽器指標，非硬體證據），Round 2：TS-W 音訊開 p50 0.11、p95 0.43、p99 0.99、max 1.00；TS-S p50 0.12、p95 0.80、p99 0.99、max 1.00；1 個 Worker p50 0.10、p95 0.26、p99 0.47、max 0.63。N 為 478、477、251。

### 8. main thread 的 Hybrid 更新驗證

**Measured Result**：`input.project` W01 安靜 p50 3.0、p95 4.0、p99 7.1、max 16.9，頻率 60 Hz。traced W01 中有兩個 main task 為 103 與 110 ms，CPU 約 50 ms：self 樣本為 `stableJson`、`classicProjectionHash`、`validateV2Semantics`、`runChecks`、zod、`createSceneDocumentV2`，其中沒有 GC。`input.lateness` W01：Round 1 負載下 p99 113；安靜執行差異很大，為 2.0、82.2、99.7（TS-S），顯示阻塞後追趕。

配置，含已回收物件的取樣 profiler，W01 20 s，main：anonymous 499 MB、`runChecks` 375、`stableJson` 342、`join` 194、`next` 185、`collinearInteriorOverlap` 120、`createSceneDocumentV2` 68、`classicProjectionHash` 64。Worker 0：158 MB、`segmentIntersectsAabb3` 41、`reflectedPoint` 28、`pointInPatch3` 24。W03 main 1094 MB：`collinearInteriorOverlap` 229、`runChecks` 177、`isPortalEdgeVisible` 94。

註：browser-pool 層 harness 呼叫 `createSceneDocumentV2`；app 呼叫 `projectHybridDocument`，它也做驗證；in-app 的產品 self 樣本裡出現 `projectHybridDocument` 與 `stableJson`（發現 3）。

**Hypothesis，未測**：為何通常 3 ms 的呼叫在 50% CPU 下花超過 100 ms（高 commit 下的排程或換頁）。反證方法：在 commit 有餘裕的機器上以 hard-fault 與 context-switch 計數器（WPR）重跑。

## 驗收項目狀態

| 項目 | 狀態 |
| --- | --- |
| 保留每次成功與失敗 | 是。[runs-index.jsonl](../../../benchmarks/perf/results/ec-102-windows-2026-11-06/runs-index.jsonl)、[stock-gate.jsonl](../../../benchmarks/perf/results/ec-102-windows-2026-11-06/stock-gate.jsonl) |
| 分開排隊、install／clone、shard、合併、接受、顯示／音訊控制 | 是。browser-pool 有 `queue.*`、`install.*`、`shard.*`、`merge.*`、`accept.decide`、`display.derive`。browser-app 有 `app.input-to-dispatch`、`queue.rate-limit-estimate`（僅估計）、`install.*`、`shard.*`、`merge.handler`（validate 與 assemble 無法拆開）、`accept.to-overlay-commit`、`accept.to-first-param`、`accept.to-status-commit`、`audio.*`、`display.*` |
| p50／p95／p99 | 是，warm 與 cold 分開，依 `jobKind`。tape 每程序 warm N 在 1000 以上；in-app N 900（1000 次切換扣預熱）；長工作負載約 600 個 job，其 p99 標為探索性 |
| 環境、alloc／GC、CPU 原始工件 | 是。`selected/`、`raw-cpu-alloc-gc.tar.gz`、`runs.tar.gz`、`exemplar-slices.tar.gz`。大型原始 trace 在 git 之外，SHA-256 在 `large-artifacts.sha256`，用結果 README 的計畫重跑 |
| 每個瓶頸結論有 trace 或標為待驗假設 | 是，見上 |
| Windows 與 macOS | 只有 Windows。macOS 未滿足，此驗收項目部分未完成 |

**未達成的計畫目標**：每組至少 5 個獨立程序（主要群組為 2 至 3 個，數個診斷群組為 1 個）；10 次冷啟動（沒有當成一個群組執行，每個程序的第一個 job 有記錄）；硬體音訊；熱穩定起訖（只有 ACPI thermal zone 讀值，不是 CPU package）；ETW／WPR（未使用）；有頭瀏覽器（未執行）；S8 至 S10 未嘗試。

## 限制

單機、桌面有負載、離散度大。Round 1 與安靜時段條件不同，不合併。多數群組程序數低於計畫目標。沒有 GPU raster、沒有實體音訊、沒有 macOS。尖峰獨立性、GPU raster 的影響與 layer 21 的 invalidation 來源都沒有結論。本輪沒有提出或更改任何門檻。

## 更正與紀錄

- Round 1 的 `environment.json` 記錄的是完整 Chromium 執行檔雜湊 `7f08161bbeb2...`，但這些執行啟動的是 headless shell（`f77d8e27c8db...`）。從 `bac507a` 起的執行雜湊的是實際啟動的 build。`browser.version()` 全程正確。
- 起初因 harness 驗證 bug 而 `failed` 的六次 in-app 執行，經 `rederive` 重建，見上。
- pilot 執行（`p01` 至 `p21`）使用的 in-app 推導後來發現有誤：AudioParam 呼叫被歸到下一個 job。它們只當 pilot 保留。它們的 stock 結果有效，因為 stock 執行沒有 probe。
- 分析器曾重複計算 GC 與 busy 時間，已在分析器修正。
- `git.dirty` 在證據第一次彙整之後的執行為 true，原因只有未追蹤的 `benchmarks/perf/results/` 目錄。
- `input-manifest.json` 回報 `productTreesMatchBaseline: "unavailable"`，因為 harness 沒有傳入語料基準。產品程式未變由上述 `git diff` 證明。
- 一個子代理在 stock smoke 期間，因路徑未加引號，把 7 個檔案（261 KB）寫到工作區的一個同層資料夾，違反維護者的規則。安全檢查擋下刪除，維護者已被告知。原因（shell 字串 spawn）已修正，runner 現在拒絕 repo 外的 `--out` 與未設定的暫存變數。該次遺失的執行回報 p95 114 ms，不在索引中。
- 兩次更早的 smoke 失敗不計入 stock 統計。
