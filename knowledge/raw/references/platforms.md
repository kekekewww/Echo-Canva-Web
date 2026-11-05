# 平台與 Core 研究來源

檢索日期 2026-11-06。此表記錄官方文件、規格與工具作者的 API 文件，保留版本和採用範圍。連結指向 Tauri／Next.js／Rust／Web 標準組織及各 crate 或工具維護者發布的來源。本登錄保留書目與自行撰寫的摘要，重製原始內容前須依各頁授權確認散布條件。來源版本供重現研究，實際 prototype 應另外記錄 lockfile、工具鏈與環境。若來源更新，新增參照並在綜合頁記錄修正。

| ID | 來源與適用版本 | 支援的結論與成熟度 |
| --- | --- | --- |
| P01 | [Tauri v2 Next.js frontend](https://v2.tauri.app/start/frontend/nextjs/) · 指南範例為 Next.js 14.2.3 | Tauri 的前端產物是靜態輸出。與本專案 Next.js 16 的相容限制由 P02 與程式碼交叉驗證 |
| P02 | [Next.js App Router Static Exports](https://nextjs.org/docs/app/guides/static-exports) · v16 線，讀取時網站顯示 v16.4.5 | Static export 成熟可用，依賴 Request 的 route handler 不支援。專案基準固定 v16.4.2，未做本專案的 export 測試 |
| P03 | [Tauri v2 Commands](https://v2.tauri.app/develop/calling-rust/) | Commands 支援 typed inputs、async、error 及 raw binary request/response。跨 WebView 的 copy 次數和延遲仍需實測 |
| P04 | [Tauri v2 Channels](https://v2.tauri.app/develop/calling-frontend/#channels) | 有序資料傳輸介面，適用於結果通知或測試串流。應用層 freshness 與 bounded queue 由專案管理 |
| P05 | [Tauri v2 Capabilities](https://v2.tauri.app/security/capabilities/) | 依視窗／WebView 與平台配置最小能力。自訂 Command 須用 AppManifest 加入權限控管；Rust handler 自行校驗 scope 與 payload |
| P06 | [Tauri v2 process model](https://v2.tauri.app/concept/process-model/) | Windows WebView2、macOS WKWebView、Linux WebKitGTK 需分別驗證。成熟平台架構，專案未在其中打包 |
| P07 | [Tauri v2 Vite guide](https://v2.tauri.app/start/frontend/vite/) · Vite 8 範例 · [Tauri v2 sidecars](https://v2.tauri.app/develop/sidecar/) | 靜態 Vite 可由 shell 直接載入。Sidecar 支援獨立程序打包，但本研究暫緩該維護成本 |
| P08 | [Tauri v2 WebDriver](https://v2.tauri.app/develop/tests/webdriver/) | 官方指南區分 native `tauri-driver`（Windows/Linux）及有 embedded test driver 的跨平台方案。Echo Canvas 測試整合尚未驗證 |
| P09 | [Tauri v2 distribution](https://v2.tauri.app/distribute/) · [Tauri v2 updater](https://v2.tauri.app/plugin/updater/) | 安裝包與 OS 簽章／macOS notarization、更新產物的簽章各自驗收。無本輪發布 |
| P10 | [Cargo workspace](https://doc.rust-lang.org/cargo/reference/workspaces.html) · [Cargo profiles](https://doc.rust-lang.org/cargo/reference/profiles.html) · stable Cargo Book | workspace 可集中鎖檔與設定。記錄 benchmark 的 profile、target 和 compiler，與 JS 以配對場景比較 |
| P11 | [rustc wasm32-unknown-unknown](https://doc.rust-lang.org/stable/rustc/platform-support/wasm32-unknown-unknown.html) · [Rust 數值型別](https://doc.rust-lang.org/reference/types/numeric.html) | Tier 2 wasm target 與 IEEE binary64 `f64` 適合試作無 OS 依賴核心。跨平台相同公式仍需數值回歸 |
| P12 | [wasm-bindgen API](https://docs.rs/wasm-bindgen/0.2.130/wasm_bindgen/) · 0.2.130 · [wasm-pack](https://wasm-bindgen.github.io/wasm-pack/) · 0.15.1 | 成熟的 glue/packaging 工具。固定 CLI 和對應 crate，驗證 bundler、產物路徑與記憶體生命周期 |
| P13 | [Wasm in Web Worker](https://wasm-bindgen.github.io/wasm-bindgen/examples/wasm-in-web-worker.html) · 官方指南 | 證明 Worker 內初始化與呼叫 WASM 的模式。頁面範例的瀏覽器相容註記依其撰寫時間，正式矩陣以現行環境測試 |
| P14 | [Serde](https://docs.rs/serde/1.0.229/serde/) · 1.0.229 · [serde-wasm-bindgen](https://docs.rs/serde-wasm-bindgen/0.6.5/serde_wasm_bindgen/) · 0.6.5 | 成熟序列化工具。需驗證 JS 值型別、optional 欄位和 finite 語意，量測 DTO 轉換成本 |
| P15 | [WHATWG safe passing of structured data](https://html.spec.whatwg.org/multipage/structured-data.html) · Living Standard，檢索時 2026-11-05 | 定義 structured clone、transferable ownership 和 agent cluster 限制。可用於 transfer semantics 的正確性，實際 copy 成本由 benchmark 決定 |
| P16 | [WebAssembly JS API 2](https://www.w3.org/TR/wasm-js-api-2/) · W3C Candidate Recommendation Draft 2026-11-04 | 查對 Memory buffer refresh 與 growth 語意。避免固定 view 橫跨 memory grow，支援程度依目標引擎實測 |
| P17 | [Rayon](https://docs.rs/rayon/1.12.0/rayon/) · [ThreadPoolBuilder](https://docs.rs/rayon/1.12.0/rayon/struct.ThreadPoolBuilder.html) · 1.12.0 | 成熟 native data parallelism。使用固定大小本地池的假設需量 end-to-end，規格不保證 workload 加速 |
| P18 | [wasm-bindgen-rayon](https://github.com/RReverser/wasm-bindgen-rayon) · 文件驗證工具鏈 `nightly-2025-11-15` · [WHATWG COOP／COEP](https://html.spec.whatwg.org/multipage/browsers.html) · [WebAssembly Feature Status](https://webassembly.org/features/) | Shared-memory WASM threads 對本專案屬實驗。驗證 cross-origin isolation、工具鏈和 SIMD／threads feature detection，保持 portable fallback |
| P19 | [ECMA-402 String.prototype.localeCompare](https://tc39.es/ecma402/#sup-string.prototype.localecompare) · 編輯草稿 | 依 `Intl.Collator` 語意。Rust byte ordering 無法直接取代 TS 的依 locale 比較，基準記錄 locale／ICU |
| P20 | [Criterion.rs](https://docs.rs/criterion/0.8.2/criterion/) · 0.8.2 · [Rust Performance Book](https://nnethercote.github.io/perf-book/) · 作者維護的線上版本 | 可選 native 微基準及 profiling 方法。微基準和統計工具無法替代 UI、IPC 或音訊的端到端資料 |
| P21 | [W3C Web Audio API 1.1](https://www.w3.org/TR/webaudio/) · Working Draft 2026-09-22 | Graph、AudioParam 與 Worklet 規格供平台接口研究。Desktop WebView 音訊行為須用實際 OS 裝置驗證 |

對應綜合頁為 [Web/Desktop 架構](../../wiki/platforms/web-desktop.md)、[Rust Core](../../wiki/platforms/rust-core.md) 與 [XR-001 至 XR-006](../../wiki/decisions/0001-platform-and-core.md)。本輪完成文件查核，未編譯或測試上述候選工具。
