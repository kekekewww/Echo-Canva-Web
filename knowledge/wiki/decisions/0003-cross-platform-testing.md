# XR-011 — 共用聲學語料與分層跨平台驗證

- 狀態 **Proposed**
- 日期 2026-11-06
- 基準 [Repository evidence](../../raw/sources/repository.md)
- 相關 [Benchmark 與數值驗證規格](../performance/benchmark-plan.md) · [效能基準](../performance/baseline.md)

## Context

Classic 的核准十案例只比較投影後的聲學結果。Hybrid 有幾何、聲學、分片及瀏覽器驗收，部分即時音訊診斷依賴 Chromium。跨到 Rust／WASM／Desktop 後，core 等價、傳輸成本、互動延遲及實體輸出會分別受到數值、執行緒、WebView 與設備差異影響。當前 Chromium stress 的 24 次門檻及既有回歸保留為 Web release gate。[Classic baseline 測試](../../../tests/unit/classic-baseline-capture.test.ts) · [Chromium stress](../../../tests/e2e/workspace.spec.ts) · [現行人工驗收](../../../docs/ACCEPTANCE_TESTS.md)

## Decision proposal

1. 共用版本化、具 SHA-256 與來源的合法場景、pose/static-edit event tape、故障輸入和決定性期望。兩個模式各自對照當前 TS serial；核准 Classic oracle 照原測試執行。既有 TS 仍為端到端差異的相容性基準。
2. 分別建立 pure solver 數值測試、Worker/WASM/IPC contract test、production UI E2E、offline 音訊及實機連續性／人工聽測。將已移植的子集標記在矩陣，表中缺項說明原因。
3. CI 先跑便宜且決定性的 correctness tests，沿用現行 Web gate。透過固定 Windows x64、macOS arm64 實機做同機配對與 native 能力檢查。新 benchmark 門檻於代表性 TS baseline 取得後評審。每個樣本可回到 commit、corpus、命令、版本與環境。
4. 如果新 backend 驗證不足、資料不完整或失敗，繼續用 TypeScript fallback 並保留完整實驗證據。移植、品質調整及聲學語意變更各有獨立證據和決策。

## Alternatives

- 每個 runtime 自訂語料與 golden。能快啟動獨立原型，但失去跨語言差分、授權及維護一致性。
- 每平台跑單一全系統 benchmark。能量到使用者體感，出現回歸時很難隔離 solver、IPC、render 或設備。
- 以 hosted runner wall time 作 Rust 採用硬門檻。能全自動執行，受 CPU/OS 排程與 runner 變動干擾。現有 stress gate 本身的波動已有記錄。[技術債](../../../docs/maintenance/REMAINING_TECHNICAL_DEBT.md)

## Trade-offs、Compatibility 與 Performance implications

共用 corpus 增加資料治理和 trace 維護，降低比較不同語意與遺漏 fixture 的機率。ID、visibility、mode、source/order、reflection order、revision 與 static fingerprint 使用精確契約。連續數值按欄位與單位比較。Rust 的移植順序可逐子集測量，IPC 與 UI 需獨立通過。額外 profiler 和 telemetry 可能扭曲 tail，驗收量測及診斷 trace 各保留一份。使用固定硬體的多次配對需預留設備與時間，hosted job 可先提供功能覆蓋。

## Migration cost

Phase 1 將 TS 基準生成、manifest 驗證及現有瀏覽器指標組成可重跑的 harness。Phase 2/3 每個 Rust 或 WASM adapter 增加同 corpus runner、exact/float comparator 及最小失敗回報。Phase 4/5 加入 IPC failure injection、WebView 真實驗證、音訊設備與 loopback。跨平台引入依賴與 CI 的工時在各 phase 評估，並依現行 ADR 流程審查。

## Validation plan

- 驗證兩個 OS 上的 corpus bytes、manifest hashes、TS oracle 和錯誤輸入。將候選 runtime 在不同執行緒數下對照 TS serial。
- 發出錯序、重複、失效 generation、錯誤來源分片和 timeout，確認只有完整有效 frame 被採納，並有完整 deterministic fallback。
- 同機量 p50/p95/p99、CPU、peak memory、copy/queue 成本、audio continuity。先將有效場景、同機環境、接受的 noise、門檻、缺值規則與排除條件寫入 run 規格，再執行採用評估。
- 保留現行 Chromium stress、AudioContext、storage migration、offline audio、人工驗收。新增平台的真實設備／OS acceptance 附版本、限制和重跑方法。具體指標與命令見 [驗證規格](../performance/benchmark-plan.md)。

## Rollback plan

保留原 TS 路徑、production suite 與 oracle。新 adapter 的 gate 或可用性不達標時停用其 opt-in，留下一個可重播的差異及 run artifact。過期的研究指標以新版本的 corpus／run manifest 標明取代來源，先保留歷史紀錄供復核。正式架構變更須經 [repo ADR 流程](../../../docs/adr/README.md)。
