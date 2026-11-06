# 音訊與緩衝區原始來源索引

查閱日期為 2026-11-06。下列紀錄以版本、修訂日期或標準快照固定查閱範圍。對於滾動官方文件，保留查閱日期與適用 API。版本更新、新資料或更正另加紀錄，保留原來源。這些資料支持技術能力與限制，Echo Canvas 的結果另見 [儲存庫證據](../sources/repository.md) 及 [音訊研究](../../wiki/audio/buffers.md)。

| ID | 原始來源與版本 | 成熟度及適用範圍 |
| --- | --- | --- |
| WA-10 | [W3C Web Audio API](https://www.w3.org/TR/2021/REC-webaudio-20210617/) · Recommendation，2021-06-17 | 成熟標準。128-frame render quantum、`AudioContext` 時間線、AudioWorklet、AudioBuffer 解碼與輸出延遲。Echo Canvas 已使用 Web Audio graph 和 AudioParam，自訂 worklet 待驗證。 |
| WA-11 | [W3C Web Audio API 1.1](https://www.w3.org/TR/2026/WD-webaudio-1.1-20260922/) · Working Draft，2026-09-22 | 草案。查閱 render quantum size、`renderSizeHint`、`baseLatency`、`outputLatency` 和播放統計。不得假設所有瀏覽器／WebView 都支援新能力或遵照 hint。 |
| CPAL | [RustAudio CPAL 原始碼與 backend 表](https://github.com/RustAudio/cpal/tree/v0.18.2) · [CPAL 0.18.2 BufferSize](https://docs.rs/cpal/0.18.2/cpal/enum.BufferSize.html) | 已發布 I/O library，Echo Canvas 尚未採用。查閱 host 選擇、target feature、裝置格式和 callback 實際大小。該版 README 列出 macOS CoreAudio 14.2+、loopback 14.6+，之後選版時重驗最低平台及授權。 |
| CA | [Apple Core Audio Essentials](https://developer.apple.com/library/archive/documentation/MusicAudio/Conceptual/CoreAudioOverview/CoreAudioEssentials/CoreAudioEssentials.html) · Apple Documentation Archive 概觀 | Core Audio HAL、Audio Units、裝置時間與檔案服務的原廠架構說明。頁面為歷史架構資料，當前 SDK、裝置權限及支援版本以 CPAL 選版和目標 OS 驗證。 |
| WA-SAPI | [Microsoft About WASAPI](https://learn.microsoft.com/en-us/windows/win32/coreaudio/wasapi) · [Windows Low Latency Audio，IAudioClient3](https://learn.microsoft.com/en-us/windows-hardware/drivers/audio/low-latency-audio) | 成熟平台 SDK。Windows endpoint buffer、shared／exclusive、Windows 10+ 支援週期及裝置 invalidation。實際週期、驅動能力與裝置延遲需實機量測。 |
| ALSA | [ALSA PCM API](https://www.alsa-project.org/alsa-doc/alsa-lib/pcm.html) · alsa-lib 線上參考 | 成熟 Linux PCM 介面。查閱 frame、interleaved／non-interleaved、period 與 xrun 狀態。以實際 host 和後端記錄為準。 |
| PW | [PipeWire Latency Support](https://docs.pipewire.org/page_latency.html) · 1.6.11 | 成熟 Linux 音訊基礎設施。圖中 latency 計算和 quantum 的參考。Echo Canvas 的 PipeWire 路徑及 CPAL 選用功能尚未測試。 |
| PA | [PortAudio v19 callback 指南](https://portaudio.com/docs/v19-doxydocs/writing_a_callback.html) · v19 API | 成熟即時工程參考。回呼要避免有無界執行時間的工作，包括配置／釋放、I/O、等待與 mutex。此處引用其回呼紀律。 |
| SPSC | [rtrb](https://docs.rs/rtrb/latest/rtrb/) · 0.4.1 | 已發布候選，Echo Canvas 尚未驗證。SPSC 固定容量且滿／空立即回報。payload 的配置、析構、採樣格式及應用端讀寫上界仍需驗證。 |
| Rust Atomic | [Rust std Atomic Ordering](https://doc.rust-lang.org/std/sync/atomic/enum.Ordering.html) · std 1.99.1 | 成熟 API。release／acquire 的可見性基礎。slot 讀寫權限、生命週期、回收和正確性需要獨立證明。 |
| HTML | [WHATWG HTML Safe passing of structured data](https://html.spec.whatwg.org/multipage/structured-data.html) · Living Standard 2026-11-05 | 成熟 structured clone 與 ArrayBuffer transfer。SharedArrayBuffer 序列化有隔離能力與 agent cluster 條件。跨部署和 WebView 支援尚未驗證。 |
| CDP | [Chromium WebAudio DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/tot/WebAudio/#method-getRealtimeData) · tip of tree | 實驗性診斷介面。依瀏覽器版本保留 render capacity 和 callback 統計。專案已有 headless Chrome 測試，裝置結果及其他引擎要用其他測量方式。 |
| IndexedDB | [W3C Indexed Database API 3.0](https://www.w3.org/TR/2026/WD-IndexedDB-3-20261030/) · Working Draft，2026-10-30 | IndexedDB 基本能力已用於現行 Blob 儲存。3.0 草案作交易、quota 與錯誤條件參考。 |
| FS | [WHATWG File System](https://fs.spec.whatwg.org/commit-snapshots/d76d3455d5afe2f85754ed24ffdbf99fe30032d4/) · 2026-10-19 快照 | 規範描述 origin storage、可寫串流及關閉提交的行為。Echo Canvas 尚未驗證長時錄音、持久性、權限及瀏覽器支援。 |
| REC | [W3C MediaStream Recording](https://www.w3.org/TR/2026/WD-mediastream-recording-20260316/) · Working Draft，2026-03-16 | Web 快捷預覽錄製候選。可測 MIME type，chunk 與 codec 選擇需要實測。現階段不建議作為可證明無損的正式錄音資料路徑。 |
| RF64 | [EBU Tech 3306 v1.1](https://tech.ebu.ch/docs/tech/tech3306v1_1.pdf) · 2009-07 Technical Specification | RIFF/WAVE 原有 32-bit chunk 尺寸限制與 RF64 長檔延伸的規格。錄製格式尚待選擇及跨工具驗證。 |
| FLAC | [RFC 9639](https://datatracker.ietf.org/doc/html/rfc9639) · IETF Proposed Standard，2024-12 | 無損整數 PCM codec。原始 Float32 PCM 若要逐樣本原樣保存，需選相容表示，或另審並明示量化。 |
| Win Replace | [Microsoft ReplaceFileW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-replacefilew) · Win32 `winbase.h` | 成熟 Windows 檔案替換 API。檔案 handle、同 volume、錯誤恢復與斷電持久性是分開的驗證問題。 |
