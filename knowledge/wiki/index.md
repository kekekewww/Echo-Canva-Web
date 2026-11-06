# Echo Canvas 工程知識索引

開始工作時依序讀 [維護政策](../../AGENTS.md)、[目前狀態與最近交接](now.md)、[共同知識規約](../schema.md)。依需要打開任務、研究頁及其來源。

## 系統與研究

| 頁面 | 查詢用途 |
| --- | --- |
| [技術報告](technical-report.md) | 跨平台結論、採用關卡、整合範圍與未決問題 |
| [現行架構稽核](architecture/current.md) | 入口、資料／控制流、聲學與測試、現行及歷史邊界 |
| [Web 與 Desktop](platforms/web-desktop.md) | Repository、UI、AI、儲存、部署與權限 |
| [Rust Core 可行性](platforms/rust-core.md) | 模組移植順序、數值／Worker／IPC 合約及回退 |
| [效能基準](performance/baseline.md) | 現行控制、歷史與本機量測、證據等級，含 EC-102 本 build 的新結果 |
| [計算最佳化](performance/optimization.md) | Geometry、BVH、反射、併行、WASM、渲染與品質實驗 |
| [Buffer 與即時音訊](audio/buffers.md) | Frame、訊息、PCM、資料生命週期與錄製 |
| [Benchmark 與數值計畫](performance/benchmark-plan.md) | 七條執行路徑、場景、工件、容差與採用門檻 |
| [工程路線圖](roadmap.md) | 依賴、驗收、風險、回退與可認領任務 |
| [工作時間線](log.md) | 資料納入與查核紀錄 |
| [EC-101 交接](../handoffs/2026-11-06-ec-101-claude.md) | 固定語料的實作狀態與獨立重跑步驟 |
| [EC-102 交接](../handoffs/2026-11-07-ec-102-claude.md) | Windows 剖析的實作狀態與獨立驗證步驟 |
| [EC-102 驗證後更正](../sessions/2026-11-07-claude-ec-102-corrections.md) | 第一次獨立驗證 NOT_VERIFIED 後的缺陷、修正與下一步 |

## Proposed ADRs

- [XR-001 至 XR-006 平台與共享核心](decisions/0001-platform-and-core.md)
- [XR-007 至 XR-010 音訊、Buffer、執行緒與錄製](decisions/0002-audio-and-ownership.md)
- [XR-011 跨平台測試與效能驗收](decisions/0003-cross-platform-testing.md)
- [XR-012 多 Agent 知識治理](decisions/0004-memory-governance.md)
- [正式 ADR 登錄及審查流程](../../docs/adr/README.md)

## 來源登錄

- [儲存庫 SHA、查核與歷史](../raw/sources/repository.md)
- [Windows 基準執行](../raw/sources/windows-baseline.md)
- [EC-101 固定語料](../raw/sources/ec-101-corpus-baseline.md)
- [EC-102 Windows 剖析](../raw/sources/ec-102-windows-profiling.md)
- [Karpathy Gist 與 Agent 工具文件](../raw/references/memory.md)
- [Rust、WASM 與 Tauri](../raw/references/platforms.md)
- [Audio、DSP 與後端](../raw/references/audio.md)
- [聲學與效能](../raw/references/performance.md)
