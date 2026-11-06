# 2026-11-07 Claude Code EC-102 剖析工作階段

任務為 [EC-102](../tasks/EC-102.md)，依賴 [EC-101](../tasks/EC-101.md)。分支 `perf/ec-102-profiling`，worktree `.claude/worktrees/ec-102-profiling`，基準 `46c61c5`。結果與限制見 [EC-102 Windows 剖析來源登錄](../raw/sources/ec-102-windows-profiling.md)，證據在 [results 目錄](../../benchmarks/perf/results/ec-102-windows-2026-11-06/README.md)。接續 [EC-101 工作階段](2026-11-06-claude-ec-101-corpus.md)。

## 嘗試過的事

- 建立 `benchmarks/perf/` harness 與 `scripts/perf/` CLI，只加量測，不改 `src/`、語料與門檻。三個邊界：`node-core`、`browser-pool`、`browser-app`。
- 以凍結 tape（TC01、TC02、TH01、TH02）closed-loop 重播，並新增長工作負載 W01 至 W04（`benchmarks/perf/workloads/v1/`）。
- 先跑 pilot（`p01` 至 `p21`），再跑 Round 1（harness `973eddc`）、控制組與 Round 2（`bac507a`）、scheduler／attribution／invalidation trace（`dc1bfe3`）。
- 對時、正向控制、viewport 因果控制、完整 Chromium 與 GPU 旗標控制，以及 `cc` scheduler trace。
- 五份計畫放在 [benchmarks/perf/plans/ec-102/](../../benchmarks/perf/plans/ec-102/)。

## 命令

```text
node scripts/corpus/cli.mjs verify --require-frozen
node scripts/perf/cli.mjs run --plan <plan> --out .perf-runs/<id>
node scripts/perf/cli.mjs summarize --out .perf-runs/<id> --to benchmarks/perf/results/ec-102-windows-2026-11-06
node scripts/perf/cli.mjs rederive <runDir>
node scripts/perf/cli.mjs analyze <runDir>
node scripts/perf/pack-evidence.mjs
node scripts/perf/cli.mjs scan <paths...>
```

## 已知失敗

- **流程失敗，寫到工作區之外**。子代理在 stock smoke 期間，因路徑未加引號，把 7 個檔案（261 KB）寫到工作區的一個同層資料夾，違反維護者規則。安全檢查擋下刪除，維護者已被告知。原因是 shell 字串 spawn，已修正；runner 現在拒絕 repo 外的 `--out` 與未設定的暫存變數。那次遺失的執行回報 p95 114 ms，不在索引中。
- **推導 bug 與 `rederive`**。六次 in-app 執行起初因 harness 對某個計算階段的驗證 bug 而結束為 `failed`，不是量測失敗。它們用 `rederive` 從保留的原始檔重建，保留 `originalStatus` 與 `originalError`。它們的 render capacity 樣本因只在記憶體而遺失，由 Round 2 補上。
- **pilot 的音訊階段歸因錯誤**。pilot 的 in-app 推導把 AudioParam 呼叫歸到下一個 job。pilot 只當 pilot 保留。stock 結果有效，因為 stock 執行沒有 probe。
- **分析器的 GC 重複計算與 busy 重複計算**。兩者都在分析器中發現並修正。
- **錯的執行檔雜湊**。Round 1 的 `environment.json` 記錄完整 Chromium 的雜湊 `7f08161bbeb2...`，實際啟動的是 headless shell（`f77d8e27c8db...`）。從 `bac507a` 起記錄實際啟動的 build。
- **磁碟保護停止**。D: 低於 15 GB 時，保護停止 Round 1，進度 51／73。`r1-node-th01` 停在 `started` 並保留。其餘群組在安靜時段計畫以 `r1b-*` 與 `par-*` 執行。
- **stock gate**：12 次中 3 次失敗，失敗保留，未重試，未刪除。
- **GPU raster 沒有達成**。見來源登錄發現 1 的無結論控制。
- **macOS 沒有執行**。SSH 在這台機器上拒絕金鑰。

## 維護者決定

- Round 1 之前：「現在跑，標示雜訊」。機器有其他負載，結果依此標示。
- 停止遺留的 `find`。
- Codex 僅在這次驗證中不使用沙箱。
- 這一輪只跑 Windows。

## 結果摘要

**Measured Result**，細節與限制見來源登錄。

- in-app gate 的尾端在 trace 與 viewport 控制下，主要是 main thread 等待 raster 的 commit。
- 12 次 stock 執行 9 次通過、3 次失敗。結果依賴罕見尖峰與同機負載，小樣本不證明。
- 視窗內 long task 分三類，C 類是測試驅動程式。
- Hybrid 靜態安裝是獨立且可重現的成本。
- pose 延遲與速率限制間隔一致。
- Worker 對 serial 在 p99 沒有通則。
- 驗證、GC、音訊呼叫在這份證據上不是尾端原因。
- Chromium 與 Node 的一致性：Node bit-exact，Chromium 最大 2 ulp、在容差內。

沒有提出或更改任何門檻，12 ms 與 50 ms 預算不變。沒有任何項目被宣稱已修復。

## 待查假設

每個假設的反證方法見來源登錄。

- Chromium 與 Node 的 2 ulp 差異來自 V8 `Math` 版本差異。
- GPU raster 能縮小或消除 commit 等待。
- layer 21 為何需要大量 raster（invalidation 來源未隔離）。
- 尖峰成群或依賴負載。
- 測試驅動程式對 stock 視窗的 long task 有貢獻。
- 頁面閒置時 Windows 計時器合併。
- 通常 3 ms 的更新驗證呼叫為何花超過 100 ms。

## 下一條命令

從獨立 checkout 執行 `git status --short --branch`、`git rev-parse HEAD`、`node scripts/lint-knowledge.mjs`。再執行 `node scripts/corpus/cli.mjs verify --require-frozen` 與 `node scripts/perf/cli.mjs scan benchmarks/perf/results/ec-102-windows-2026-11-06`，之後依 [交接](../handoffs/2026-11-07-ec-102-claude.md) 做獨立驗證。

## 可重開入口

看 [交接](../handoffs/2026-11-07-ec-102-claude.md)。
