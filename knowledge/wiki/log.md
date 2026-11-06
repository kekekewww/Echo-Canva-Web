# 工程知識時間線

依觀察日期由舊到新追加。每筆附可追查的來源、任務或工作階段。

## [2026-11-06] Ingest | 建立基準與治理

登錄 [main 98a4374](../raw/sources/repository.md) 及 [LLM Wiki](../raw/references/memory.md)。由獨立研究 worktree 建立共同入口、任務、來源與驗收規約。

## [2026-11-06] Research | 整合平台、音訊與效能

完成 [現行架構稽核](architecture/current.md)、[平台研究](platforms/web-desktop.md)、[Rust 可行性](platforms/rust-core.md)、[Buffer 評估](audio/buffers.md) 及 [Benchmark 計畫](performance/benchmark-plan.md)。以 [XR 提案](index.md#proposed-adrs) 記錄待驗證的選擇。

## [2026-11-06] Handoff | 基準與後續任務

[工作階段](../sessions/2026-11-06-codex-cross-platform.md) 記錄本輪操作與驗證。[交接](../handoffs/2026-11-06-ec-001-codex.md) 指向 Phase 1 的入口。

## [2026-11-06] Implement | EC-101 固定語料

[來源登錄](../raw/sources/ec-101-corpus-baseline.md) 記錄 72 個 case、凍結的比較規則與驗收重跑。[工作階段](../sessions/2026-11-06-claude-ec-101-corpus.md) 與 [交接](../handoffs/2026-11-06-ec-101-claude.md) 保存過程。EC-101 轉為 Implemented，獨立驗證待進行。

## [2026-11-06] Correction | EC-101 語料更新為 86 個 case

取代上一筆 Implement 記錄中的 72 個 case 數字：維護者於全分支審查後在驗證前加入 clamp、cap 與 locale case，規則重新凍結且檔案逐位元組相同。最終證據在 `cb2ef6d`，見 [來源登錄](../raw/sources/ec-101-corpus-baseline.md)。72 個 case 的第一次驗收保留於 [工作階段](../sessions/2026-11-06-claude-ec-101-corpus.md) 作歷史。EC-101 仍為 Implemented，獨立驗證待進行。

## [2026-11-06] Verify | EC-101 獨立驗證

GPT-Sol 對 `b0807ae` 的結論為 `VERIFIED`，EC-101 轉為 Verified。第一次在 `cd0d6ab` 為 `NOT_VERIFIED`，保留紀錄。見 [驗證工作階段](../sessions/2026-11-06-codex-ec-101-verification.md)、[語料來源](../raw/sources/ec-101-corpus-baseline.md)。非阻擋發現為未決項目，產品未修改。
