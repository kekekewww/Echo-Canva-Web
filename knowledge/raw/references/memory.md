# 記憶設計與 Agent 載入來源

登錄日期為 2026-11-06。此頁保存外部參考的身分和適用範圍，綜合結論見 [治理提案](../../wiki/decisions/0004-memory-governance.md)。

| 來源 | 版本與用途 |
| --- | --- |
| [Andrej Karpathy，LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | 2026-04-04 建立，讀取完整 `llm-wiki.md` 正文。頁面 Raw 連結的檔案版本為 `ac46de1ad27f92b28ac95459c782c07f6b8c964a`。來源／綜合知識／操作規約三層，加上增量綜合、索引、時間線與檢查。 |
| [OpenAI Codex，AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | 2026-11-06 文件觀察。專案根目錄至工作目錄的指令發現與 override 規則。 |
| [Anthropic Claude Code，project memory](https://code.claude.com/docs/en/memory) | 2026-11-06 文件觀察。直接發現 AGENTS.md 需要 v2.1.277 以上且受工作階段設定影響，短 `CLAUDE.md` 採文件列出的相對匯入。 |
| [Pi coding agent，Context Files](https://github.com/earendil-works/pi/tree/main/packages/coding-agent#context-files) | 2026-11-06 `main` 文件觀察。確認從祖先及工作目錄讀取專案指令，支援 `AGENTS.override.md`。 |
| [Git worktree](https://git-scm.com/docs/git-worktree) | 2026-11-06 Git 文件。用 branch／linked worktree 分離檔案與索引，審查流程管理共享任務。 |

這些資料以連結及摘要引用。第三方正文、個人 Agent 記憶和使用者附件未入庫。
