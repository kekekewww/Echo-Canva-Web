# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workspace.spec.ts >> survives the full entity-limit project within Worker and interaction budgets
- Location: tests\e2e\workspace.spec.ts:281:5

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 12
Received:   63
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - strong [ref=e5]: Echo Canvas
        - generic [ref=e6]: Acoustic scene editor
      - generic "Editor mode" [ref=e7]:
        - button "2.5D" [ref=e8] [cursor=pointer]
        - button "3D" [pressed] [ref=e9] [cursor=pointer]
      - generic [ref=e10]:
        - button "＋ Add" [ref=e11] [cursor=pointer]
        - button "Stop" [pressed] [ref=e12] [cursor=pointer]
        - button "Raw" [ref=e13] [cursor=pointer]
        - button "Undo" [ref=e14] [cursor=pointer]: ↶
        - button "Redo" [disabled] [ref=e15]: ↷
        - button "Reset" [ref=e16] [cursor=pointer]
        - button "Settings" [ref=e17] [cursor=pointer]: ⚙
    - generic [ref=e18]:
      - complementary "Scene Outliner" [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: Scene
          - generic [ref=e22]: 3D
        - navigation [ref=e23]:
          - paragraph [ref=e24]: Listeners
          - button "Stress Listener 1" [ref=e25] [cursor=pointer]:
            - generic [ref=e27]: Stress Listener 1
          - button "Stress Listener 2" [ref=e28] [cursor=pointer]:
            - generic [ref=e30]: Stress Listener 2
          - button "Stress Listener 3" [ref=e31] [cursor=pointer]:
            - generic [ref=e33]: Stress Listener 3
          - button "Stress Listener 4" [ref=e34] [cursor=pointer]:
            - generic [ref=e36]: Stress Listener 4
          - button "Stress Listener 5" [ref=e37] [cursor=pointer]:
            - generic [ref=e39]: Stress Listener 5
          - button "Stress Listener 6" [ref=e40] [cursor=pointer]:
            - generic [ref=e42]: Stress Listener 6
          - button "Stress Listener 7" [ref=e43] [cursor=pointer]:
            - generic [ref=e45]: Stress Listener 7
          - button "Stress Listener 8 Active" [active] [pressed] [ref=e46] [cursor=pointer]:
            - generic [ref=e48]: Stress Listener 8
            - emphasis [ref=e49]: Active
          - paragraph [ref=e50]: Sources
          - button "Stress Source 1" [ref=e51] [cursor=pointer]:
            - generic [ref=e53]: Stress Source 1
          - button "Stress Source 2" [ref=e54] [cursor=pointer]:
            - generic [ref=e56]: Stress Source 2
          - button "Stress Source 3" [ref=e57] [cursor=pointer]:
            - generic [ref=e59]: Stress Source 3
          - button "Stress Source 4" [ref=e60] [cursor=pointer]:
            - generic [ref=e62]: Stress Source 4
          - paragraph [ref=e63]: Geometry
          - button "stress boundary north" [ref=e64] [cursor=pointer]:
            - generic [ref=e66]: stress boundary north
          - button "stress boundary east" [ref=e67] [cursor=pointer]:
            - generic [ref=e69]: stress boundary east
          - button "stress boundary south" [ref=e70] [cursor=pointer]:
            - generic [ref=e72]: stress boundary south
          - button "stress boundary west" [ref=e73] [cursor=pointer]:
            - generic [ref=e75]: stress boundary west
          - button "stress 0" [ref=e76] [cursor=pointer]:
            - generic [ref=e78]: stress 0
          - button "stress 1" [ref=e79] [cursor=pointer]:
            - generic [ref=e81]: stress 1
          - button "stress 2" [ref=e82] [cursor=pointer]:
            - generic [ref=e84]: stress 2
          - button "stress 3" [ref=e85] [cursor=pointer]:
            - generic [ref=e87]: stress 3
          - button "stress 4" [ref=e88] [cursor=pointer]:
            - generic [ref=e90]: stress 4
          - button "stress 5" [ref=e91] [cursor=pointer]:
            - generic [ref=e93]: stress 5
          - button "stress 6" [ref=e94] [cursor=pointer]:
            - generic [ref=e96]: stress 6
          - button "stress 7" [ref=e97] [cursor=pointer]:
            - generic [ref=e99]: stress 7
          - button "stress 8" [ref=e100] [cursor=pointer]:
            - generic [ref=e102]: stress 8
          - button "stress 9" [ref=e103] [cursor=pointer]:
            - generic [ref=e105]: stress 9
          - button "stress 10" [ref=e106] [cursor=pointer]:
            - generic [ref=e108]: stress 10
          - button "stress 11" [ref=e109] [cursor=pointer]:
            - generic [ref=e111]: stress 11
          - button "stress 12" [ref=e112] [cursor=pointer]:
            - generic [ref=e114]: stress 12
          - button "stress 13" [ref=e115] [cursor=pointer]:
            - generic [ref=e117]: stress 13
          - button "stress 14" [ref=e118] [cursor=pointer]:
            - generic [ref=e120]: stress 14
          - button "stress 15" [ref=e121] [cursor=pointer]:
            - generic [ref=e123]: stress 15
          - button "stress 16" [ref=e124] [cursor=pointer]:
            - generic [ref=e126]: stress 16
          - button "stress 17" [ref=e127] [cursor=pointer]:
            - generic [ref=e129]: stress 17
          - button "stress 18" [ref=e130] [cursor=pointer]:
            - generic [ref=e132]: stress 18
          - button "stress 19" [ref=e133] [cursor=pointer]:
            - generic [ref=e135]: stress 19
          - button "stress 20" [ref=e136] [cursor=pointer]:
            - generic [ref=e138]: stress 20
          - button "stress 21" [ref=e139] [cursor=pointer]:
            - generic [ref=e141]: stress 21
          - button "stress 22" [ref=e142] [cursor=pointer]:
            - generic [ref=e144]: stress 22
          - button "stress 23" [ref=e145] [cursor=pointer]:
            - generic [ref=e147]: stress 23
          - button "stress 24" [ref=e148] [cursor=pointer]:
            - generic [ref=e150]: stress 24
          - button "stress 25" [ref=e151] [cursor=pointer]:
            - generic [ref=e153]: stress 25
          - button "stress 26" [ref=e154] [cursor=pointer]:
            - generic [ref=e156]: stress 26
          - button "stress 27" [ref=e157] [cursor=pointer]:
            - generic [ref=e159]: stress 27
          - button "stress 28" [ref=e160] [cursor=pointer]:
            - generic [ref=e162]: stress 28
          - button "stress 29" [ref=e163] [cursor=pointer]:
            - generic [ref=e165]: stress 29
          - button "stress 30" [ref=e166] [cursor=pointer]:
            - generic [ref=e168]: stress 30
          - button "stress 31" [ref=e169] [cursor=pointer]:
            - generic [ref=e171]: stress 31
          - button "stress 32" [ref=e172] [cursor=pointer]:
            - generic [ref=e174]: stress 32
          - button "stress 33" [ref=e175] [cursor=pointer]:
            - generic [ref=e177]: stress 33
          - button "stress 34" [ref=e178] [cursor=pointer]:
            - generic [ref=e180]: stress 34
          - button "stress 35" [ref=e181] [cursor=pointer]:
            - generic [ref=e183]: stress 35
          - button "stress 36" [ref=e184] [cursor=pointer]:
            - generic [ref=e186]: stress 36
          - button "stress 37" [ref=e187] [cursor=pointer]:
            - generic [ref=e189]: stress 37
          - button "stress 38" [ref=e190] [cursor=pointer]:
            - generic [ref=e192]: stress 38
          - button "stress 39" [ref=e193] [cursor=pointer]:
            - generic [ref=e195]: stress 39
          - button "stress 40" [ref=e196] [cursor=pointer]:
            - generic [ref=e198]: stress 40
          - button "stress 41" [ref=e199] [cursor=pointer]:
            - generic [ref=e201]: stress 41
          - button "stress 42" [ref=e202] [cursor=pointer]:
            - generic [ref=e204]: stress 42
          - button "stress 43" [ref=e205] [cursor=pointer]:
            - generic [ref=e207]: stress 43
          - button "stress 44" [ref=e208] [cursor=pointer]:
            - generic [ref=e210]: stress 44
          - button "stress 45" [ref=e211] [cursor=pointer]:
            - generic [ref=e213]: stress 45
          - button "stress 46" [ref=e214] [cursor=pointer]:
            - generic [ref=e216]: stress 46
          - button "stress 47" [ref=e217] [cursor=pointer]:
            - generic [ref=e219]: stress 47
          - button "stress 48" [ref=e220] [cursor=pointer]:
            - generic [ref=e222]: stress 48
          - button "stress 49" [ref=e223] [cursor=pointer]:
            - generic [ref=e225]: stress 49
          - button "stress 50" [ref=e226] [cursor=pointer]:
            - generic [ref=e228]: stress 50
          - button "stress 51" [ref=e229] [cursor=pointer]:
            - generic [ref=e231]: stress 51
          - button "stress 52" [ref=e232] [cursor=pointer]:
            - generic [ref=e234]: stress 52
          - button "stress 53" [ref=e235] [cursor=pointer]:
            - generic [ref=e237]: stress 53
          - button "stress 54" [ref=e238] [cursor=pointer]:
            - generic [ref=e240]: stress 54
          - button "stress 55" [ref=e241] [cursor=pointer]:
            - generic [ref=e243]: stress 55
          - button "stress 56" [ref=e244] [cursor=pointer]:
            - generic [ref=e246]: stress 56
          - button "stress 57" [ref=e247] [cursor=pointer]:
            - generic [ref=e249]: stress 57
          - button "stress 58" [ref=e250] [cursor=pointer]:
            - generic [ref=e252]: stress 58
          - button "stress 59" [ref=e253] [cursor=pointer]:
            - generic [ref=e255]: stress 59
          - button "stress 60" [ref=e256] [cursor=pointer]:
            - generic [ref=e258]: stress 60
          - button "stress 61" [ref=e259] [cursor=pointer]:
            - generic [ref=e261]: stress 61
          - button "stress 62" [ref=e262] [cursor=pointer]:
            - generic [ref=e264]: stress 62
          - button "stress 63" [ref=e265] [cursor=pointer]:
            - generic [ref=e267]: stress 63
          - button "stress 64" [ref=e268] [cursor=pointer]:
            - generic [ref=e270]: stress 64
          - button "stress 65" [ref=e271] [cursor=pointer]:
            - generic [ref=e273]: stress 65
          - button "stress 66" [ref=e274] [cursor=pointer]:
            - generic [ref=e276]: stress 66
          - button "stress 67" [ref=e277] [cursor=pointer]:
            - generic [ref=e279]: stress 67
          - button "stress 68" [ref=e280] [cursor=pointer]:
            - generic [ref=e282]: stress 68
          - button "stress 69" [ref=e283] [cursor=pointer]:
            - generic [ref=e285]: stress 69
          - button "stress 70" [ref=e286] [cursor=pointer]:
            - generic [ref=e288]: stress 70
          - button "stress 71" [ref=e289] [cursor=pointer]:
            - generic [ref=e291]: stress 71
          - button "stress 72" [ref=e292] [cursor=pointer]:
            - generic [ref=e294]: stress 72
          - button "stress 73" [ref=e295] [cursor=pointer]:
            - generic [ref=e297]: stress 73
          - button "stress 74" [ref=e298] [cursor=pointer]:
            - generic [ref=e300]: stress 74
          - button "stress 75" [ref=e301] [cursor=pointer]:
            - generic [ref=e303]: stress 75
          - button "stress 76" [ref=e304] [cursor=pointer]:
            - generic [ref=e306]: stress 76
          - button "stress 77" [ref=e307] [cursor=pointer]:
            - generic [ref=e309]: stress 77
          - button "stress 78" [ref=e310] [cursor=pointer]:
            - generic [ref=e312]: stress 78
          - button "stress 79" [ref=e313] [cursor=pointer]:
            - generic [ref=e315]: stress 79
          - button "stress 80" [ref=e316] [cursor=pointer]:
            - generic [ref=e318]: stress 80
          - button "stress 81" [ref=e319] [cursor=pointer]:
            - generic [ref=e321]: stress 81
          - button "stress 82" [ref=e322] [cursor=pointer]:
            - generic [ref=e324]: stress 82
          - button "stress 83" [ref=e325] [cursor=pointer]:
            - generic [ref=e327]: stress 83
          - button "stress 84" [ref=e328] [cursor=pointer]:
            - generic [ref=e330]: stress 84
          - button "stress 85" [ref=e331] [cursor=pointer]:
            - generic [ref=e333]: stress 85
          - button "stress 86" [ref=e334] [cursor=pointer]:
            - generic [ref=e336]: stress 86
          - button "stress 87" [ref=e337] [cursor=pointer]:
            - generic [ref=e339]: stress 87
          - button "stress 88" [ref=e340] [cursor=pointer]:
            - generic [ref=e342]: stress 88
          - button "stress 89" [ref=e343] [cursor=pointer]:
            - generic [ref=e345]: stress 89
          - button "stress 90" [ref=e346] [cursor=pointer]:
            - generic [ref=e348]: stress 90
          - button "stress 91" [ref=e349] [cursor=pointer]:
            - generic [ref=e351]: stress 91
          - button "stress 92" [ref=e352] [cursor=pointer]:
            - generic [ref=e354]: stress 92
          - button "stress 93" [ref=e355] [cursor=pointer]:
            - generic [ref=e357]: stress 93
          - button "stress 94" [ref=e358] [cursor=pointer]:
            - generic [ref=e360]: stress 94
          - button "stress 95" [ref=e361] [cursor=pointer]:
            - generic [ref=e363]: stress 95
          - button "stress portal 0" [ref=e364] [cursor=pointer]:
            - generic [ref=e366]: stress portal 0
          - button "stress portal 1" [ref=e367] [cursor=pointer]:
            - generic [ref=e369]: stress portal 1
          - button "stress portal 2" [ref=e370] [cursor=pointer]:
            - generic [ref=e372]: stress portal 2
          - button "stress portal 3" [ref=e373] [cursor=pointer]:
            - generic [ref=e375]: stress portal 3
          - button "stress portal 4" [ref=e376] [cursor=pointer]:
            - generic [ref=e378]: stress portal 4
          - button "stress portal 5" [ref=e379] [cursor=pointer]:
            - generic [ref=e381]: stress portal 5
          - button "stress portal 6" [ref=e382] [cursor=pointer]:
            - generic [ref=e384]: stress portal 6
          - button "stress portal 7" [ref=e385] [cursor=pointer]:
            - generic [ref=e387]: stress portal 7
          - paragraph [ref=e388]: Room
          - button "Room dimensions" [ref=e389] [cursor=pointer]:
            - generic [ref=e391]: Room dimensions
          - paragraph [ref=e392]: Surfaces
          - button "Floor" [ref=e393] [cursor=pointer]:
            - generic [ref=e395]: Floor
          - button "Ceiling" [ref=e396] [cursor=pointer]:
            - generic [ref=e398]: Ceiling
      - generic [ref=e399]:
        - generic [ref=e400]:
          - generic [ref=e401]: Stress Test — 100 Walls
          - generic [ref=e402]: Worker
        - generic [ref=e403]:
          - generic [ref=e404]:
            - generic [ref=e405]:
              - paragraph [ref=e406]: 3D viewport
              - heading "Orbit · select · place" [level=3] [ref=e407]
            - generic "Camera views" [ref=e408]:
              - button "Paths" [pressed] [ref=e409] [cursor=pointer]
              - button "Show all paths" [ref=e410] [cursor=pointer]
              - button "Ceiling" [pressed] [ref=e411] [cursor=pointer]
              - button "Top" [ref=e412] [cursor=pointer]
              - button "Front" [ref=e413] [cursor=pointer]
              - button "Home" [ref=e414] [cursor=pointer]
              - button "Frame All" [ref=e415] [cursor=pointer]
          - paragraph [ref=e416]:
            - generic [ref=e417]: "Amber: listener"
            - generic [ref=e418]: "Cyan: source / Portal"
            - generic [ref=e419]: "Coral: wall"
            - generic [ref=e420]: "Drag: X/Z"
            - generic [ref=e421]: "Shift-object: Y"
            - generic [ref=e422]: "MMB / Shift-empty: pan"
            - generic [ref=e423]: "Wheel: zoom"
            - generic [ref=e424]: "North: +Z"
          - group "Interactive 3D acoustic scene viewport" [ref=e425]:
            - button "Drag stress_portal_0 along its wall" [ref=e1043]:
              - generic: Portal
            - button "Drag stress_portal_1 along its wall" [ref=e1047]:
              - generic: Portal
            - button "Drag stress_portal_2 along its wall" [ref=e1051]:
              - generic: Portal
            - button "Drag stress_portal_3 along its wall" [ref=e1055]:
              - generic: Portal
            - button "Drag stress_portal_4 along its wall" [ref=e1059]:
              - generic: Portal
            - button "Drag stress_portal_5 along its wall" [ref=e1063]:
              - generic: Portal
            - button "Drag stress_portal_6 along its wall" [ref=e1067]:
              - generic: Portal
            - button "Drag stress_portal_7 along its wall" [ref=e1071]:
              - generic: Portal
            - img "First-order reflection; stress_91 point 1; 4.60 metres; 7.40 milliseconds; -13.8 decibels" [ref=e1077]
            - button "Drag Stress Listener 1 in 3D scene; X 1.0 m, Y 1.5 m, Z 1.0 m" [ref=e1078]:
              - generic: Stress Listener 1
              - generic: X 1.0 · Y 1.5 · Z 1.0
            - button "Drag Stress Listener 2 in 3D scene; X 2.0 m, Y 1.5 m, Z 2.0 m" [ref=e1082]:
              - generic: Stress Listener 2
              - generic: X 2.0 · Y 1.5 · Z 2.0
            - button "Drag Stress Listener 3 in 3D scene; X 3.0 m, Y 1.5 m, Z 3.0 m" [ref=e1086]:
              - generic: Stress Listener 3
              - generic: X 3.0 · Y 1.5 · Z 3.0
            - button "Drag Stress Listener 4 in 3D scene; X 4.0 m, Y 1.5 m, Z 4.0 m" [ref=e1090]:
              - generic: Stress Listener 4
              - generic: X 4.0 · Y 1.5 · Z 4.0
            - button "Drag Stress Listener 5 in 3D scene; X 5.0 m, Y 1.5 m, Z 1.0 m" [ref=e1094]:
              - generic: Stress Listener 5
              - generic: X 5.0 · Y 1.5 · Z 1.0
            - button "Drag Stress Listener 6 in 3D scene; X 6.0 m, Y 1.5 m, Z 2.0 m" [ref=e1098]:
              - generic: Stress Listener 6
              - generic: X 6.0 · Y 1.5 · Z 2.0
            - button "Drag Stress Listener 7 in 3D scene; X 7.0 m, Y 1.5 m, Z 3.0 m" [ref=e1102]:
              - generic: Stress Listener 7
              - generic: X 7.0 · Y 1.5 · Z 3.0
            - button "Drag Stress Listener 8 · Active in 3D scene; X 8.0 m, Y 1.5 m, Z 4.0 m" [ref=e1106]:
              - generic: Stress Listener 8 · Active
              - generic: X 8.0 · Y 1.5 · Z 4.0
            - button "Drag Stress Source 1 in 3D scene; X 8.0 m, Y 1.0 m, Z 6.0 m" [ref=e1110]:
              - generic: Stress Source 1
              - generic: X 8.0 · Y 1.0 · Z 6.0
            - button "Drag Stress Source 2 in 3D scene; X 8.7 m, Y 1.4 m, Z 6.3 m" [ref=e1113]:
              - generic: Stress Source 2
              - generic: X 8.7 · Y 1.4 · Z 6.3
            - button "Drag Stress Source 3 in 3D scene; X 9.4 m, Y 1.8 m, Z 6.7 m" [ref=e1116]:
              - generic: Stress Source 3
              - generic: X 9.4 · Y 1.8 · Z 6.7
            - button "Drag Stress Source 4 in 3D scene; X 10.1 m, Y 2.2 m, Z 7.0 m" [ref=e1119]:
              - generic: Stress Source 4
              - generic: X 10.1 · Y 2.2 · Z 7.0
            - generic "XYZ coordinate axes":
              - generic: X
              - generic: "Y"
              - generic: Z
            - generic "Compass; north is positive Z":
              - generic: "N"
              - generic: +Z north
      - complementary "Inspector" [ref=e1122]:
        - generic [ref=e1123]:
          - generic [ref=e1124]: Inspector
          - generic [ref=e1125]: listener
        - generic [ref=e1126]:
          - generic [ref=e1127]:
            - text: Preset
            - combobox "Scene preset" [ref=e1128]:
              - option "Concrete Partition"
              - option "Hard Room"
              - option "Treated Room"
              - option "Stress Test — 100 Walls" [selected]
          - group [ref=e1129]:
            - generic "AI scene tools" [ref=e1130] [cursor=pointer]
          - group [ref=e1131]:
            - generic "Import / export" [ref=e1132] [cursor=pointer]
        - generic [ref=e1133]:
          - heading "Transform" [level=3] [ref=e1134]
          - generic [ref=e1135]:
            - button "Drag to adjust X position" [ref=e1136]: X
            - textbox "X position" [ref=e1137]: "8"
            - generic [ref=e1138]: m
          - generic [ref=e1139]:
            - button "Drag to adjust Y position" [ref=e1140]: "Y"
            - textbox "Y position" [ref=e1141]: "1.5"
            - generic [ref=e1142]: m
          - generic [ref=e1143]:
            - button "Drag to adjust Z position" [ref=e1144]: Z
            - textbox "Z position" [ref=e1145]: "4"
            - generic [ref=e1146]: m
          - button "Reset position" [ref=e1147] [cursor=pointer]
          - generic [ref=e1148]:
            - button "Drag to adjust Heading" [ref=e1149]: Heading
            - textbox "Heading" [ref=e1150]: "105"
            - generic [ref=e1151]: °
        - generic [ref=e1152]:
          - button "Disable" [ref=e1153] [cursor=pointer]
          - button "Delete" [ref=e1154] [cursor=pointer]
    - generic [ref=e1155]:
      - generic [ref=e1156]: Ready
      - generic [ref=e1158]: Listener Stress Listener 8
      - generic [ref=e1159]: Route blocked
      - generic [ref=e1160]: Gain -36.0 dB
      - generic [ref=e1161]: RT60 0.34 s
      - generic [ref=e1162]: Worker
      - group [ref=e1163]:
        - generic "Debug" [ref=e1164]
  - alert [ref=e1165]
```

# Test source

```ts
  376 |     const sourceCount = 4;
  377 |     const hardwareConcurrency = navigator.hardwareConcurrency;
  378 |     const capacity = !Number.isFinite(hardwareConcurrency) || hardwareConcurrency <= 0
  379 |       ? 1
  380 |       : Math.min(4, Math.max(1, Math.floor(hardwareConcurrency) - 2));
  381 |     return Math.min(sourceCount, capacity);
  382 |   });
  383 |   const statusbar = page.locator(".workspace-statusbar");
  384 |   await expect(statusbar).toHaveAttribute("data-worker-count", String(expectedWorkerCount));
  385 |   if (expectedWorkerCount >= 2) {
  386 |     expect(Number(await statusbar.getAttribute("data-worker-count"))).toBeGreaterThanOrEqual(2);
  387 |   }
  388 |
  389 |   for (let index = 0; index < 3; index += 1) {
  390 |     await outliner.locator(".kind-listener").nth(index).click();
  391 |     await page.waitForTimeout(120);
  392 |   }
  393 |   await page.evaluate(() => {
  394 |     const state = window as Window & {
  395 |       __echoLongTasks?: number[];
  396 |       __echoLongTaskObserver?: PerformanceObserver;
  397 |       __echoLongTaskObserverActive?: boolean;
  398 |     };
  399 |     state.__echoLongTasks = [];
  400 |     state.__echoLongTaskObserverActive = true;
  401 |     state.__echoLongTaskObserver = new PerformanceObserver((list) => {
  402 |       state.__echoLongTasks?.push(...list.getEntries().map(({ duration }) => duration));
  403 |     });
  404 |     state.__echoLongTaskObserver.observe({ type: "longtask", buffered: false });
  405 |   });
  406 |   const timings: number[] = [];
  407 |   const completedSequences = new Set<number>();
  408 |   let previousSequence = Number(await statusbar.getAttribute("data-acoustic-sequence"));
  409 |   let previousRevision = Number(await statusbar.getAttribute("data-acoustic-revision"));
  410 |   expect(Number.isFinite(previousSequence)).toBe(true);
  411 |   expect(Number.isFinite(previousRevision)).toBe(true);
  412 |   for (let index = 0; index < 24; index += 1) {
  413 |     await outliner.locator(".kind-listener").nth(index % 8).click();
  414 |     await expect.poll(async () => statusbar.evaluate((element, expected) => {
  415 |       const timing = element.getAttribute("data-worker-compute-ms");
  416 |       const revision = element.getAttribute("data-acoustic-revision");
  417 |       const sequence = element.getAttribute("data-acoustic-sequence");
  418 |       const workerCount = element.getAttribute("data-worker-count");
  419 |       const workerSource = element.getAttribute("data-worker-source");
  420 |       return workerSource === "Worker"
  421 |         && workerCount !== null && workerCount !== "" && Number(workerCount) === expected.workerCount
  422 |         && timing !== null && timing !== "" && Number.isFinite(Number(timing))
  423 |         && revision !== null && revision !== "" && Number.isFinite(Number(revision))
  424 |         && Number(revision) > expected.revision
  425 |         && sequence !== null && sequence !== "" && Number.isFinite(Number(sequence))
  426 |         && Number(sequence) > expected.sequence;
  427 |     }, {
  428 |       revision: previousRevision,
  429 |       sequence: previousSequence,
  430 |       workerCount: expectedWorkerCount,
  431 |     })).toBe(true);
  432 |     const sample = await statusbar.evaluate((element) => ({
  433 |       timing: element.getAttribute("data-worker-compute-ms"),
  434 |       revision: element.getAttribute("data-acoustic-revision"),
  435 |       sequence: element.getAttribute("data-acoustic-sequence"),
  436 |       workerCount: element.getAttribute("data-worker-count"),
  437 |       workerSource: element.getAttribute("data-worker-source"),
  438 |     }));
  439 |     expect(sample.timing).not.toBeNull();
  440 |     expect(sample.timing).not.toBe("");
  441 |     expect(sample.revision).not.toBeNull();
  442 |     expect(sample.revision).not.toBe("");
  443 |     expect(sample.sequence).not.toBeNull();
  444 |     expect(sample.sequence).not.toBe("");
  445 |     expect(sample.workerSource).toBe("Worker");
  446 |     expect(sample.workerCount).toBe(String(expectedWorkerCount));
  447 |     const timing = Number(sample.timing);
  448 |     const revision = Number(sample.revision);
  449 |     const sequence = Number(sample.sequence);
  450 |     expect(Number.isFinite(timing)).toBe(true);
  451 |     expect(Number.isFinite(revision)).toBe(true);
  452 |     expect(Number.isFinite(sequence)).toBe(true);
  453 |     expect(completedSequences.has(sequence)).toBe(false);
  454 |     completedSequences.add(sequence);
  455 |     timings.push(timing);
  456 |     previousRevision = revision;
  457 |     previousSequence = sequence;
  458 |   }
  459 |   expect(await page.evaluate(() => (
  460 |     window as Window & { __echoLongTaskObserverActive?: boolean }
  461 |   ).__echoLongTaskObserverActive)).toBe(true);
  462 |   const longTasks = await page.evaluate(() => {
  463 |     const state = window as Window & {
  464 |       __echoLongTasks?: number[];
  465 |       __echoLongTaskObserver?: PerformanceObserver;
  466 |       __echoLongTaskObserverActive?: boolean;
  467 |     };
  468 |     state.__echoLongTasks?.push(...(state.__echoLongTaskObserver?.takeRecords().map(({ duration }) => duration) ?? []));
  469 |     state.__echoLongTaskObserver?.disconnect();
  470 |     state.__echoLongTaskObserverActive = false;
  471 |     return state.__echoLongTasks ?? [];
  472 |   });
  473 |   const sorted = timings.toSorted((a, b) => a - b);
  474 |   expect(sorted).toHaveLength(24);
  475 |   expect(completedSequences.size).toBe(24);
> 476 |   expect(sorted[Math.ceil(sorted.length * 0.95) - 1]).toBeLessThan(12);
      |                                                       ^ Error: expect(received).toBeLessThan(expected)
  477 |   expect(
  478 |     longTasks.every((duration) => duration <= 50),
  479 |     `Observed long tasks: ${JSON.stringify(longTasks)}`,
  480 |   ).toBe(true);
  481 |
  482 |   await page.getByRole("button", { name: "2.5D", exact: true }).click();
  483 |   await page.getByRole("button", { name: "3D", exact: true }).click();
  484 |   await expect(page.getByTestId("unified-workspace")).toHaveAttribute("data-audio-contexts", "1");
  485 |   await expect(page.getByTestId("unified-workspace")).toHaveAttribute("data-audio-graphs", "4");
  486 |   for (let refresh = 0; refresh < 2; refresh += 1) {
  487 |     await page.reload();
  488 |     await expect(outliner.locator(".kind-wall")).toHaveCount(100);
  489 |     await expect(outliner.locator(".kind-portal")).toHaveCount(8);
  490 |     await expect(outliner.locator(".kind-source")).toHaveCount(4);
  491 |     await expect(outliner.locator(".kind-listener")).toHaveCount(8);
  492 |   }
  493 | });
  494 |
```
