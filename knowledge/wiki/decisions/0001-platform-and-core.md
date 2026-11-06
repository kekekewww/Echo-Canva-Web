# 平台與聲學 Core 的 Proposed ADRs

- Reviewed: 2026-11-06
- Evidence: [Web/Desktop 架構](../platforms/web-desktop.md) · [Rust 可行性](../platforms/rust-core.md) · [基準與數值驗證](../performance/benchmark-plan.md) · [平台來源](../../raw/references/platforms.md)
- 現行決策索引見 [docs/adr](../../../docs/adr/README.md)。下列研究記錄待各自審查與驗證。

## XR-001 — Repository 與 workspace

- **Status:** Proposed
- **Context:** 兩端可共用 schema、fixtures、知識庫和 Core，現行 Web 有穩定的 Next 根目錄與發布流程。
- **Decision Proposal:** 單一 repo 內採混合 workspace。逐步加入 Desktop 與 Cargo，先維持 Web 路徑。共享程式碼和證據一個 PR 審查，產品各自 CI／版本／發布。
- **Alternatives:** 全量移動到平坦 Monorepo、Web/Desktop 分 repo、獨立 Core repo。需要獨立權限、外部 Core consumer 或獨立發版時再評估拆分。
- **Trade-offs:** 共用變更可原子審查。需 path filters、明確跨端觸發和 ownership，以控制 CI 耗時與權限。
- **Compatibility:** 保留 Git 歷史、MIT/第三方授權、`docs/ORIGIN.md`、Web 根目錄和凍結 lockfile。
- **Performance Implications:** 主要影響 CI/build cache，runtime 改善須另有證據。
- **Migration Cost:** 低至中。添加第二套 Rust 鎖檔和 Desktop 安裝矩陣，暫緩整體搬動。
- **Validation Plan:** Web 現行 gate 保留。共享 fixtures 變更能觸發兩線檢查，Desktop-only 變更無自動 Web deploy。PR 可用同一 task/ADR 追溯。
- **Rollback Plan:** 不將原型加入預設 CI/部署。撤下 Desktop 路徑和獨立工作流即可退回單 Web 形態。

## XR-002 — Shared Rust Acoustic Core

- **Status:** Proposed
- **Context:** 純 TS 幾何、BVH、direct/反射與 Eyring 可獨立對照，現行 runtime 可作基準。
- **Decision Proposal:** 先試作 `echo-acoustics-core`，f64 serial、資料與純函式，從 finite geometry → BVH → direct → first order 移植。Serde、WASM、Tauri、Rayon scheduler 與音訊放在外層。
- **Alternatives:** 保留純 TS、單做原生外掛、全部 solver 一次替換。
- **Trade-offs:** 可跨 native/WASM 分享及共用 fixtures，短期有雙 backend 和等價維護成本。先避開平台依賴，將 port 與 acoustic model 變更分開。
- **Compatibility:** 保留公式、座標、材料、分支門檻、排序、tap budget、IDs；保持 P5/P6/P7 資料型。
- **Performance Implications:** 測量冷啟、static build、solve、assembly；多核、SIMD 和 layout 逐項比較。
- **Migration Cost:** 中到高，主要在精確排序、edge cases 與 geometry compile。
- **Validation Plan:** 固定 TS outputs，逐欄位 parity 和獨立 oracle cases，native 與 WASM 相同 fixture digest。等價與端到端預算都通過後再評估使用預設。
- **Rollback Plan:** 移除 feature gate 或不載入候選 backend。以完整 TS serial/Worker frame 路徑繼續。

## XR-003 — Rust / TypeScript 資料契約

- **Status:** Proposed
- **Context:** 現行 Worker 已區分 static、pose 與 complete frame，互通需處理不受信任 payload、版本差異與跨 runtime 排序。
- **Decision Proposal:** 維持 authoring schema，新增 versioned runtime DTO，保留 install ACK/compute/result 語意，明定 mode、epoch、handle、revision、fingerprints、request sequence 和 source order。先 readable DTO，binary 由量測觸發。
- **Alternatives:** 每 job 傳全 SceneDocument、從首版採二進位 memory layout、同時重設 authoring schema。
- **Trade-offs:** DTO 易驗證與 debug，序列化可能支配小場景成本。額外 freshness fields 增加 adapter 複雜度。
- **Compatibility:** TS 產生現行三種 fingerprint 並經 golden fixture 驗證。測 exact IDs、locale sorting、frame payload、pose-lagging 和過時結果拒絕。現行 schema 版本各自管理。
- **Performance Implications:** 量 bytes 與 encode/clone/decode/dispatch，必要時測 bounded typed arrays 及 IPC raw response。
- **Migration Cost:** 中，需兩端 codec、驗證器、取消、逾時與故障診斷。
- **Validation Plan:** roundtrip、malformed/oversize、重複/未知 ID、wrong-mode、mismatched version、out-of-order、取消、late ACK、undo/redo/restart。不得發布 partial/mixed backend frame。
- **Rollback Plan:** version mismatch 或驗證失敗時丟棄新 backend 結果，重算完整 TS frame。新 wire 版本保持獨立開關。

## XR-004 — Browser WASM Adapter

- **Status:** Proposed
- **Context:** 目前 Browser Worker 與序列 TS 已有獨立計算路徑，重用生命週期可比較 CPU 改善與資料移動代價。
- **Decision Proposal:** 由 dedicated Worker 初始化單執行緒 WASM，對照現有 Worker 界線與 budget。先評估 single-worker，再測每 shard Worker 一個 instance 的現行 pool 對照，依量測選擇。
- **Alternatives:** TS-only、main-thread WASM、shared-memory WASM thread pool。
- **Trade-offs:** 減少 UI 計算干擾，增加下載／glue／cache bytes。每個 instance 可能重複持有靜態幾何。
- **Compatibility:** 驗證 Next production bundling、Worker assets、WebView/browser feature detection，保持既有 Web Audio、protocol、TS fallback 與部署條件。
- **Performance Implications:** 冷 init、boundary marshaling、clone/transfer、每實例 peak memory 與 accepted-frame p95 各自量測。
- **Migration Cost:** 中。固定 compiler、wasm-bindgen/wasm-pack、建置資產與 JS adapter。Shared memory/SIMD 是後續實驗。
- **Validation Plan:** 相同場景 fixture 的 TS/WASM 數值對照及缺 wasm、init error、Worker watchdog／拒絕建構的可復原測試。
- **Rollback Plan:** 選回 TS Worker，失效時執行現有 TS serial fallback。無需先修改 isolation headers。

## XR-005 — Native Tauri Adapter

- **Status:** Proposed
- **Context:** 現行動態 Next API 不能藉 Tauri 的靜態前端輸出提供。安裝版需本機檔案、原生計算與離線能力。
- **Decision Proposal:** Vite React shell 重用 editor 與 domain，Tauri v2 Commands 處理開檔、存檔和非同步 native compute；Channel 可選做有序完成通知。原生 compute 工作放在 bounded pool，WebView 只取得 presentation 所需資訊與 complete frame。
- **Alternatives:** Desktop 專用 Next static export、Node sidecar、全遠端 AI/compute、全新 UI。
- **Trade-offs:** 有限 IPC 和窄權限降低耦合。須驗證多 OS packaging、音訊 API 及 import/export 行為，並量 per-WebView IPC。
- **Compatibility:** 共享專案格式，local 檔案權限、relink、AI opt-in 走平台 adapter。Web Preview graph 與 native audio 以獨立界線研究。
- **Performance Implications:** 量 WebView encode→Rust decode→queue→solve→publish，低頻 install，限制 outstanding jobs 和通知量。
- **Migration Cost:** 中到高，包含 UI import 拆分、檔案安全、簽章、真實機器測試。
- **Validation Plan:** Windows/macOS 打包版 offline smoke、檔案 scope、path traversal、unauthorized window、遲到 frame、AI unavailable、正常關閉和真實音訊。Web unchanged contract gate 同時跑。
- **Rollback Plan:** 先保持 Desktop 不發行；候選 native compute 可降回同模式 TS，Web 按原流程提供產品。

## XR-006 — Static Geometry Ownership

- **Status:** Proposed
- **Context:** Hybrid 已由 TS 編譯 BVH，再向 Worker 安裝；熱 pose 變更無須每次完整傳輸。Native/WASM 需要以生命週期保證 static handle 正確性。
- **Decision Proposal:** 原型用 TS 有限面片安裝 Rust BVH，成功才換 generation handle；後續 native compile 僅在 parity 通過後試驗。Job 固定讀 immutable generation，以 bounded in-flight retirement 回收。
- **Alternatives:** 每 pose 重建、跨 Worker 用 SAB 共享、同一個可變 BVH 原地 refit。
- **Trade-offs:** 明確 handle 簡化 stale rejection，舊 generation in-flight 時可能短期增加 peak memory。Web Workers 的 per-instance copies 仍需計量。
- **Compatibility:** 仍需 TS 的 Hybrid static hash、Classic context、Classic projection hash；generation 不用來重定義上述值。不同 mode/project/backend session 隔離。
- **Performance Implications:** 預期避免反覆傳完整場景，增益待量測。以獨立 workload 比較靜態編譯、複製、查詢、refit/rebuild 與收尾成本。
- **Migration Cost:** 中。必須管理 install ACK、release、失敗回復、容量界線、同時讀取和 race。
- **Validation Plan:** pose-only、material/wall/Portal/primitive edit、project reload、快速連續 install、hash collision fixture、取消及 shutdown。確認已發布 frame、現行 static token 及 resource accounting 一致。
- **Rollback Plan:** 切回現行 TS static compiler/cache 及 Worker/serial，丟棄候選 generation，不保留跨重啟 handles。
