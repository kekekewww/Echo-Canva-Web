# Web Audio render capacity and accepted frames during a drag

Date: 2026-11-03. This is benchmark evidence for [#25](https://github.com/kekekewww/Echo-Canva-Web/issues/25) and [#23](https://github.com/kekekewww/Echo-Canva-Web/issues/23). It is not a pass/fail gate, and it is not listening or real-device evidence.

## Method

`tests/e2e/audio-render-capacity.spec.ts` is opt-in:

```sh
pnpm build
ECHO_AUDIO_BENCHMARK=1 pnpm exec playwright test tests/e2e/audio-render-capacity.spec.ts
```

The spec opens `/classic` (Concrete Partition), presses Play, and waits until the Worker reports frames. It then samples the DevTools `WebAudio.getRealtimeData` values for the page's AudioContext every 250 ms:

- **`renderCapacity`:** the fraction of each render quantum's time budget spent rendering.
- **Callback interval mean and variance.**

It first samples 2 s idle, then 10 s while dragging the Rain source in a small figure-of-eight. Pointer moves are 16 ms apart, plus Playwright overhead, which gives about 275 moves in 10 s, roughly 27 Hz. At each sample during the drag it also records the status bar's accepted acoustic revision (`data-acoustic-revision`). That value is empty when no frame is accepted for the current scene.

The same spec file was copied unchanged into each baseline checkout. Every tree was built with `pnpm build` and served by `pnpm start`. Runs were interleaved (pre-#40, `main`, branch) for three rounds to spread machine drift.

## Environment

- Linux cloud container with 4 logical CPUs (`navigator.hardwareConcurrency` 4, 2 Classic Workers).
- Headless Chrome for Testing 153.0.8010.12 driven by Playwright 1.64.1, with no physical audio device. Its callback interval of about 10 ms reflects the headless output, not a real sound card.
- Node 22.23.4, pnpm 11.7.0.

## Results (`runs.json`)

| Tree | Commit | Drag render capacity, mean | p95 | Accepted frames sampled during the drag |
| --- | --- | --- | --- | --- |
| Before PR #40 | `0ab76be` | 0.219 / 0.213 / 0.211 | 0.324 / 0.296 / 0.283 | 0/39, 0/39, 0/40 |
| `main` after PR #40, before #23 | `905db67` | 0.152 / 0.182 / 0.146 | 0.218 / 0.227 / 0.207 | 0/39, 0/40, 0/40 |
| Branch after #23 and #24 | `fe2786a` | 0.145 / 0.170 / 0.158 | 0.222 / 0.325 / 0.236 | 39/39, 39/39, 39/39 |

Single-sample maxima are noisy in this shared container (up to 0.98 on `main`, round 2), so they are only recorded in `runs.json`.

## Interpretation and limits

- **#23.** Before the change, the workspace accepted no acoustic frame at any sample during a continuous 10 s drag, on both earlier trees. Overlays had no frame and audio held its last state until the pointer stopped. After #23, every sample saw an accepted frame.
- **#25 / PR #40.** Mean audio render load during the drag fell from about 0.21 to about 0.15–0.18 after PR #40, which removed the per-revision free-field fallback writes and re-scheduled targets. #23 keeps it in that range while frames are applied during the drag.
- These are three runs on one virtual machine with a headless fake output. They do not establish underrun rates on real hardware, the effect of `latencyHint`, or listening quality. The `latencyHint` default and the Worker capacity formula are unchanged; evaluating them needs this harness on real devices (#7, #25).
