# Browser listening and Docker Desktop checks

This is a repeatable human test protocol, not a completed test report. Physical headphone output, subjective HRTF/localization, and device-interruption listening are **NOT EXECUTED by automation**. The macOS Docker Desktop procedure below is **NOT EXECUTED in the current verification environment**. Earlier Windows Docker Desktop results are in [Docker verification](../maintenance/DOCKER_VERIFICATION.md); rerun against the commit being reviewed. Native/CI operating-system jobs and OfflineAudioContext checks do not establish physical sound output or Docker Desktop file watching.

## Preparation and result record

Use a disposable browser profile, current desktop Chrome or Edge, a quiet location, and headphones at a comfortable low level. Disable optional OS spatial-audio effects for a repeatable comparison and record any effects you retain. Export existing projects before replacing them; use only the bundled procedural audio or redistributable mono fixtures. No provider key is needed.

Start either native `pnpm dev` after a frozen install, or the Docker development command below. Keep the same browser origin throughout: `localhost` and `127.0.0.1`, or different ports, have separate storage. Record:

```text
Commit / date / tester:
Host OS / CPU architecture:
Browser and exact version / browser profile:
Headphone or output device / connection / OS audio effects:
Native or Docker / Node-pnpm or Engine-Compose versions:
URL / mode / preset or sanitized exported fixture:
Check / PASS, FAIL, or NOT RUN / observation and reproduction:
Console error / accepted scene revision / log or screenshot reference:
```

Mark a listening result as an observation by that tester. Do not infer measurement accuracy, a named browser HRTF dataset, or universal localization from it.

## Browser audio and HRTF

1. Open a fresh session in **2.5D**, load **Hard Room**, and confirm no sound before **Play**. Select its Radio source, press Play, and verify actual output through the selected headphones. The Raw/Simulated toolbar button names the mode it will switch to: while Simulated is active it reads **Raw**.
2. Set Listener X/Z to `(5, 4)` and Heading to `0°`. Move the source between `(2, 5)`, `(5, 5)`, and `(8, 5)` using the Inspector. Pause at each position until a matching accepted frame is visible. Record perceived left/center/right, continuity, and any crack, burst, unexpected silence, or duplicated loop. Source/listener must remain distinct.
3. Rotate Heading through `0°`, `90°`, and `180°` at a fixed source position. Record the audible change against listener orientation rather than camera orientation. Repeat steps 1–3 in **3D** with source/listener Y=1.5 m; then compare source Y=0.5 and 2.5 m. Elevation/front-back judgments vary by listener/browser; record ambiguity rather than treating it as calibrated accuracy.
4. For an explicit HRTF/equal-power comparison, export that mode's authoring JSON. Make a second copy changing only `project.scene.settings.hrtfEnabled` from `true` to `false`, and import it into the same mode. Repeat the same positions, then restore the original export. There is no dedicated HRTF toolbar toggle. A listening comparison is separate from the unit assertion that the graph selects `HRTF`/`equalpower`.
5. Compare Raw/Simulated several times, then Play/Stop three times. Record smooth transitions, correct cessation of output, and absence of duplicate playback. Switch 2.5D/3D during playback and confirm a single audible scene. Record all errors; do not dismiss a silent browser because unit tests passed.
6. With low playback level, use the OS output selector to change devices, or disconnect/reconnect headphones. Also try backgrounding/restoring the tab and a normal OS sleep/wake. Record whether audio continues, suspends, or needs Stop/Play/Retry, with browser messages. This is an exploratory lifecycle check: automatic device recovery is not an established baseline guarantee. Finish by stopping audio.

For an occlusion/Portal comparison, use **Concrete Partition** in each mode, place the listener on the opposite side of the wall below the doorway, and compare the open Portal route with closed blocked fallback. Confirm the displayed route before describing its perceived direction/filtering. For late reverb, compare **Hard Room** and **Treated Room** and record the displayed RT60 values and sustained character. These are approximation checks, not diffraction or room calibration; [ACOUSTICS.md](../ACOUSTICS.md) defines the boundaries.

## Local audio and IndexedDB

1. Save the bundled `/audio/radio-loop.wav` from the running site as a local fixture, then use **Add**'s source action and **Import WAV / MP3 / Ogg**. Disable the other sources through the Inspector to isolate the imported source, and confirm it plays. In DevTools Application/Storage, inspect IndexedDB `echo-canvas-audio` → `assets`; capture metadata only, not private audio.
2. With DevTools Network preserving requests, import/play that fixture. Confirm no audio blob is posted to `/api/scene/*` or another server route. Built-in `/audio/` GET requests are expected; do not call the AI controls during this check.
3. Change the source position, stop audio, wait at least two seconds for the project save, and refresh. Confirm metadata, position, and playable local audio return. A **Memory-only warning** means persistence was unavailable and this persistence check fails or must be recorded as that explicit limitation.
4. Export authoring JSON and inspect it: it should contain local metadata/IDs, not a base64/blob audio payload. Import the export in a second fresh profile at the same URL/mode. Confirm **Relink required**, retained source transform, and silence for the missing asset. Use **Relink audio** with the same mono fixture; verify playback resumes and position stays unchanged.
5. Return to the first profile, select **Remove local audio**, confirm removal, and check that the source remains in place but silent until relinked. Dispose of only the test profile afterward; do not clear a user's real library.

## Windows/macOS Docker Desktop hot reload

Run this procedure separately on Windows Docker Desktop and macOS Docker Desktop. A Linux container running on Windows does not validate the macOS host. **macOS Desktop status remains NOT EXECUTED until an actual tester records it.**

```sh
docker version
docker compose version
docker compose -f compose.dev.yaml up --build --watch
```

1. Use Linux containers and Compose 2.32+. Open `http://localhost:3000` in the host browser, edit a Listener coordinate, and wait for save. Check both editor modes and Play with headphones when recording a physical-output result.
2. In the host editor, temporarily change the visible `Acoustic scene editor` text in `src/components/workspace/WorkspaceToolbar.tsx` to a unique probe such as `Watch probe 2026-10-13`. Save; record the save time, Compose sync/rebuild log, and time the text appears **without refreshing**. Record page/console errors. No fixed latency threshold is implied by this manual protocol.
3. Restore exactly the original text and confirm another automatic update. Check `git diff -- src/components/workspace/WorkspaceToolbar.tsx` to ensure the probe leaves no source change. A sync message alone is insufficient; verify the rendered text and restoration.
4. Run lint, typecheck, and units via `docker compose -f compose.dev.yaml exec web pnpm ...` as documented in [the Docker guide](../deployment/docker.md). Restart with `docker compose -f compose.dev.yaml restart web`; reopen the same origin and confirm the saved coordinate/local fixture persists and Play still works. Capture logs and any failures.
5. If there is no sync event, check Compose version, checkout/sharing permissions, and ignored paths. If sync succeeds but Next misses it, follow the guide's optional polling override and record a separate result. Default polling is off; **the fallback is NOT EXECUTED unless explicitly tested**. A partial-save parse error or concurrent image rebuild must be recorded; retry after sync settles and retain both outcomes.

A successful native macOS job or a hosted Linux Docker smoke does not mark this Desktop test passed. Attach the filled record to the relevant issue/PR and keep unrun rows as NOT RUN. Preserve earlier failures when adding a successful rerun.
