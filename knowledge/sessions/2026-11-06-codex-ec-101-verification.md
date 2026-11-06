# 2026-11-06 GPT-Sol EC-101 獨立驗證

任務為 [EC-101](../tasks/EC-101.md)。實作過程見 [Claude Code 工作階段](2026-11-06-claude-ec-101-corpus.md)，交接見 [EC-101 交接](../handoffs/2026-11-06-ec-101-claude.md)，來源登錄見 [EC-101 語料來源](../raw/sources/ec-101-corpus-baseline.md)。候選版本 `b0807aedbc31b34f7db97ab565483c82e14d6191`，基準 `98a4374fa839aa5dee7c6c35e575b8003f7f1a31`。

## 驗證者與環境

驗證者為 GPT-Sol `gpt-6.1-sol`，經 Codex CLI 以 xhigh effort 執行，2026-11-06，Windows x64，Node 22.23.3。使用從 GitHub 取得的全新 clone，以及只疊加 harness 的 detached 基準 worktree。結論：`VERIFIED`。EC-101 的 `Verified` 適用於候選版本 `b0807ae`。其後的提交只帶驗證紀錄與文件，不改 `src/`、`pnpm-lock.yaml`、`benchmarks/corpus/v1/{manifest.json,comparison-rules.json,inputs,expected}` 與先前兩個證據檔。

**沙箱情況**：沒有 OS 沙箱限制驗證者。該工作階段的 Windows 沙箱無法啟動 shell（提升權限：runner 逾時；非提升：exit 0xC0000142）。維護者授權在其 Codex 預設的 `danger-full-access` 下執行。控制者事後從外部檢查：上層 worktree 的 HEAD 與狀態不變，候選 clone 乾淨，基準只有疊加的檔案。

## 兩次嘗試（失敗也保留）

1. 前置：有兩次執行沒有產生結論，因為 Windows 沙箱無法啟動 shell。
2. 第一次完整驗證，`cd0d6ab`：結論 `NOT_VERIFIED`。所有數值與驗收檢查通過。阻擋項是 F01：`knowledge/raw/sources/windows-2026-11-06/` 下兩個既有紀錄的第 2 行含本機絕對 checkout 路徑（不含使用者名稱）。它們來自提交 `2a68438`，經 PR #59 進入 `main`，本分支沒有修改。控制者的 brief 把隱私檢查範圍定為 `98a4374` 之後的所有變更，範圍過寬：`2a68438` 在 `98a4374` 之後，使 brief 涵蓋了本分支未修改的檔案。驗證者照 brief 判定 `NOT_VERIFIED`。維護者隨後把範圍收窄為本分支自 `dd57934` 起的變更。錯在 brief，不在驗證者。同次執行的其他發現：F02（驗收證據檢查沒有驗證記錄的成功與基準身分）、F03（凍結檢查沒有獨立釘住核准的容差值）、F04（Minor，`passthrough` 描述過窄）。皆於 `b0807ae` 修正：結果斷言、手寫的 approved class 表、字面的 rules hash 釘選、README 措辭。竄改測試確認兩種攻擊現在都會失敗。
3. 第二次完整驗證，`b0807ae`：`VERIFIED`。

維護者決定：隱私準則以本分支自 `dd57934` 以來的變更為準，上述兩個紀錄是維護者另行處理的後續項目，未在本分支修改。此頁不引用該路徑。

## 驗證者的實測

**Measured Result**：

- 兩次頂層基準重跑（六個子程序）加一次候選執行，所有 aggregate 皆為 `76d6ad8b3a2b5d1fe0dbec6b0372676903821332c56fb4ecbe53ec897c1598e6`，86/86 bit-exact，0 violations，`productTreesMatchBaseline: true`。
- 自己的比較器（不匯入本儲存庫的）：135,147 個葉節點各恰被一條規則匹配，零 violation。17 個語意探針與本儲存庫的比較器一致。
- 自己的雜湊腳本：172 個 input 與 expected 檔，雜湊、大小、LF、無 BOM 全部相符。
- 25 個規則 class 與維護者決定相符：2 discrete、9 existing-test、14 approved。已凍結，無 proposed。第一次凍結的規則逐位元組相同。
- 獨立重現：十個 Classic oracle 投影對 `benchmarks/results/mvp-baseline.json`、2048 個 `V003` 種子查詢、兩個 64 步 tape。
- 十一項自行的產品變異：九項被抓到，兩項漏掉（`room-acoustics.ts:62` 排序；`validateScene` 的最小牆長 predicate）。七種語料竄改變體。
- 候選版本的儲存庫檢查：85 個單元測試檔、797 個測試；typecheck、ESLint、knowledge lint、source-baseline 皆 exit 0。
- 重現了編號發現中的十三項。

## 驗證者報告為 UNVERIFIED

因為沒有網路與歷史工件，下列沒有被本次驗證確認，它們依賴先前的審查與 CI，不是本次驗證：外部 CI 與跨 OS 紀錄、歷史的 72 個 case 雜訊統計、「不可達 guard」的普遍性結論與先前 400,000 個場景的搜尋、過去的本機事件、第三方變異測試的總數。

## 非阻擋發現

皆為未決項目，本工作未修改產品。

- I1（Important）：`DC05_WALL_EXACTLY_MIN_LENGTH` 沒有呼叫 `validateScene`（`ts-serial-adapter.ts` 的 `runClassicFrame`）。只把 validator 的 predicate 門檻加倍為 0.2 m，86 個輸出仍 bit-exact，儘管 `DC05` 的場景那時會驗證失敗。
- I2（Important）：這些檢查建立的是一致性，不是真實性。一致地偽造的環境或時間戳 metadata 會通過。僅用 CLI 的檢查接受一致地重新雜湊的容差，也接受 draft 規則，除非加 `--require-frozen`；獨立釘住的單元測試會抓到重新雜湊的容差。
- I3（Important）：反轉 `src/acoustics/room-acoustics.ts:62` 的邊界牆 ID 排序不改變任何輸出。已在八處之列。
- I4（Important）：基準的邊界行為依產生結果記錄：垂直方向的 azimuth 奇異、依模式不同的來源重合處理、牆命中的預設厚度、接受非平面與重複頂點的 patch。
- M1（Minor）：交接頁曾寫 `cb2ef6d` 之後只改知識頁與 `CLAUDE.md`，但 `b0807ae` 也改了 `benchmarks/corpus/README.md` 與 `tests/unit/corpus-integrity.test.ts`（新增三個測試）。已更正。
- M2（Minor）：上述兩個既有紀錄含本機路徑，見「兩次嘗試」。

## CI

**Measured Result**：GitHub Actions run 42176534040，提交 `b0807ae`，三個 job 全數通過，`linux` 與 `win32` 印出 aggregate `76d6ad8b3a2b5d1fe0dbec6b0372676903821332c56fb4ecbe53ec897c1598e6`，`bitExact=86/86`。這是目前的 CI 參考。

## 證據檔與 SHA-256

逐位元組複製，未編輯。

| 檔案 | SHA-256 |
| --- | --- |
| [verification-b0807ae.json](../../benchmarks/corpus/v1/evidence/verification-b0807ae.json) | `ae63f6e1444648208f26a6f4fe94838fa8118478c65c88f294173871792e6de6` |
| [verification-b0807ae.md](../../benchmarks/corpus/v1/evidence/verification-b0807ae.md) | `283637c907be7ab34f41826f4d70f0c8501986652d25569a23c314d07e745f3f` |
| [verification-cd0d6ab-not-verified.json](../../benchmarks/corpus/v1/evidence/verification-cd0d6ab-not-verified.json) | `39b337db6bb61036881bdcf5e4ff1b47996ec85ecce93369a0bcf9e3eaf0186d` |
| [verification-cd0d6ab-not-verified.md](../../benchmarks/corpus/v1/evidence/verification-cd0d6ab-not-verified.md) | `25b3c6e11fb60283151033bb9dc43588b6641e0bf647645c007c93e8014d352b` |

## 最終檢查

知識頁提交後的 `pnpm lint`、`pnpm typecheck`、`pnpm test` 等最終檢查見 PR #60，此處不預填。
