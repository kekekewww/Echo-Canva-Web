# 聲學運算與效能來源

查閱日期 2026-11-06（Asia/Taipei）。研究用的版本記在各列，加入更新版時新增條目並標記取代關係。外部論文和規格用連結保存，專案原始證據沿用 Git 歷史。以下來源的成熟度描述適用於該技術，Echo Canvas 的整合證據另見[效能基準](../../wiki/performance/baseline.md)與[最佳化研究](../../wiki/performance/optimization.md)。

| ID | 來源及版本 | 研究用途和邊界 |
| --- | --- | --- |
| PERF-S01 | [PBRT 第四版 §7.3，Bounding Volume Hierarchies](https://www.pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies) | 作者原始教材及實作。成熟的 binary BVH、葉節點與分割策略參照。以本專案的有限 patch、Portal 和排序合約重做驗證。 |
| PERF-S02 | [Wald、Boulos、Shirley，ACM TOG 26(1)，2007](https://doi.org/10.1145/1186644.1186650)，[CMU 學術典藏論文](https://www.cs.cmu.edu/afs/cs/academic/class/15869-f11/www/readings/wald07_packetbvh.pdf) | Dynamic BVH 的 refit 與 ray batching 研究。使用保持拓樸的形變作為候選條件，專案內的觸發閾值未量測。 |
| PERF-S03 | [Allen 與 Berkley，JASA 65(4)，1979，原論文 PDF](https://jontalle.web.engr.illinois.edu/Public/AllenBerkley97.pdf)，[DOI](https://doi.org/10.1121/1.382599) | 作者站的索引內容確認矩形房間的 image-source 方法。原始 DOI 與 PDF 直接開啟受限，論文用途以可確認的題錄與摘要為準。成熟的聲學方法，Echo Canvas 的 finite patch、遮擋與固定搜尋預算由專案合約決定。 |
| PERF-S04 | [Ewert 等，2023，arXiv:2306.16696v1](https://arxiv.org/abs/2306.16696v1) | 作者預印本。漫射反射與空間 FDN 的未來研究背景，目前 P5/P6/P7 仍為資料型基礎。 |
| PERF-S05 | [Schissler 與 Manocha，2018，arXiv:1803.00430v1](https://arxiv.org/abs/1803.00430v1) | 作者預印本。低頻率傳播求解驅動較高頻率音訊渲染、並行模擬的背景。該論文場景的速度比只適用於其測試。 |
| PERF-S06 | [Rayon 1.12.0，ThreadPoolBuilder](https://docs.rs/rayon/1.12.0/rayon/struct.ThreadPoolBuilder.html) | 成熟的 Native 平行工具。用本地固定大小池與純 serial 對照，測啟動、排程、尾延遲及 audio contention。 |
| PERF-S07 | [Rust core 1.99.1，wasm32 intrinsics](https://doc.rust-lang.org/stable/core/arch/wasm32/index.html)，[wasm-bindgen-rayon 官方專案](https://github.com/GoogleChromeLabs/wasm-bindgen-rayon) | WASM SIMD 與原子指令工具。部署 SIMD 和共享記憶體的能力探測各自驗證。Rust Web 多執行緒整合列為實驗，需另記 toolchain、adapter revision、bundler 和瀏覽器版本。 |
| PERF-S08 | [WHATWG HTML Structured Data，2026-11-05 快照](https://html.spec.whatwg.org/multipage/structured-data.html)，[WebAssembly JS API Editor's Draft，2026-11-04](https://webassembly.github.io/spec/js-api/) | Structured clone、transfer 的所有權，以及 WASM 線性記憶體 grow 後的 view 生命週期。標準 clone/transfer 成熟，個別 WebView 能力與實際 copy 次數需驗證。 |
| PERF-S09 | [Chrome 官方 SharedArrayBuffer 說明](https://developer.chrome.com/blog/enabling-shared-array-buffer/) | 以 Chrome 88/92 的啟用條件說明 cross-origin isolation 和 COOP/COEP 影響，作為部署實驗背景。以實際瀏覽器、WebView 與資源相容矩陣補足版本差異。 |
| PERF-S10 | [Chrome DevTools Performance 文件](https://developer.chrome.com/docs/devtools/performance/)，[CDP WebAudio 定義](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/WebAudio.pdl)，[React 19.3 Profiler](https://react.dev/reference/react/Profiler)，[Playwright Emulation](https://playwright.dev/docs/emulation) | 主執行緒、Worker、GC 與 commit 分析工具。CDP WebAudio 為實驗性診斷，記錄 Chrome build 及 fake/real output。React profiler 的負擔單獨保留。Playwright Desktop Chrome profile 會覆寫 UA，需另外記 binary 與主機 OS。 |
| PERF-S11 | [W3C Long Tasks，2026-10-20 Discontinued Draft](https://www.w3.org/TR/2026/DISC-longtasks-1-20261020/)，[W3C Long Animation Frames，2026-04-28 First Public Working Draft](https://www.w3.org/TR/2026/WD-long-animation-frames-20260428/) | Long Tasks 目前是專案保留的 Chromium 驗收訊號。LoAF 為瀏覽器支援時的實驗性補充，量測單位是 frame，與 task 指標分開。 |
| PERF-S12 | [W3C Web Audio 1.1，2026-09-22 Working Draft](https://www.w3.org/TR/2026/WD-webaudio-1.1-20260922/) | Web Audio 圖、render quantum、AudioParam automation 及 AudioWorklet 的規格語意。實際排程與輸出連續性需分別在瀏覽器、裝置量測。 |
| PERF-S13 | [Windows Performance Toolkit](https://learn.microsoft.com/en-us/windows-hardware/test/wpt/)，[Apple Instruments call tree](https://developer.apple.com/documentation/xcode/analyzing-cpu-profiles-with-call-tree-views) | Native 主機診斷工具，可對照 CPU、記憶體與排程。比較效能時將取樣工具的開銷與平台版本寫入證據。 |

## 專案量測證據

| ID | 版本、日期與入口 | 範圍 |
| --- | --- | --- |
| PERF-E01 | [Classic 數值快照](../../../benchmarks/results/mvp-baseline.json)，artifact 1.2、D-052、來源提交 [279613e](https://github.com/kekekewww/Echo-Canva/commit/279613ed189e0f3172af643a216ada438419d83a)。[測試](../../../tests/unit/classic-baseline-capture.test.ts) | 十組六位小數的輸出投影。適用於歷史 Classic 數值比較，完整框架和執行耗時需另取樣。 |
| PERF-E02 | [OfflineAudioContext 量測](../../../benchmarks/results/mvp-baseline-audio.json)，artifact 1.0、來源提交 [dd6890b](https://github.com/kekekewww/Echo-Canva/commit/dd6890b97a97003845c11c35c97af4c07f24d939)。[目前渲染測試](../../../tests/e2e/audio-rendering.spec.ts) | 瀏覽器離線渲染歷史資料及現行測試入口，缺少實體輸出裝置資訊。 |
| PERF-E03 | [Validation 邊界調查](../../../docs/maintenance/evidence/fixes/fix-validator-investigation.md)、[CPU 取樣分析](../../../docs/maintenance/evidence/fixes/fix-validator-profile-analysis.json)、[未開 CPU profiler 邊界分析](../../../docs/maintenance/evidence/fixes/fix-validator-boundary-analysis.json) | 以 build ID `2ny829QrRqlazPRczRblE` 識別實際成品，Windows x64、Node 22.17.0、Chromium 149.0.7827.55、模擬 HC3。CPU 取樣與邊界包裝屬診斷。 |
| PERF-E04 | [2026-10-13 CI remediation](../../../docs/maintenance/CI_REMEDIATION.md)、[before](../../../docs/maintenance/evidence/ci-remediation/fix-visibility-before.json)、[after](../../../docs/maintenance/evidence/ci-remediation/fix-visibility-after.json)、[證據清單](../../../docs/maintenance/evidence/ci-remediation/MANIFEST.json)、[改動 f7ee10e](https://github.com/kekekewww/Echo-Canva-Web/commit/f7ee10e79aca5d68fb647fd61f73c0bb28b7b354) | 可見性早停的歷史 Windows serial 微基準、數值 SHA 與測試。來源含不同 hosted run 的原始失敗和 CI 平台範圍。 |
| PERF-E05 | [2026-11-03 Audio CDP 報告](../../../docs/maintenance/evidence/audio-render-capacity/README.md)、[九個原始 run](../../../docs/maintenance/evidence/audio-render-capacity/runs.json)、[證據雜湊](../../../docs/maintenance/evidence/audio-render-capacity/MANIFEST.json)、[登錄提交 551a552](https://github.com/kekekewww/Echo-Canva-Web/commit/551a552) | 兩個 Classic Workers 的拖曳取樣比較。原始 UA 可能由裝置 profile 注入，須區分報告的主機與 binary，詳見[基準解讀](../../wiki/performance/baseline.md)。 |
| PERF-E06 | [研究基準源碼](../sources/repository.md)、[本輪 Windows 驗證紀錄](../sources/windows-baseline.md) | 固定 audit 版本與本輪執行實況。兩者與歷史效能樣本分開。 |
