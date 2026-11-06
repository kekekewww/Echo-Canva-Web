# 儲存庫查核基準

- 查核日為 2026-11-06（Asia/Taipei）。
- 基準為獨立儲存庫 GitHub `main` 的 [98a4374fa839aa5dee7c6c35e575b8003f7f1a31](https://github.com/kekekewww/Echo-Canva-Web/commit/98a4374fa839aa5dee7c6c35e575b8003f7f1a31)。以 GitHub 讀取與本機 fetch 交叉核對。該提交日期為 2026-11-03。源碼在本機可用 `git show 98a4374:<path>` 重查。
- 原 checkout 分支為 `fix/verification-debt`（`ee859919d1668e3598a9946856dc09e46b3d99e2`），狀態為未追蹤 `.claude/`，無 tracked 差異。本機 `main` 仍在 `3b2a6b5`，fetch 前 `origin/main` 為 `d0c1862`。
- 既有 linked worktrees 為 `chore/deps-refresh-within-majors`（`c3f1271`）及鎖定的 `pr15-marker-fix`（`6e0c261`）。另有本機分支 `worktree-docs-claude-md`（`7739bcc`），其獨立 Adapter 內容未在基準樹。整合前若兩個版本都要採用，合併成一個連結入口。
- 本次研究使用 `research/agent-memory-cross-platform-architecture`，checkout 為工作區下獨立的 `echo-canvas-research`。選擇最新主線作為審查基準，避免把原工作區與未合併分支帶進研究。
- 原始上游 immutable tag、授權、保留檔案與抽取差異依 [ORIGIN](../../../docs/ORIGIN.md)、[LICENSE](../../../LICENSE) 和 [THIRD_PARTY_NOTICES](../../../THIRD_PARTY_NOTICES.md)。[Build Week archive](../../../docs/archive/build-week/INDEX.md) 保有歷史交付脈絡。
- 查核政策與現行參考包括 [AGENTS](../../../AGENTS.md)、[README](../../../README.md)、[CONTRIBUTING](../../../CONTRIBUTING.md)、[架構](../../../docs/ARCHITECTURE.md)、[聲學](../../../docs/ACOUSTICS.md)、[合約](../../../docs/API_CONTRACTS.md)、[研究](../../../docs/RESEARCH.md)、[驗收歷史](../../../docs/ACCEPTANCE_TESTS.md)、[ADR 登錄](../../../docs/adr/README.md) 和 [技術債](../../../docs/maintenance/REMAINING_TECHNICAL_DEBT.md)。

維護文件、測試、原始碼與 benchmarks 已在 Git 內保留。Wiki 採相對連結供當前 checkout 導覽，版本確認以本頁的 commit 為準。
