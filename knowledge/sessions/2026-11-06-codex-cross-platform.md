# 2026-11-06 Codex 研究工作階段

任務為 [EC-001](../tasks/EC-001.md)。從 [98a4374](../raw/sources/repository.md) 建立研究分支與獨立 checkout。App 的 managed worktree 請求未回報完成，確認沒有新增 checkout 後使用 Git 建立 linked worktree。

## 工作與變更

- 整合者建立 schema、導覽、任務、lint、報告與交接。分配互斥文件範圍給架構、平台、即時音訊、效能、benchmark 與本機執行代理。
- 稽核代理比對 live entry、模型、Worker、Audio 與 API，驗證既有來源歷史。各研究代理以 pinned source、官方規格及論文提出候選方案。
- [索引](../wiki/index.md) 列出研究文件與來源。[路線圖](../wiki/roadmap.md) 列出可接續任務和驗收。正式 ADR 登錄只新增導覽，研究 ADR 保持 Proposed。

## 驗證

- 獨立 Codex reviewer 從 AGENTS／Claude Adapter 進入，找到基準、EC-001 依賴、EC-101 的認領與第一步、驗收及預期證據，並確認 Desktop 為提案。Reviewer 亦成功重跑 knowledge lint。本機 `--version` 顯示 Codex 0.166.0、Claude Code 2.1.318、Pi 0.85.1。Claude／Pi 的入口以官方載入規則與靜態檢查驗證。
- `node --check scripts/lint-knowledge.mjs` 通過。隔離 fixture 驗證一個成功案例及七個失敗案例，涵蓋失效目標／片段、缺證據 Verified、自我依賴、未知狀態、Claude 匯入遺漏與孤頁。
- 用 `git merge-file -p` 模擬同一 Ready 任務被兩個 Agent 認領。Git 回傳一個衝突區，保留兩個 owner／branch 候選，可依 [Reconcile](../schema.md#操作流程) 指派一位並保留工作日誌。
- 來源歷史檢查 `node scripts/verify-source-baseline.mjs` 已通過。確認 291 個 immutable source 檔、來源樹與目的端初始化提交。
- Windows Node 22.23.3 的 `eslint . --max-warnings=0` 與 TypeScript `tsc --noEmit` 通過。
- [Windows 基準執行紀錄](../raw/sources/windows-baseline.md) 保存環境、指令和實際輸出結果。此處的基準驗證是歷史與現行 Web 的證據。
- Claude Code／Pi 的完整模型 session、完整 E2E、Docker、跨平台對照、Native／WASM、裝置音訊、長時間錄製與聽測尚未執行。產品面後續驗證見 [Benchmark 計畫](../wiki/performance/benchmark-plan.md)。

## 可重開入口

看 [交接](../handoffs/2026-11-06-ec-001-codex.md) 與 [EC-101](../tasks/EC-101.md)。目前證據先支持保存現行合約、準備語料與 profiling，再決定 Rust 和 Desktop 原型的採用門檻。
