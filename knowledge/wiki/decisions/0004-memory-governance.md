# XR-012 多 Agent 工程知識治理

- Date: 2026-11-06
- Status: Proposed

**Context.** 原儲存庫已有維護政策、來源證據、正式 ADR、數值測試與技術債。跨 Agent 容易把歷史比賽交付、個人記憶、暫定研究與有效工程政策混用。[儲存庫基準](../../raw/sources/repository.md) [Karpathy 與 Agent 文件](../../raw/references/memory.md)

**Decision proposal.** 採用 [共同 schema](../../schema.md)。證據以 immutable Git 工件、固定版本來源和分開的 session 檔保留。Wiki 編修綜合結論，任務一檔一 owner，reviewer 在 shared branch 整合索引、認領與驗收。Codex／Pi 讀同一 AGENTS，Claude Code 載入薄 Adapter。工具只做本機可重現 lint。

**Alternatives and trade-offs.** 各 Agent 各自的記憶可貼近客戶端，會增加重複與衝突。集中資料庫／向量檢索適合規模大且可維運的來源集，現在 Git 檔案可直接審查。共享檔案鎖須解決 stale owner、崩潰與跨機器狀態，先用工作樹與人工序列化認領。索引與 log 的整合需要明確 owner。

**Compatibility.** 政策仍在 AGENTS。正式 ADR 的接受與替代流程依 [登錄](../../../docs/adr/README.md)，Build Week 文件保留其歷史身分。

**Performance implications.** 預設從索引、now 和單一任務載入上下文。本機 lint 只讀專案文件，日常使用無網路呼叫。隨知識成長以索引分區降低載入成本。

**Migration cost.** 新增導覽、來源與交接。按任務逐步吸收已有文件，以 Git SHA 連結避免複製歷史。新 Agent 按自己的入口驗證載入。

**Validation plan.** 跑 knowledge lint 的正反案例。由未參與編寫的接手者從入口找任務、檢查證據並指出下一步。模擬同一 task claim 的分支衝突，確認整合者能保留兩份證據、裁定單一 owner。

**Rollback plan.** 單獨還原入口與工具提交，保留原始證據和正式維護文件。若更換索引，從 Git 歷史搬移結論與來源連結。
