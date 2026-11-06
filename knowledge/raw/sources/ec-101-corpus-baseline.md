# EC-101 固定語料來源登錄 · 2026-11-06

**取得日期** 2026-11-06 Asia/Taipei。**系統** Echo Canvas TypeScript 實作，由 Claude Code (Opus 5.5 orchestrator) 在分支 `test/ec-101-corpus` 產生。**工作分支起點** `dd57934c31915c64c0c505face8cdb7534a24346`（當時的 `main`）。**驗收基準** `98a4374fa839aa5dee7c6c35e575b8003f7f1a31`，見 [儲存庫快照](repository.md)。**授權** 與儲存庫相同的 MIT，見 [LICENSE](../../../LICENSE)。語料不含私有音檔、金鑰或使用者資料。**草稿 PR** [#60](https://github.com/kekekewww/Echo-Canva-Web/pull/60)。

本登錄只記錄 EC-101 的交付物與其證據。EC-101 的 Status 為 Implemented，獨立驗證尚未進行。

## 範圍

**Verified Fact**：下列範圍來自 [語料 README](../../../benchmarks/corpus/README.md) 與 `benchmarks/corpus/v1/manifest.json`。

- 72 個 case：classic-frame 20、hybrid-frame 15、hybrid-visibility 4、hybrid-second-order 4、workspace-migration 13、scene-validation 8、hybrid-patch 4、classic-tape 2、hybrid-tape 2。標籤 migration 13、degenerate 24。
- 場景覆蓋 S1 6、S2 8、S3 2、S4 6、S5 2、S6 2、S7 6。S8、S9、S10 與完整 60 Hz × 60 s tape 不在範圍，屬 EC-102 及後續工作。
- C001 至 C010 為既有 Classic 回歸場景，replay 測試逐欄位對照 [既有 Classic 工件](../../../benchmarks/results/mvp-baseline.json)。
- 種子：`V003_SEEDED_2048` 為 20261013，`TC01_LISTENER_TAPE_SEEDED` 與 `TH01_LISTENER_TAPE_SEEDED` 為 20261106。PRNG 為 `lcg32-v1`，記於 manifest。敏感度擾動的符號亦取自 `lcg32(20261106)`。
- 不含計時、剖析、音訊、Rust、WASM、Desktop 與 Worker pool。

## 工件與雜湊

**Verified Fact**：以 `sha256sum` 對提交 `9f60c93` 的檔案核對。

| 工件 | SHA-256 |
| --- | --- |
| [manifest.json](../../../benchmarks/corpus/v1/manifest.json) | `0d0d268b9af6da26192aae12fee97c219bc3834787ddcd3222cc554a26c65eb4` |
| [comparison-rules.json](../../../benchmarks/corpus/v1/comparison-rules.json) | `ecd33cd6bb4010474a471dc2e937f302d14ec6d8aaffcd2b819ab8bb6cc6fa74` |
| [acceptance-rerun.json](../../../benchmarks/corpus/v1/evidence/acceptance-rerun.json) | `c340782c78d57cd975b75b5fc0f47a19ac886287b03722426924fe6ed1583481` |
| 三次驗收執行共同的 aggregate 輸出 | `027f31592b3e8c72adee2a9c079363f4f82624aa9238159cfdad9445543fa4c3` |

其他工件：`benchmarks/corpus/v1/inputs/`、`benchmarks/corpus/v1/expected/`（逐檔 SHA-256 在 manifest）、[sensitivity.json](../../../benchmarks/corpus/v1/evidence/sensitivity.json)。`benchmarks/corpus/v1` 約 7.2 MB。程式在 `benchmarks/corpus/harness/`、`scripts/corpus/`、`tests/corpus/`、`vitest.corpus.config.ts`，單元測試為 `tests/unit/corpus-comparator.test.ts`、`corpus-integrity.test.ts`、`corpus-replay.test.ts`。

提交（舊到新）：`e5de2f3`、`c61ca1f`、`7980625`、`63f91de`、`442caa2`、`e45a465`、`aa5b985`、`6e6c454`、`27d7048`、`e8a1024`、`d82092b`、`9f60c93`。

## 基準一致性

**Verified Fact**：起點 `dd57934` 與 `98a4374` 在 `src`（tree `8550eb37f1486053b86bcfbefd15f6156e2e02ab`）、`package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`patches`、`next.config.ts`、`tsconfig.json`、`vitest.config.ts`、`.nvmrc`、`benchmarks/results/mvp-baseline.json` 的 git tree 相同，已記入 manifest。本分支 `git diff 98a4374 HEAD -- src pnpm-lock.yaml` 為空。`package.json` 只新增 `corpus:*` scripts。

## 比較規則

**Verified Fact**：[comparison-rules.json](../../../benchmarks/corpus/v1/comparison-rules.json) 為 `status: "frozen"`、`frozenOn: 2026-11-06`，共 25 個 class：2 個 discrete、9 個 existing-test、14 個 approved。2026-11-06 維護者核准如下。

| 欄位 | 規則 | 依據 |
| --- | --- | --- |
| 六個 Classic oracle class（m、m3、s、ms、dB、Hz） | decimal 6 | 既有測試：`src/benchmarks/classic-baseline.ts`、`benchmarks/results/mvp-baseline.json` |
| Hybrid `distanceM`、`pathLengthM`、`delayMs`、一階 `excessDelayMs`、`elevationDeg` | atol 1e-5、rtol 0 | 既有測試，規則檔以 `file:line` 引用 |
| 其他 Hybrid 欄位（輔助長度與延遲、點、方向、gain、cut-off、二階指標） | atol 1e-5、rtol 0 | 維護者核准 |
| oracle 以外的 Classic 欄位（`routePolyline`、`reflectionPoint(s)`、`totalSurfaceM2`、`reverbSendDb`、`preDelayMs`、反射 `lowpassHz`） | atol 1e-6、rtol 0 | 維護者核准 |
| `azimuthDeg` | circular、atol 1e-5、period 360 | 維護者核准，`DH02` 仍納入比較 |
| ID、enum、boolean、hash、計數、陣列順序與長度、遷移直通數值 | exact | 離散合約。並列反射的順序依維護者決定保持 exact |

這些容差只適用於 TypeScript 對 TypeScript 的語料比較。它們不是跨語言移植的容差結論，見 [目前狀態](../../wiki/now.md) 的未決事項。

## 實測結果

**Measured Result**：驗收重跑。環境 Windows x64、Node 22.23.3。從 `98a4374` 的 detached checkout，只疊加 `benchmarks/corpus`、`scripts/corpus`、`tests/corpus`、`vitest.corpus.config.ts`。執行 A 與 B 依 manifest 順序，C 依相反順序，各為新程序。三個 aggregate 相同，0 violations，72/72 bit-exact，`productTreesMatchBaseline: true`，`productTreeDiffs: []`。命令：

```text
node scripts/corpus/cli.mjs rerun --out .corpus-runs/acceptance --evidence evidence-acceptance.json
```

工件為 [acceptance-rerun.json](../../../benchmarks/corpus/v1/evidence/acceptance-rerun.json)。其中 `gitDirty` 列出疊加的檔案與該次執行自身的輸出檔。限制：單一機器，單一作業系統。

**Measured Result**：跨作業系統。GitHub Actions run 42160363814，提交 `e8a1024`，Node v22.23.3。`linux` 與 `win32` 印出相同 aggregate hash，`bitExact=72/72`。三個 CI job 全數通過（Ubuntu 與 Windows 的 Application checks 與 Chromium E2E，Production Docker integration）。未執行 macOS。

**Measured Result**：敏感度，[sensitivity.json](../../../benchmarks/corpus/v1/evidence/sensitivity.json)。在 39 個 frame 與 tape case 中，每個位置與牆端點座標以 ±δ 擾動，δ 為 1e-12 m 與 1e-9 m，符號取自 `lcg32(20261106)`。排除 azimuth 與離散變化後，比較單位中的最大變化在 1e-12 為 2.54e-10（`classic-cutoff-hz`），在 1e-9 為 2.53e-7。azimuth 在 `DH02` 移動 135 度。kernel、migration、validation、patch 不被擾動。`hybrid-metric-*` class 沒有敏感度資料。

## 未執行

macOS；Worker pool、WASM、Rust、Desktop 變體；計時或剖析；實體音訊與聽測。控制者在本提交之後執行的最終檢查不在本登錄，見 [PR #60](https://github.com/kekekewww/Echo-Canva-Web/pull/60) 與後續工作階段紀錄。

## 報告的發現

以下為 **Verified Fact**，可由指名的 case 重現。它們是報告，作為待維護者或後續移植工作處理的未決項目。本工作未修改產品，未宣稱任何一項已修復。

1. Classic 使用細線測試，Hybrid 則擠出牆厚，兩者在牆邊附近路由不同。`C011` 對 `H008`：路徑偏離 `stress_81` 中心線 25 mm，半厚 40 mm，Classic 為 `direct`，Hybrid 為 `blocked`。`TC01` 對 `TH01` 亦同。
2. 剛好擦過門邊時兩者不同：`DC04` Classic 非 direct 並走 portal 路徑，`DH05` Hybrid 在開口上緣為 direct。
3. Hybrid 牆命中回報 `thicknessM` 為 0.1（`makePatch3` 預設值），不是作者設定的厚度，因為 `src/acoustics/hybrid3d/compile.ts` 未傳入。音訊不受影響：`src/acoustics/hybrid3d/audible-direct.ts:62` 使用 `wall.thicknessM`，只有 primitive 讀 `hit.thicknessM`。
4. 並列的 Classic 反射以 gain 完全相等排序（`src/acoustics/image-source.ts:151`），因此 1e-12 m 的位移會在 `C001`、`DC02` 與 `TC02` 的一個步驟交換並列牆。浮點雜訊不同的移植可能因順序失敗。
5. 來源在 listener 正上方或正下方時 `azimuthDeg` 未定義（`DH02`）。
6. 來源與 listener 重合：Classic 回傳有限的 direct 路徑（`DC01`），Hybrid 擲出錯誤（`DH01`）。距離在約 1e-8 m 內但不相等時，Hybrid 擲出不同訊息，因為 `normalize3` 的門檻與 `distanceM <= 0` 檢查不同。
7. `makePatch3` 接受非平面與重複頂點的四邊形（`DK03`、`DK04`）。
8. 重複的 wall id 會重新指向 portal 的牆查詢，新增 `portal_detached`（`DV04`）。
9. 線段剛好終止於 patch 頂點時不回報命中，穿過頂點則回報（`DK05`）。
10. Hybrid `propagationDirection` 的 y 與 z 出現 `-0`。JSON 無法保存，因此逐 case 列在 `negativeZeroPaths` 並寫為 `0`。
11. Classic 六位小數捨入在邊界處可能因雜訊失敗：δ = 1e-9 時 3,306 個 oracle class 葉節點中有 11 個 violation，1e-12 時為 0。
12. `TH02` 有 primitive 位於房間邊界，座標位移可能使 tape 驗證失敗。

## 本機事件

不含路徑。系統磁碟在工作階段中被占滿，短暫阻擋工具，維護者已釋出空間。工作在第二個磁碟上進行，分支當時已推送。兩個子代理違反工作規則，把暫存檔寫到 worktree 之外。控制者移除了其中一個檔案。仍有一個暫存目錄留待維護者移除，因為安全檢查擋下了子代理的遞迴刪除，控制者沒有繞過。
