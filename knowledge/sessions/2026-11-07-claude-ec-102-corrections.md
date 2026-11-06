# 2026-11-07 Claude Code EC-102 驗證後更正工作階段

接續 [EC-102 剖析工作階段](2026-11-07-claude-ec-102-profiling.md)。任務為 [EC-102](../tasks/EC-102.md)，狀態維持 Implemented，沒有 Verified。更正內容見[來源登錄的更正記錄](../raw/sources/ec-102-windows-profiling.md)與[更正表](../../benchmarks/perf/results/ec-102-windows-2026-11-06/corrections-after-verification.md)。

## 第一次獨立驗證

在提交 `63a50c6` 的結論是 NOT_VERIFIED（[報告](../../benchmarks/perf/results/ec-102-windows-2026-11-06/verification/63a50c6-not-verified-report.md)、[盲答](../../benchmarks/perf/results/ec-102-windows-2026-11-06/verification/63a50c6-blind-answers.md)）。驗證者重現了 commit-wait 與 Hybrid static-install 機制，但 Windows 驗收未達成。macOS 仍是開放限制，不是這個結論的原因。

## 缺陷與修正

harness 修正在提交 `08f8227`，沒有重新量測。

- open-loop 的 warm 標記計的是輸入事件，不是 job。修正後以 job 計。
- 合併樣本在時間戳相同時遺失。修正後 `merge.assemble` 在 46 個 pool 執行中都等於原始組裝次數。
- per-worker 摘要覆蓋同名執行緒，GC 摘要涵蓋整份 trace。修正後各 worker 分開，GC 取視窗內數字。
- Production Docker job 失敗：`next build` 型別檢查 `tests/unit/perf-*.test.ts`，其匯入被 `.dockerignore` 排除。修正為允許 `benchmarks/perf/harness/`。

## rederive 結果

`rederive --all`：重新推導 76 個執行，略過 33 個。略過的是沒有原始檔的 stock 與 node 執行；`ctl-app` 沒有 samples。數值取自 `summary.json` 在 `rederive` 前後的差異。

## 驗證者的 TEMP 拒絕

驗證者執行 `generate-workloads --check` 時，TEMP 被拒絕。原因是 orchestrator 的簡報要求它把 TEMP 放在 clone 之外，與工具的限制衝突。這是簡報的問題，不是產品或 harness 的缺陷。

## 下一步

第二次獨立驗證。驗證前不要把 EC-102 改為 Verified。
