# EC-102 summary tables

Values are display-rounded to 3 decimals. Raw numbers are in groups.json.

## TS-S APP_H100_SWITCH pass=clean boundary=browser-app workers=not-applicable audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 2
Denominators: submitted=2000 coalesced=not-applicable dispatched=0 completed=2000 accepted=2000 stale=not-applicable fallback=2000 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| app.input-to-commit | ms | warm | 1800 | 25.400 | 55.200 | 139.100 | 295.100 | 32.664 | 0 of 2 |
| app.input-to-commit | ms | cold | 200 | 25.700 | 53.900 | 158.100 | 261.200 | 33.592 | 0 of 2 |
| app.long-animation-frame | ms | warm | 38 | 73.800 | 177.700 | 200.700 | 200.700 | 87.124 | 2 of 2 |
| app.long-animation-frame | ms | cold | 33 | 72.600 | 194.700 | 227.400 | 227.400 | 92.364 | 2 of 2 |
| app.long-animation-frame.blocking | ms | warm | 38 | 20.900 | 127.800 | 149.300 | 149.300 | 33.287 | 2 of 2 |
| app.long-animation-frame.blocking | ms | cold | 33 | 13.300 | 138.400 | 176.700 | 176.700 | 35.291 | 2 of 2 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 3 | 16.900 | 67.300 | 67.300 | 67.300 | 31.567 | 2 of 2 |
| app.long-animation-frame.out-of-window | ms | cold | 3 | 68.100 | 126.600 | 126.600 | 126.600 | 85.133 | 2 of 2 |
| app.long-task | ms | warm | 15 | 73.000 | 185.000 | 185.000 | 185.000 | 84.200 | 2 of 2 |
| app.long-task | ms | cold | 11 | 55.000 | 108.000 | 108.000 | 108.000 | 70.727 | 2 of 2 |
| app.long-task.out-of-window | ms | cold | 2 | 66.000 | 114.000 | 114.000 | 114.000 | 90.000 | 2 of 2 |
| app.worker-compute-metric | ms | warm | 1800 | 3.000 | 7.000 | 13.000 | 75.000 | 3.721 | 0 of 2 |
| app.worker-compute-metric | ms | cold | 200 | 3.000 | 8.000 | 11.000 | 37.000 | 3.830 | 0 of 2 |
| audio.callback-interval-mean | s | warm | 477 | 0.010 | 0.011 | 0.011 | 0.012 | 0.010 | 2 of 2 |
| audio.callback-interval-mean | s | cold | 601 | 0.010 | 0.010 | 0.011 | 0.012 | 0.010 | 2 of 2 |
| audio.render-capacity | ratio | warm | 477 | 0.120 | 0.796 | 0.992 | 0.996 | 0.196 | 2 of 2 |
| audio.render-capacity | ratio | cold | 601 | 0.113 | 0.485 | 0.988 | 0.997 | 0.172 | 2 of 2 |
| display.status-commit-to-frame-end | ms | warm | 1800 | 10.100 | 18.900 | 31.600 | 162.100 | 10.942 | 0 of 2 |
| display.status-commit-to-frame-end | ms | cold | 200 | 9.500 | 18.900 | 33.300 | 44.800 | 10.451 | 0 of 2 |

## TS-S APP_H100_SWITCH pass=traced boundary=browser-app workers=not-applicable audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 2
Denominators: submitted=200 coalesced=not-applicable dispatched=0 completed=200 accepted=200 stale=not-applicable fallback=200 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| app.input-to-commit | ms | cold | 200 | 22.400 | 82.400 | 233.400 | 296.800 | 34.152 | 2 of 2 |
| app.long-animation-frame | ms | cold | 14 | 74.900 | 206.800 | 206.800 | 206.800 | 106.479 | 2 of 2 |
| app.long-animation-frame.blocking | ms | cold | 14 | 8.500 | 149.900 | 149.900 | 149.900 | 44.086 | 2 of 2 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 3 | 3.400 | 25.000 | 25.000 | 25.000 | 9.467 | 2 of 2 |
| app.long-animation-frame.out-of-window | ms | cold | 3 | 76.500 | 360.100 | 360.100 | 360.100 | 163.467 | 2 of 2 |
| app.long-task | ms | cold | 5 | 63.000 | 198.000 | 198.000 | 198.000 | 86.200 | 2 of 2 |
| app.long-task.out-of-window | ms | cold | 2 | 53.000 | 74.000 | 74.000 | 74.000 | 63.500 | 2 of 2 |
| app.worker-compute-metric | ms | cold | 200 | 2.000 | 7.000 | 14.000 | 41.000 | 3.165 | 2 of 2 |
| audio.callback-interval-mean | s | cold | 121 | 0.010 | 0.011 | 0.012 | 0.012 | 0.010 | 2 of 2 |
| audio.render-capacity | ratio | cold | 121 | 0.142 | 0.960 | 0.995 | 0.996 | 0.221 | 2 of 2 |
| display.status-commit-to-frame-end | ms | cold | 200 | 12.500 | 23.400 | 35.900 | 52.000 | 12.810 | 2 of 2 |

## TS-S TC01_LISTENER_TAPE_SEEDED pass=clean boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1152 coalesced=not-applicable dispatched=not-applicable completed=1152 accepted=1152 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 1052 | 0.000 | 0.000 | 0.100 | 0.100 | 0.005 | 0 of 1 |
| assemble | ms | cold | 100 | 0.000 | 0.000 | 0.100 | 0.300 | 0.007 | 0 of 1 |
| assemble [pose-only] | ms | warm | 1052 | 0.000 | 0.000 | 0.100 | 0.100 | 0.005 |  |
| assemble [pose-only] | ms | cold | 99 | 0.000 | 0.000 | 0.100 | 0.100 | 0.004 |  |
| assemble [static-install] | ms | cold | 1 | 0.300 | 0.300 | 0.300 | 0.300 | 0.300 |  |
| job.total | ms | warm | 1052 | 0.300 | 0.600 | 2.100 | 4.600 | 0.313 | 0 of 1 |
| job.total | ms | cold | 100 | 0.300 | 1.000 | 1.600 | 4.100 | 0.439 | 0 of 1 |
| job.total [pose-only] | ms | warm | 1052 | 0.300 | 0.600 | 2.100 | 4.600 | 0.313 |  |
| job.total [pose-only] | ms | cold | 99 | 0.300 | 1.000 | 1.600 | 1.600 | 0.402 |  |
| job.total [static-install] | ms | cold | 1 | 4.100 | 4.100 | 4.100 | 4.100 | 4.100 |  |
| pose.snapshot | ms | warm | 1052 | 0.000 | 0.000 | 0.000 | 0.100 | 0.000 | 0 of 1 |
| pose.snapshot | ms | cold | 100 | 0.000 | 0.000 | 0.000 | 0.100 | 0.001 | 0 of 1 |
| pose.snapshot [pose-only] | ms | warm | 1052 | 0.000 | 0.000 | 0.000 | 0.100 | 0.000 |  |
| pose.snapshot [pose-only] | ms | cold | 99 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 |  |
| pose.snapshot [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| room.estimate | ms | warm | 1052 | 0.000 | 0.100 | 0.300 | 0.700 | 0.050 | 0 of 1 |
| room.estimate | ms | cold | 100 | 0.100 | 0.200 | 0.300 | 0.600 | 0.080 | 0 of 1 |
| room.estimate [pose-only] | ms | warm | 1052 | 0.000 | 0.100 | 0.300 | 0.700 | 0.050 |  |
| room.estimate [pose-only] | ms | cold | 99 | 0.100 | 0.200 | 0.300 | 0.300 | 0.075 |  |
| room.estimate [static-install] | ms | cold | 1 | 0.600 | 0.600 | 0.600 | 0.600 | 0.600 |  |
| solve | ms | warm | 1052 | 0.200 | 0.400 | 1.300 | 4.000 | 0.213 | 0 of 1 |
| solve | ms | cold | 100 | 0.200 | 0.700 | 1.200 | 2.900 | 0.293 | 0 of 1 |
| solve [pose-only] | ms | warm | 1052 | 0.200 | 0.400 | 1.300 | 4.000 | 0.213 |  |
| solve [pose-only] | ms | cold | 99 | 0.200 | 0.700 | 1.200 | 1.200 | 0.267 |  |
| solve [static-install] | ms | cold | 1 | 2.900 | 2.900 | 2.900 | 2.900 | 2.900 |  |
| static.build | ms | warm | 1052 | 0.000 | 0.100 | 0.300 | 0.500 | 0.044 | 0 of 1 |
| static.build | ms | cold | 100 | 0.000 | 0.100 | 0.300 | 0.700 | 0.058 | 0 of 1 |
| static.build [pose-only] | ms | warm | 1052 | 0.000 | 0.100 | 0.300 | 0.500 | 0.044 |  |
| static.build [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.700 | 0.700 | 0.056 |  |
| static.build [static-install] | ms | cold | 1 | 0.300 | 0.300 | 0.300 | 0.300 | 0.300 |  |

## TS-S TC01_LISTENER_TAPE_SEEDED pass=clean boundary=node-core workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=not-applicable viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1152 coalesced=not-applicable dispatched=not-applicable completed=1152 accepted=1152 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 1052 | 0.007 | 0.012 | 0.038 | 0.146 | 0.008 | 0 of 1 |
| assemble | ms | cold | 100 | 0.005 | 0.017 | 0.095 | 0.108 | 0.008 | 0 of 1 |
| assemble [pose-only] | ms | warm | 1052 | 0.007 | 0.012 | 0.038 | 0.146 | 0.008 |  |
| assemble [pose-only] | ms | cold | 99 | 0.005 | 0.017 | 0.095 | 0.095 | 0.007 |  |
| assemble [static-install] | ms | cold | 1 | 0.108 | 0.108 | 0.108 | 0.108 | 0.108 |  |
| job.total | ms | warm | 1052 | 0.337 | 0.657 | 1.131 | 8.196 | 0.398 | 0 of 1 |
| job.total | ms | cold | 100 | 0.403 | 0.928 | 1.970 | 3.398 | 0.480 | 0 of 1 |
| job.total [pose-only] | ms | warm | 1052 | 0.337 | 0.657 | 1.131 | 8.196 | 0.398 |  |
| job.total [pose-only] | ms | cold | 99 | 0.403 | 0.928 | 1.970 | 1.970 | 0.451 |  |
| job.total [static-install] | ms | cold | 1 | 3.398 | 3.398 | 3.398 | 3.398 | 3.398 |  |
| pose.snapshot | ms | warm | 1052 | 0.001 | 0.001 | 0.006 | 0.109 | 0.001 | 0 of 1 |
| pose.snapshot | ms | cold | 100 | 0.001 | 0.005 | 0.006 | 0.014 | 0.001 | 0 of 1 |
| pose.snapshot [pose-only] | ms | warm | 1052 | 0.001 | 0.001 | 0.006 | 0.109 | 0.001 |  |
| pose.snapshot [pose-only] | ms | cold | 99 | 0.001 | 0.005 | 0.006 | 0.006 | 0.001 |  |
| pose.snapshot [static-install] | ms | cold | 1 | 0.014 | 0.014 | 0.014 | 0.014 | 0.014 |  |
| room.estimate | ms | warm | 1052 | 0.076 | 0.133 | 0.272 | 1.177 | 0.088 | 0 of 1 |
| room.estimate | ms | cold | 100 | 0.068 | 0.106 | 0.179 | 0.372 | 0.076 | 0 of 1 |
| room.estimate [pose-only] | ms | warm | 1052 | 0.076 | 0.133 | 0.272 | 1.177 | 0.088 |  |
| room.estimate [pose-only] | ms | cold | 99 | 0.068 | 0.106 | 0.179 | 0.179 | 0.073 |  |
| room.estimate [static-install] | ms | cold | 1 | 0.372 | 0.372 | 0.372 | 0.372 | 0.372 |  |
| solve | ms | warm | 1052 | 0.196 | 0.474 | 0.865 | 5.525 | 0.248 | 0 of 1 |
| solve | ms | cold | 100 | 0.273 | 0.748 | 1.897 | 2.789 | 0.350 | 0 of 1 |
| solve [pose-only] | ms | warm | 1052 | 0.196 | 0.474 | 0.865 | 5.525 | 0.248 |  |
| solve [pose-only] | ms | cold | 99 | 0.273 | 0.748 | 1.897 | 1.897 | 0.325 |  |
| solve [static-install] | ms | cold | 1 | 2.789 | 2.789 | 2.789 | 2.789 | 2.789 |  |
| static.build | ms | warm | 1052 | 0.041 | 0.069 | 0.137 | 1.617 | 0.052 | 0 of 1 |
| static.build | ms | cold | 100 | 0.039 | 0.092 | 0.110 | 0.114 | 0.046 | 0 of 1 |
| static.build [pose-only] | ms | warm | 1052 | 0.041 | 0.069 | 0.137 | 1.617 | 0.052 |  |
| static.build [pose-only] | ms | cold | 99 | 0.039 | 0.092 | 0.110 | 0.110 | 0.045 |  |
| static.build [static-install] | ms | cold | 1 | 0.114 | 0.114 | 0.114 | 0.114 | 0.114 |  |

## TS-S TC01_LISTENER_TAPE_SEEDED pass=traced boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=192 coalesced=not-applicable dispatched=not-applicable completed=192 accepted=192 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 92 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 | 1 of 1 |
| assemble | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.400 | 0.009 | 1 of 1 |
| assemble [pose-only] | ms | warm | 92 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 |  |
| assemble [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.100 | 0.100 | 0.005 |  |
| assemble [static-install] | ms | cold | 1 | 0.400 | 0.400 | 0.400 | 0.400 | 0.400 |  |
| job.total | ms | warm | 92 | 0.100 | 0.300 | 0.800 | 0.800 | 0.155 | 1 of 1 |
| job.total | ms | cold | 100 | 0.200 | 0.700 | 1.100 | 7.200 | 0.299 | 1 of 1 |
| job.total [pose-only] | ms | warm | 92 | 0.100 | 0.300 | 0.800 | 0.800 | 0.155 |  |
| job.total [pose-only] | ms | cold | 99 | 0.200 | 0.700 | 1.100 | 1.100 | 0.229 |  |
| job.total [static-install] | ms | cold | 1 | 7.200 | 7.200 | 7.200 | 7.200 | 7.200 |  |
| pose.snapshot | ms | warm | 92 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 1 of 1 |
| pose.snapshot | ms | cold | 100 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 | 1 of 1 |
| pose.snapshot [pose-only] | ms | warm | 92 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| pose.snapshot [pose-only] | ms | cold | 99 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| pose.snapshot [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| room.estimate | ms | warm | 92 | 0.000 | 0.100 | 0.200 | 0.200 | 0.030 | 1 of 1 |
| room.estimate | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 1.000 | 0.053 | 1 of 1 |
| room.estimate [pose-only] | ms | warm | 92 | 0.000 | 0.100 | 0.200 | 0.200 | 0.030 |  |
| room.estimate [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.200 | 0.200 | 0.043 |  |
| room.estimate [static-install] | ms | cold | 1 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |  |
| solve | ms | warm | 92 | 0.100 | 0.200 | 0.600 | 0.600 | 0.096 | 1 of 1 |
| solve | ms | cold | 100 | 0.100 | 0.500 | 0.900 | 5.500 | 0.212 | 1 of 1 |
| solve [pose-only] | ms | warm | 92 | 0.100 | 0.200 | 0.600 | 0.600 | 0.096 |  |
| solve [pose-only] | ms | cold | 99 | 0.100 | 0.500 | 0.900 | 0.900 | 0.159 |  |
| solve [static-install] | ms | cold | 1 | 5.500 | 5.500 | 5.500 | 5.500 | 5.500 |  |
| static.build | ms | warm | 92 | 0.000 | 0.100 | 0.200 | 0.200 | 0.023 | 1 of 1 |
| static.build | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.300 | 0.023 | 1 of 1 |
| static.build [pose-only] | ms | warm | 92 | 0.000 | 0.100 | 0.200 | 0.200 | 0.023 |  |
| static.build [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.100 | 0.100 | 0.020 |  |
| static.build [static-install] | ms | cold | 1 | 0.300 | 0.300 | 0.300 | 0.300 | 0.300 |  |

## TS-S TC02_STATIC_EDIT_TAPE pass=clean boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1104 coalesced=not-applicable dispatched=not-applicable completed=1104 accepted=1104 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 1004 | 0.000 | 0.000 | 0.100 | 0.100 | 0.003 | 0 of 1 |
| assemble | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.200 | 0.011 | 0 of 1 |
| assemble [pose-only] | ms | warm | 461 | 0.000 | 0.000 | 0.100 | 0.100 | 0.004 |  |
| assemble [pose-only] | ms | cold | 45 | 0.000 | 0.100 | 0.100 | 0.100 | 0.013 |  |
| assemble [static-install] | ms | warm | 543 | 0.000 | 0.000 | 0.100 | 0.100 | 0.003 |  |
| assemble [static-install] | ms | cold | 55 | 0.000 | 0.100 | 0.200 | 0.200 | 0.009 |  |
| job.total | ms | warm | 1004 | 0.300 | 0.500 | 0.700 | 7.300 | 0.300 | 0 of 1 |
| job.total | ms | cold | 100 | 0.400 | 0.700 | 2.000 | 12.000 | 0.503 | 0 of 1 |
| job.total [pose-only] | ms | warm | 461 | 0.200 | 0.500 | 0.600 | 2.100 | 0.275 |  |
| job.total [pose-only] | ms | cold | 45 | 0.300 | 0.600 | 0.700 | 0.700 | 0.347 |  |
| job.total [static-install] | ms | warm | 543 | 0.300 | 0.500 | 0.700 | 7.300 | 0.321 |  |
| job.total [static-install] | ms | cold | 55 | 0.400 | 0.800 | 12.000 | 12.000 | 0.631 |  |
| pose.snapshot | ms | warm | 1004 | 0.000 | 0.000 | 0.000 | 0.100 | 0.001 | 0 of 1 |
| pose.snapshot | ms | cold | 100 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 | 0 of 1 |
| pose.snapshot [pose-only] | ms | warm | 461 | 0.000 | 0.000 | 0.000 | 0.100 | 0.000 |  |
| pose.snapshot [pose-only] | ms | cold | 45 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| pose.snapshot [static-install] | ms | warm | 543 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 |  |
| pose.snapshot [static-install] | ms | cold | 55 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| room.estimate | ms | warm | 1004 | 0.000 | 0.100 | 0.200 | 0.400 | 0.041 | 0 of 1 |
| room.estimate | ms | cold | 100 | 0.000 | 0.200 | 0.200 | 0.500 | 0.061 | 0 of 1 |
| room.estimate [pose-only] | ms | warm | 461 | 0.000 | 0.100 | 0.200 | 0.200 | 0.045 |  |
| room.estimate [pose-only] | ms | cold | 45 | 0.000 | 0.200 | 0.200 | 0.200 | 0.058 |  |
| room.estimate [static-install] | ms | warm | 543 | 0.000 | 0.100 | 0.100 | 0.400 | 0.037 |  |
| room.estimate [static-install] | ms | cold | 55 | 0.000 | 0.200 | 0.500 | 0.500 | 0.064 |  |
| solve | ms | warm | 1004 | 0.200 | 0.400 | 0.500 | 6.400 | 0.216 | 0 of 1 |
| solve | ms | cold | 100 | 0.300 | 0.600 | 1.800 | 11.100 | 0.377 | 0 of 1 |
| solve [pose-only] | ms | warm | 461 | 0.200 | 0.400 | 0.500 | 1.700 | 0.187 |  |
| solve [pose-only] | ms | cold | 45 | 0.200 | 0.500 | 0.600 | 0.600 | 0.227 |  |
| solve [static-install] | ms | warm | 543 | 0.200 | 0.500 | 0.600 | 6.400 | 0.242 |  |
| solve [static-install] | ms | cold | 55 | 0.300 | 0.600 | 11.100 | 11.100 | 0.500 |  |
| static.build | ms | warm | 1004 | 0.000 | 0.100 | 0.200 | 0.400 | 0.039 | 0 of 1 |
| static.build | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 0.200 | 0.052 | 0 of 1 |
| static.build [pose-only] | ms | warm | 461 | 0.000 | 0.100 | 0.100 | 0.200 | 0.038 |  |
| static.build [pose-only] | ms | cold | 45 | 0.000 | 0.100 | 0.200 | 0.200 | 0.047 |  |
| static.build [static-install] | ms | warm | 543 | 0.000 | 0.100 | 0.200 | 0.400 | 0.039 |  |
| static.build [static-install] | ms | cold | 55 | 0.100 | 0.200 | 0.200 | 0.200 | 0.056 |  |

## TS-S TC02_STATIC_EDIT_TAPE pass=clean boundary=node-core workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=not-applicable viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1104 coalesced=not-applicable dispatched=not-applicable completed=1104 accepted=1104 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 1004 | 0.008 | 0.010 | 0.022 | 0.135 | 0.008 | 0 of 1 |
| assemble | ms | cold | 100 | 0.006 | 0.018 | 0.145 | 0.189 | 0.011 | 0 of 1 |
| assemble [pose-only] | ms | warm | 461 | 0.008 | 0.010 | 0.018 | 0.057 | 0.007 |  |
| assemble [pose-only] | ms | cold | 45 | 0.006 | 0.015 | 0.189 | 0.189 | 0.011 |  |
| assemble [static-install] | ms | warm | 543 | 0.008 | 0.010 | 0.028 | 0.135 | 0.008 |  |
| assemble [static-install] | ms | cold | 55 | 0.006 | 0.020 | 0.145 | 0.145 | 0.010 |  |
| job.total | ms | warm | 1004 | 0.410 | 0.799 | 1.060 | 4.507 | 0.482 | 0 of 1 |
| job.total | ms | cold | 100 | 0.461 | 1.106 | 3.108 | 11.839 | 0.679 | 0 of 1 |
| job.total [pose-only] | ms | warm | 461 | 0.383 | 0.766 | 1.271 | 1.786 | 0.448 |  |
| job.total [pose-only] | ms | cold | 45 | 0.436 | 1.057 | 1.802 | 1.802 | 0.505 |  |
| job.total [static-install] | ms | warm | 543 | 0.436 | 0.834 | 1.034 | 4.507 | 0.511 |  |
| job.total [static-install] | ms | cold | 55 | 0.487 | 2.775 | 11.839 | 11.839 | 0.821 |  |
| pose.snapshot | ms | warm | 1004 | 0.001 | 0.001 | 0.002 | 0.010 | 0.001 | 0 of 1 |
| pose.snapshot | ms | cold | 100 | 0.001 | 0.005 | 0.006 | 0.014 | 0.001 | 0 of 1 |
| pose.snapshot [pose-only] | ms | warm | 461 | 0.001 | 0.001 | 0.003 | 0.010 | 0.001 |  |
| pose.snapshot [pose-only] | ms | cold | 45 | 0.001 | 0.004 | 0.005 | 0.005 | 0.001 |  |
| pose.snapshot [static-install] | ms | warm | 543 | 0.001 | 0.001 | 0.002 | 0.006 | 0.001 |  |
| pose.snapshot [static-install] | ms | cold | 55 | 0.001 | 0.005 | 0.014 | 0.014 | 0.001 |  |
| room.estimate | ms | warm | 1004 | 0.091 | 0.127 | 0.202 | 1.156 | 0.091 | 0 of 1 |
| room.estimate | ms | cold | 100 | 0.069 | 0.183 | 0.300 | 0.372 | 0.088 | 0 of 1 |
| room.estimate [pose-only] | ms | warm | 461 | 0.091 | 0.129 | 0.202 | 0.383 | 0.089 |  |
| room.estimate [pose-only] | ms | cold | 45 | 0.074 | 0.178 | 0.183 | 0.183 | 0.082 |  |
| room.estimate [static-install] | ms | warm | 543 | 0.091 | 0.124 | 0.241 | 1.156 | 0.093 |  |
| room.estimate [static-install] | ms | cold | 55 | 0.069 | 0.247 | 0.372 | 0.372 | 0.092 |  |
| solve | ms | warm | 1004 | 0.264 | 0.627 | 0.853 | 3.147 | 0.329 | 0 of 1 |
| solve | ms | cold | 100 | 0.327 | 0.904 | 2.693 | 11.195 | 0.527 | 0 of 1 |
| solve [pose-only] | ms | warm | 461 | 0.233 | 0.590 | 0.930 | 1.308 | 0.297 |  |
| solve [pose-only] | ms | cold | 45 | 0.271 | 0.778 | 1.500 | 1.500 | 0.360 |  |
| solve [static-install] | ms | warm | 543 | 0.302 | 0.647 | 0.853 | 3.147 | 0.357 |  |
| solve [static-install] | ms | cold | 55 | 0.372 | 2.338 | 11.195 | 11.195 | 0.665 |  |
| static.build | ms | warm | 1004 | 0.054 | 0.073 | 0.121 | 0.327 | 0.053 | 0 of 1 |
| static.build | ms | cold | 100 | 0.043 | 0.097 | 0.116 | 0.146 | 0.052 | 0 of 1 |
| static.build [pose-only] | ms | warm | 461 | 0.054 | 0.077 | 0.149 | 0.239 | 0.053 |  |
| static.build [pose-only] | ms | cold | 45 | 0.047 | 0.088 | 0.104 | 0.104 | 0.051 |  |
| static.build [static-install] | ms | warm | 543 | 0.054 | 0.069 | 0.106 | 0.327 | 0.053 |  |
| static.build [static-install] | ms | cold | 55 | 0.043 | 0.114 | 0.146 | 0.146 | 0.053 |  |

## TS-S TH01_LISTENER_TAPE_SEEDED pass=alloc boundary=node-core workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=not-applicable viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=192 coalesced=not-applicable dispatched=not-applicable completed=192 accepted=192 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 92 | 0.015 | 0.118 | 0.222 | 0.222 | 0.026 | 1 of 1 |
| assemble | ms | cold | 100 | 0.011 | 0.024 | 0.065 | 0.235 | 0.014 | 1 of 1 |
| assemble [pose-only] | ms | warm | 92 | 0.015 | 0.118 | 0.222 | 0.222 | 0.026 |  |
| assemble [pose-only] | ms | cold | 99 | 0.011 | 0.024 | 0.065 | 0.065 | 0.012 |  |
| assemble [static-install] | ms | cold | 1 | 0.235 | 0.235 | 0.235 | 0.235 | 0.235 |  |
| job.total | ms | warm | 92 | 0.541 | 5.180 | 29.081 | 29.081 | 1.330 | 1 of 1 |
| job.total | ms | cold | 100 | 0.565 | 1.323 | 2.470 | 13.169 | 0.761 | 1 of 1 |
| job.total [pose-only] | ms | warm | 92 | 0.541 | 5.180 | 29.081 | 29.081 | 1.330 |  |
| job.total [pose-only] | ms | cold | 99 | 0.565 | 1.323 | 2.470 | 2.470 | 0.636 |  |
| job.total [static-install] | ms | cold | 1 | 13.169 | 13.169 | 13.169 | 13.169 | 13.169 |  |
| pose.snapshot | ms | warm | 92 | 0.003 | 0.013 | 0.052 | 0.052 | 0.004 | 1 of 1 |
| pose.snapshot | ms | cold | 100 | 0.002 | 0.006 | 0.011 | 0.032 | 0.003 | 1 of 1 |
| pose.snapshot [pose-only] | ms | warm | 92 | 0.003 | 0.013 | 0.052 | 0.052 | 0.004 |  |
| pose.snapshot [pose-only] | ms | cold | 99 | 0.002 | 0.006 | 0.011 | 0.011 | 0.002 |  |
| pose.snapshot [static-install] | ms | cold | 1 | 0.032 | 0.032 | 0.032 | 0.032 | 0.032 |  |
| solve | ms | warm | 92 | 0.454 | 4.354 | 28.439 | 28.439 | 1.196 | 1 of 1 |
| solve | ms | cold | 100 | 0.490 | 1.206 | 1.993 | 2.586 | 0.580 | 1 of 1 |
| solve [pose-only] | ms | warm | 92 | 0.454 | 4.354 | 28.439 | 28.439 | 1.196 |  |
| solve [pose-only] | ms | cold | 99 | 0.490 | 1.206 | 1.993 | 1.993 | 0.560 |  |
| solve [static-install] | ms | cold | 1 | 2.586 | 2.586 | 2.586 | 2.586 | 2.586 |  |
| static.compile | ms | warm | 92 | 0.065 | 0.383 | 0.877 | 0.877 | 0.104 | 1 of 1 |
| static.compile | ms | cold | 100 | 0.050 | 0.098 | 0.440 | 10.316 | 0.165 | 1 of 1 |
| static.compile [pose-only] | ms | warm | 92 | 0.065 | 0.383 | 0.877 | 0.877 | 0.104 |  |
| static.compile [pose-only] | ms | cold | 99 | 0.050 | 0.098 | 0.440 | 0.440 | 0.062 |  |
| static.compile [static-install] | ms | cold | 1 | 10.316 | 10.316 | 10.316 | 10.316 | 10.316 |  |

## TS-S TH01_LISTENER_TAPE_SEEDED pass=clean boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1152 coalesced=not-applicable dispatched=not-applicable completed=1152 accepted=1152 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 1052 | 0.000 | 0.100 | 0.100 | 0.300 | 0.008 | 0 of 1 |
| assemble | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 | 0 of 1 |
| assemble [pose-only] | ms | warm | 1052 | 0.000 | 0.100 | 0.100 | 0.300 | 0.008 |  |
| assemble [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.200 | 0.200 | 0.017 |  |
| assemble [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| job.total | ms | warm | 1052 | 0.400 | 0.900 | 1.000 | 4.200 | 0.497 | 0 of 1 |
| job.total | ms | cold | 100 | 0.600 | 2.800 | 8.800 | 9.400 | 0.939 | 0 of 1 |
| job.total [pose-only] | ms | warm | 1052 | 0.400 | 0.900 | 1.000 | 4.200 | 0.497 |  |
| job.total [pose-only] | ms | cold | 99 | 0.600 | 2.800 | 9.400 | 9.400 | 0.860 |  |
| job.total [static-install] | ms | cold | 1 | 8.800 | 8.800 | 8.800 | 8.800 | 8.800 |  |
| pose.snapshot | ms | warm | 1052 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 | 0 of 1 |
| pose.snapshot | ms | cold | 100 | 0.000 | 0.000 | 0.100 | 0.100 | 0.003 | 0 of 1 |
| pose.snapshot [pose-only] | ms | warm | 1052 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| pose.snapshot [pose-only] | ms | cold | 99 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| pose.snapshot [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| solve | ms | warm | 1052 | 0.400 | 0.800 | 1.000 | 3.500 | 0.444 | 0 of 1 |
| solve | ms | cold | 100 | 0.500 | 2.200 | 4.300 | 9.000 | 0.797 | 0 of 1 |
| solve [pose-only] | ms | warm | 1052 | 0.400 | 0.800 | 1.000 | 3.500 | 0.444 |  |
| solve [pose-only] | ms | cold | 99 | 0.500 | 2.200 | 9.000 | 9.000 | 0.781 |  |
| solve [static-install] | ms | cold | 1 | 2.400 | 2.400 | 2.400 | 2.400 | 2.400 |  |
| static.compile | ms | warm | 1052 | 0.000 | 0.100 | 0.200 | 0.400 | 0.042 | 0 of 1 |
| static.compile | ms | cold | 100 | 0.000 | 0.200 | 0.500 | 6.200 | 0.121 | 0 of 1 |
| static.compile [pose-only] | ms | warm | 1052 | 0.000 | 0.100 | 0.200 | 0.400 | 0.042 |  |
| static.compile [pose-only] | ms | cold | 99 | 0.000 | 0.200 | 0.500 | 0.500 | 0.060 |  |
| static.compile [static-install] | ms | cold | 1 | 6.200 | 6.200 | 6.200 | 6.200 | 6.200 |  |

## TS-S TH01_LISTENER_TAPE_SEEDED pass=clean boundary=node-core workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=not-applicable viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1152 coalesced=not-applicable dispatched=not-applicable completed=1152 accepted=1152 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 1052 | 0.016 | 0.022 | 0.034 | 0.121 | 0.017 | 0 of 1 |
| assemble | ms | cold | 100 | 0.014 | 0.024 | 0.120 | 0.137 | 0.015 | 0 of 1 |
| assemble [pose-only] | ms | warm | 1052 | 0.016 | 0.022 | 0.034 | 0.121 | 0.017 |  |
| assemble [pose-only] | ms | cold | 99 | 0.014 | 0.024 | 0.120 | 0.120 | 0.013 |  |
| assemble [static-install] | ms | cold | 1 | 0.137 | 0.137 | 0.137 | 0.137 | 0.137 |  |
| job.total | ms | warm | 1052 | 0.509 | 1.039 | 1.117 | 1.255 | 0.646 | 0 of 1 |
| job.total | ms | cold | 100 | 0.550 | 1.363 | 1.422 | 11.765 | 0.795 | 0 of 1 |
| job.total [pose-only] | ms | warm | 1052 | 0.509 | 1.039 | 1.117 | 1.255 | 0.646 |  |
| job.total [pose-only] | ms | cold | 99 | 0.550 | 1.363 | 1.422 | 1.422 | 0.684 |  |
| job.total [static-install] | ms | cold | 1 | 11.765 | 11.765 | 11.765 | 11.765 | 11.765 |  |
| pose.snapshot | ms | warm | 1052 | 0.003 | 0.003 | 0.004 | 0.039 | 0.003 | 0 of 1 |
| pose.snapshot | ms | cold | 100 | 0.003 | 0.006 | 0.010 | 0.030 | 0.003 | 0 of 1 |
| pose.snapshot [pose-only] | ms | warm | 1052 | 0.003 | 0.003 | 0.004 | 0.039 | 0.003 |  |
| pose.snapshot [pose-only] | ms | cold | 99 | 0.003 | 0.006 | 0.010 | 0.010 | 0.003 |  |
| pose.snapshot [static-install] | ms | cold | 1 | 0.030 | 0.030 | 0.030 | 0.030 | 0.030 |  |
| solve | ms | warm | 1052 | 0.423 | 0.949 | 1.023 | 1.126 | 0.564 | 0 of 1 |
| solve | ms | cold | 100 | 0.463 | 1.203 | 1.319 | 2.596 | 0.624 | 0 of 1 |
| solve [pose-only] | ms | warm | 1052 | 0.423 | 0.949 | 1.023 | 1.126 | 0.564 |  |
| solve [pose-only] | ms | cold | 99 | 0.463 | 1.203 | 1.319 | 1.319 | 0.604 |  |
| solve [static-install] | ms | cold | 1 | 2.596 | 2.596 | 2.596 | 2.596 | 2.596 |  |
| static.compile | ms | warm | 1052 | 0.062 | 0.078 | 0.116 | 0.168 | 0.063 | 0 of 1 |
| static.compile | ms | cold | 100 | 0.060 | 0.122 | 0.257 | 9.001 | 0.154 | 0 of 1 |
| static.compile [pose-only] | ms | warm | 1052 | 0.062 | 0.078 | 0.116 | 0.168 | 0.063 |  |
| static.compile [pose-only] | ms | cold | 99 | 0.060 | 0.122 | 0.257 | 0.257 | 0.065 |  |
| static.compile [static-install] | ms | cold | 1 | 9.001 | 9.001 | 9.001 | 9.001 | 9.001 |  |

## TS-S TH01_LISTENER_TAPE_SEEDED pass=traced boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=192 coalesced=not-applicable dispatched=not-applicable completed=192 accepted=192 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 92 | 0.000 | 0.100 | 0.100 | 0.100 | 0.008 | 1 of 1 |
| assemble | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.100 | 0.011 | 1 of 1 |
| assemble [pose-only] | ms | warm | 92 | 0.000 | 0.100 | 0.100 | 0.100 | 0.008 |  |
| assemble [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.100 | 0.100 | 0.010 |  |
| assemble [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| job.total | ms | warm | 92 | 0.200 | 0.600 | 0.600 | 0.600 | 0.234 | 1 of 1 |
| job.total | ms | cold | 100 | 0.300 | 1.200 | 1.900 | 10.200 | 0.473 | 1 of 1 |
| job.total [pose-only] | ms | warm | 92 | 0.200 | 0.600 | 0.600 | 0.600 | 0.234 |  |
| job.total [pose-only] | ms | cold | 99 | 0.300 | 1.200 | 1.900 | 1.900 | 0.375 |  |
| job.total [static-install] | ms | cold | 1 | 10.200 | 10.200 | 10.200 | 10.200 | 10.200 |  |
| pose.snapshot | ms | warm | 92 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 | 1 of 1 |
| pose.snapshot | ms | cold | 100 | 0.000 | 0.000 | 0.100 | 0.300 | 0.004 | 1 of 1 |
| pose.snapshot [pose-only] | ms | warm | 92 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| pose.snapshot [pose-only] | ms | cold | 99 | 0.000 | 0.000 | 0.300 | 0.300 | 0.004 |  |
| pose.snapshot [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| solve | ms | warm | 92 | 0.200 | 0.500 | 0.600 | 0.600 | 0.200 | 1 of 1 |
| solve | ms | cold | 100 | 0.200 | 1.000 | 1.700 | 3.200 | 0.355 | 1 of 1 |
| solve [pose-only] | ms | warm | 92 | 0.200 | 0.500 | 0.600 | 0.600 | 0.200 |  |
| solve [pose-only] | ms | cold | 99 | 0.200 | 1.000 | 1.700 | 1.700 | 0.326 |  |
| solve [static-install] | ms | cold | 1 | 3.200 | 3.200 | 3.200 | 3.200 | 3.200 |  |
| static.compile | ms | warm | 92 | 0.000 | 0.100 | 0.100 | 0.100 | 0.024 | 1 of 1 |
| static.compile | ms | cold | 100 | 0.000 | 0.100 | 0.300 | 6.900 | 0.103 | 1 of 1 |
| static.compile [pose-only] | ms | warm | 92 | 0.000 | 0.100 | 0.100 | 0.100 | 0.024 |  |
| static.compile [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.300 | 0.300 | 0.034 |  |
| static.compile [static-install] | ms | cold | 1 | 6.900 | 6.900 | 6.900 | 6.900 | 6.900 |  |

## TS-S TH01_LISTENER_TAPE_SEEDED pass=traced boundary=node-core workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=not-applicable viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=192 coalesced=not-applicable dispatched=not-applicable completed=192 accepted=192 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 92 | 0.005 | 0.016 | 0.022 | 0.022 | 0.008 | 1 of 1 |
| assemble | ms | cold | 100 | 0.005 | 0.016 | 0.070 | 0.212 | 0.010 | 1 of 1 |
| assemble [pose-only] | ms | warm | 92 | 0.005 | 0.016 | 0.022 | 0.022 | 0.008 |  |
| assemble [pose-only] | ms | cold | 99 | 0.005 | 0.016 | 0.070 | 0.070 | 0.008 |  |
| assemble [static-install] | ms | cold | 1 | 0.212 | 0.212 | 0.212 | 0.212 | 0.212 |  |
| job.total | ms | warm | 92 | 0.246 | 1.042 | 1.268 | 1.268 | 0.361 | 1 of 1 |
| job.total | ms | cold | 100 | 0.374 | 1.237 | 2.008 | 16.116 | 0.621 | 1 of 1 |
| job.total [pose-only] | ms | warm | 92 | 0.246 | 1.042 | 1.268 | 1.268 | 0.361 |  |
| job.total [pose-only] | ms | cold | 99 | 0.374 | 1.237 | 2.008 | 2.008 | 0.465 |  |
| job.total [static-install] | ms | cold | 1 | 16.116 | 16.116 | 16.116 | 16.116 | 16.116 |  |
| pose.snapshot | ms | warm | 92 | 0.001 | 0.003 | 0.004 | 0.004 | 0.002 | 1 of 1 |
| pose.snapshot | ms | cold | 100 | 0.001 | 0.007 | 0.008 | 0.050 | 0.002 | 1 of 1 |
| pose.snapshot [pose-only] | ms | warm | 92 | 0.001 | 0.003 | 0.004 | 0.004 | 0.002 |  |
| pose.snapshot [pose-only] | ms | cold | 99 | 0.001 | 0.007 | 0.008 | 0.008 | 0.002 |  |
| pose.snapshot [static-install] | ms | cold | 1 | 0.050 | 0.050 | 0.050 | 0.050 | 0.050 |  |
| solve | ms | warm | 92 | 0.212 | 0.938 | 1.207 | 1.207 | 0.310 | 1 of 1 |
| solve | ms | cold | 100 | 0.333 | 1.151 | 1.606 | 3.769 | 0.441 | 1 of 1 |
| solve [pose-only] | ms | warm | 92 | 0.212 | 0.938 | 1.207 | 1.207 | 0.310 |  |
| solve [pose-only] | ms | cold | 99 | 0.333 | 1.151 | 1.606 | 1.606 | 0.408 |  |
| solve [static-install] | ms | cold | 1 | 3.769 | 3.769 | 3.769 | 3.769 | 3.769 |  |
| static.compile | ms | warm | 92 | 0.031 | 0.068 | 0.290 | 0.290 | 0.043 | 1 of 1 |
| static.compile | ms | cold | 100 | 0.038 | 0.079 | 0.376 | 12.085 | 0.168 | 1 of 1 |
| static.compile [pose-only] | ms | warm | 92 | 0.031 | 0.068 | 0.290 | 0.290 | 0.043 |  |
| static.compile [pose-only] | ms | cold | 99 | 0.038 | 0.079 | 0.376 | 0.376 | 0.048 |  |
| static.compile [static-install] | ms | cold | 1 | 12.085 | 12.085 | 12.085 | 12.085 | 12.085 |  |

## TS-S TH02_STATIC_EDIT_TAPE pass=clean boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1104 coalesced=not-applicable dispatched=not-applicable completed=1104 accepted=1104 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 1004 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 | 0 of 1 |
| assemble | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.200 | 0.011 | 0 of 1 |
| assemble [pose-only] | ms | warm | 461 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| assemble [pose-only] | ms | cold | 45 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| assemble [static-install] | ms | warm | 543 | 0.000 | 0.100 | 0.100 | 0.100 | 0.008 |  |
| assemble [static-install] | ms | cold | 55 | 0.000 | 0.100 | 0.200 | 0.200 | 0.013 |  |
| job.total | ms | warm | 1004 | 1.100 | 3.300 | 3.900 | 24.200 | 1.390 | 0 of 1 |
| job.total | ms | cold | 100 | 1.200 | 3.500 | 4.700 | 12.500 | 1.673 | 0 of 1 |
| job.total [pose-only] | ms | warm | 461 | 0.600 | 2.700 | 3.300 | 6.000 | 0.960 |  |
| job.total [pose-only] | ms | cold | 45 | 0.600 | 2.700 | 3.400 | 3.400 | 1.049 |  |
| job.total [static-install] | ms | warm | 543 | 1.700 | 3.500 | 4.400 | 24.200 | 1.756 |  |
| job.total [static-install] | ms | cold | 55 | 1.700 | 4.000 | 12.500 | 12.500 | 2.184 |  |
| pose.snapshot | ms | warm | 1004 | 0.000 | 0.000 | 0.100 | 0.100 | 0.003 | 0 of 1 |
| pose.snapshot | ms | cold | 100 | 0.000 | 0.000 | 0.100 | 0.100 | 0.004 | 0 of 1 |
| pose.snapshot [pose-only] | ms | warm | 461 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| pose.snapshot [pose-only] | ms | cold | 45 | 0.000 | 0.000 | 0.100 | 0.100 | 0.004 |  |
| pose.snapshot [static-install] | ms | warm | 543 | 0.000 | 0.000 | 0.100 | 0.100 | 0.003 |  |
| pose.snapshot [static-install] | ms | cold | 55 | 0.000 | 0.000 | 0.100 | 0.100 | 0.004 |  |
| solve | ms | warm | 1004 | 0.800 | 2.700 | 3.300 | 18.600 | 1.089 | 0 of 1 |
| solve | ms | cold | 100 | 0.900 | 2.900 | 3.800 | 5.300 | 1.245 | 0 of 1 |
| solve [pose-only] | ms | warm | 461 | 0.500 | 2.700 | 3.200 | 5.800 | 0.906 |  |
| solve [pose-only] | ms | cold | 45 | 0.500 | 2.600 | 3.300 | 3.300 | 0.984 |  |
| solve [static-install] | ms | warm | 543 | 1.300 | 2.800 | 3.500 | 18.600 | 1.245 |  |
| solve [static-install] | ms | cold | 55 | 1.400 | 3.100 | 5.300 | 5.300 | 1.458 |  |
| static.compile | ms | warm | 1004 | 0.300 | 0.700 | 0.900 | 5.400 | 0.290 | 0 of 1 |
| static.compile | ms | cold | 100 | 0.300 | 0.900 | 0.900 | 6.900 | 0.413 | 0 of 1 |
| static.compile [pose-only] | ms | warm | 461 | 0.000 | 0.100 | 0.200 | 0.200 | 0.043 |  |
| static.compile [pose-only] | ms | cold | 45 | 0.000 | 0.100 | 0.200 | 0.200 | 0.051 |  |
| static.compile [static-install] | ms | warm | 543 | 0.400 | 0.800 | 1.000 | 5.400 | 0.499 |  |
| static.compile [static-install] | ms | cold | 55 | 0.600 | 0.900 | 6.900 | 6.900 | 0.709 |  |

## TS-S TH02_STATIC_EDIT_TAPE pass=clean boundary=node-core workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=not-applicable viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1104 coalesced=not-applicable dispatched=not-applicable completed=1104 accepted=1104 stale=not-applicable fallback=not-applicable error=0 timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| assemble | ms | warm | 1004 | 0.017 | 0.027 | 0.046 | 0.150 | 0.018 | 0 of 1 |
| assemble | ms | cold | 100 | 0.015 | 0.025 | 0.061 | 0.219 | 0.017 | 0 of 1 |
| assemble [pose-only] | ms | warm | 461 | 0.017 | 0.026 | 0.041 | 0.100 | 0.018 |  |
| assemble [pose-only] | ms | cold | 45 | 0.015 | 0.025 | 0.061 | 0.061 | 0.015 |  |
| assemble [static-install] | ms | warm | 543 | 0.017 | 0.027 | 0.048 | 0.150 | 0.019 |  |
| assemble [static-install] | ms | cold | 55 | 0.014 | 0.027 | 0.219 | 0.219 | 0.018 |  |
| job.total | ms | warm | 1004 | 1.881 | 4.440 | 4.895 | 8.102 | 2.293 | 0 of 1 |
| job.total | ms | cold | 100 | 1.509 | 5.083 | 5.434 | 17.745 | 2.261 | 0 of 1 |
| job.total [pose-only] | ms | warm | 461 | 0.691 | 3.770 | 4.163 | 4.764 | 1.593 |  |
| job.total [pose-only] | ms | cold | 45 | 0.727 | 3.964 | 4.266 | 4.266 | 1.351 |  |
| job.total [static-install] | ms | warm | 543 | 3.279 | 4.579 | 5.123 | 8.102 | 2.888 |  |
| job.total [static-install] | ms | cold | 55 | 2.007 | 5.410 | 17.745 | 17.745 | 3.006 |  |
| pose.snapshot | ms | warm | 1004 | 0.003 | 0.003 | 0.006 | 0.103 | 0.003 | 0 of 1 |
| pose.snapshot | ms | cold | 100 | 0.003 | 0.007 | 0.012 | 0.038 | 0.003 | 0 of 1 |
| pose.snapshot [pose-only] | ms | warm | 461 | 0.003 | 0.003 | 0.003 | 0.007 | 0.002 |  |
| pose.snapshot [pose-only] | ms | cold | 45 | 0.002 | 0.007 | 0.012 | 0.012 | 0.003 |  |
| pose.snapshot [static-install] | ms | warm | 543 | 0.003 | 0.004 | 0.007 | 0.103 | 0.003 |  |
| pose.snapshot [static-install] | ms | cold | 55 | 0.003 | 0.006 | 0.038 | 0.038 | 0.003 |  |
| solve | ms | warm | 1004 | 1.725 | 3.683 | 4.067 | 6.883 | 1.813 | 0 of 1 |
| solve | ms | cold | 100 | 0.987 | 4.115 | 4.297 | 7.421 | 1.666 | 0 of 1 |
| solve [pose-only] | ms | warm | 461 | 0.591 | 3.661 | 4.062 | 4.653 | 1.502 |  |
| solve [pose-only] | ms | cold | 45 | 0.615 | 3.868 | 4.161 | 4.161 | 1.266 |  |
| solve [static-install] | ms | warm | 543 | 2.623 | 3.684 | 4.160 | 6.883 | 2.077 |  |
| solve [static-install] | ms | cold | 55 | 1.297 | 4.227 | 7.421 | 7.421 | 1.993 |  |
| static.compile | ms | warm | 1004 | 0.582 | 0.916 | 1.077 | 1.948 | 0.459 | 0 of 1 |
| static.compile | ms | cold | 100 | 0.409 | 1.044 | 1.267 | 10.067 | 0.576 | 0 of 1 |
| static.compile [pose-only] | ms | warm | 461 | 0.070 | 0.090 | 0.121 | 0.150 | 0.071 |  |
| static.compile [pose-only] | ms | cold | 45 | 0.069 | 0.103 | 0.149 | 0.149 | 0.067 |  |
| static.compile [static-install] | ms | warm | 543 | 0.800 | 0.945 | 1.115 | 1.948 | 0.789 |  |
| static.compile [static-install] | ms | cold | 55 | 0.877 | 1.116 | 10.067 | 10.067 | 0.991 |  |

## TS-S W01_H100_POSE_60HZ_60S pass=clean boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 2
Denominators: submitted=7200 coalesced=5856 dispatched=not-applicable completed=1344 accepted=1344 stale=0 fallback=1344 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| display.derive | ms | warm | 1231 | 0.600 | 1.700 | 3.000 | 15.300 | 0.740 | 2 of 2 |
| display.derive | ms | cold | 113 | 0.700 | 2.700 | 4.700 | 8.700 | 0.989 | 2 of 2 |
| display.derive [pose-only] | ms | warm | 1231 | 0.600 | 1.700 | 3.000 | 15.300 | 0.740 |  |
| display.derive [pose-only] | ms | cold | 111 | 0.700 | 1.900 | 4.700 | 8.700 | 0.938 |  |
| display.derive [static-install] | ms | cold | 2 | 3.700 | 4.000 | 4.000 | 4.000 | 3.850 |  |
| input.lateness | ms | warm | 6598 | 0.333 | 5.400 | 105.500 | 182.233 | 3.257 | 0 of 2 |
| input.lateness | ms | cold | 602 | 0.333 | 18.933 | 101.067 | 114.467 | 4.337 | 0 of 2 |
| input.project | ms | warm | 6598 | 2.800 | 4.900 | 9.900 | 47.000 | 2.834 | 0 of 2 |
| input.project | ms | cold | 602 | 2.000 | 4.900 | 12.900 | 67.900 | 2.686 | 0 of 2 |
| job.submit-to-accepted | ms | warm | 1231 | 14.500 | 21.800 | 45.400 | 100.300 | 15.400 | 2 of 2 |
| job.submit-to-accepted | ms | cold | 113 | 14.500 | 24.000 | 84.800 | 90.800 | 15.962 | 2 of 2 |
| job.submit-to-accepted [pose-only] | ms | warm | 1231 | 14.500 | 21.800 | 45.400 | 100.300 | 15.400 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 111 | 14.400 | 22.000 | 84.800 | 90.800 | 15.857 |  |
| job.submit-to-accepted [static-install] | ms | cold | 2 | 19.000 | 24.600 | 24.600 | 24.600 | 21.800 |  |
| pool.compute-metric | ms | warm | 1231 | 3.300 | 6.800 | 17.600 | 58.200 | 3.882 | 2 of 2 |
| pool.compute-metric | ms | cold | 113 | 2.900 | 8.900 | 17.800 | 54.300 | 4.184 | 2 of 2 |
| pool.compute-metric [pose-only] | ms | warm | 1231 | 3.300 | 6.800 | 17.600 | 58.200 | 3.882 |  |
| pool.compute-metric [pose-only] | ms | cold | 111 | 2.900 | 8.900 | 17.800 | 54.300 | 4.152 |  |
| pool.compute-metric [static-install] | ms | cold | 2 | 5.600 | 6.300 | 6.300 | 6.300 | 5.950 |  |
| pose.age-at-accept | ms | warm | 1231 | 0.000 | 0.000 | 0.000 | 16.900 | 0.066 | 2 of 2 |
| pose.age-at-accept | ms | cold | 113 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 2 of 2 |
| pose.age-at-accept [pose-only] | ms | warm | 1231 | 0.000 | 0.000 | 0.000 | 16.900 | 0.066 |  |
| pose.age-at-accept [pose-only] | ms | cold | 111 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| pose.age-at-accept [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| pose.latest-wait | ms | warm | 6598 | 50.200 | 89.700 | 95.500 | 164.000 | 51.126 | 0 of 2 |
| pose.latest-wait | ms | cold | 602 | 50.300 | 89.900 | 96.800 | 168.500 | 51.354 | 0 of 2 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 6598 | 50.200 | 89.700 | 95.500 | 164.000 | 51.126 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 602 | 50.300 | 89.900 | 96.800 | 168.500 | 51.354 |  |
| queue.wait | ms | warm | 1231 | 8.400 | 14.600 | 16.000 | 59.300 | 8.557 | 2 of 2 |
| queue.wait | ms | cold | 113 | 8.500 | 14.000 | 16.300 | 16.300 | 8.507 | 2 of 2 |
| queue.wait [pose-only] | ms | warm | 1231 | 8.400 | 14.600 | 16.000 | 59.300 | 8.557 |  |
| queue.wait [pose-only] | ms | cold | 111 | 8.600 | 14.000 | 16.300 | 16.300 | 8.634 |  |
| queue.wait [static-install] | ms | cold | 2 | 0.400 | 2.500 | 2.500 | 2.500 | 1.450 |  |

## TS-S W02_H100_STATIC_5HZ_30S pass=clean boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 2
Denominators: submitted=3900 coalesced=3221 dispatched=not-applicable completed=679 accepted=679 stale=0 fallback=679 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| display.derive | ms | warm | 564 | 0.500 | 1.600 | 2.200 | 2.600 | 0.655 | 2 of 2 |
| display.derive | ms | cold | 115 | 0.600 | 1.900 | 4.000 | 7.200 | 0.767 | 2 of 2 |
| display.derive [pose-only] | ms | warm | 315 | 0.500 | 1.600 | 2.000 | 2.600 | 0.650 |  |
| display.derive [pose-only] | ms | cold | 62 | 0.500 | 1.800 | 2.400 | 2.400 | 0.637 |  |
| display.derive [static-install] | ms | warm | 249 | 0.500 | 1.700 | 2.300 | 2.600 | 0.661 |  |
| display.derive [static-install] | ms | cold | 53 | 0.600 | 1.900 | 7.200 | 7.200 | 0.919 |  |
| input.lateness | ms | warm | 3246 | 0.400 | 6.233 | 12.133 | 22.333 | 1.075 | 0 of 2 |
| input.lateness | ms | cold | 654 | 0.400 | 6.600 | 16.933 | 43.367 | 1.188 | 0 of 2 |
| input.project | ms | warm | 3246 | 2.700 | 6.000 | 11.100 | 20.600 | 2.802 | 0 of 2 |
| input.project | ms | cold | 654 | 1.300 | 4.500 | 12.000 | 24.100 | 2.264 | 0 of 2 |
| job.submit-to-accepted | ms | warm | 564 | 14.100 | 20.800 | 23.100 | 99.100 | 14.577 | 2 of 2 |
| job.submit-to-accepted | ms | cold | 115 | 13.900 | 21.800 | 23.600 | 35.000 | 13.957 | 2 of 2 |
| job.submit-to-accepted [pose-only] | ms | warm | 315 | 14.000 | 20.700 | 22.600 | 99.100 | 14.731 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 62 | 13.900 | 20.800 | 23.500 | 23.500 | 13.547 |  |
| job.submit-to-accepted [static-install] | ms | warm | 249 | 14.400 | 20.900 | 23.100 | 23.400 | 14.382 |  |
| job.submit-to-accepted [static-install] | ms | cold | 53 | 13.600 | 21.900 | 35.000 | 35.000 | 14.438 |  |
| pool.compute-metric | ms | warm | 564 | 3.000 | 6.000 | 7.000 | 9.400 | 3.339 | 2 of 2 |
| pool.compute-metric | ms | cold | 115 | 2.000 | 6.200 | 6.700 | 10.100 | 2.928 | 2 of 2 |
| pool.compute-metric [pose-only] | ms | warm | 315 | 3.000 | 6.000 | 6.400 | 9.400 | 3.296 |  |
| pool.compute-metric [pose-only] | ms | cold | 62 | 1.900 | 6.200 | 6.600 | 6.600 | 2.734 |  |
| pool.compute-metric [static-install] | ms | warm | 249 | 3.100 | 6.000 | 7.100 | 8.600 | 3.393 |  |
| pool.compute-metric [static-install] | ms | cold | 53 | 2.400 | 6.300 | 10.100 | 10.100 | 3.155 |  |
| pose.age-at-accept | ms | warm | 564 | 0.000 | 0.000 | 0.000 | 18.800 | 0.106 | 2 of 2 |
| pose.age-at-accept | ms | cold | 115 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 2 of 2 |
| pose.age-at-accept [pose-only] | ms | warm | 315 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| pose.age-at-accept [pose-only] | ms | cold | 62 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| pose.age-at-accept [static-install] | ms | warm | 249 | 0.000 | 0.000 | 15.900 | 18.800 | 0.240 |  |
| pose.age-at-accept [static-install] | ms | cold | 53 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| pose.latest-wait | ms | warm | 3246 | 50.000 | 89.100 | 94.300 | 99.800 | 50.626 | 0 of 2 |
| pose.latest-wait | ms | cold | 654 | 49.100 | 88.200 | 92.700 | 97.000 | 49.741 | 0 of 2 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 3246 | 50.000 | 89.100 | 94.300 | 99.800 | 50.626 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 654 | 49.100 | 88.200 | 92.700 | 97.000 | 49.741 |  |
| queue.wait | ms | warm | 564 | 7.700 | 14.400 | 16.400 | 90.500 | 8.540 | 2 of 2 |
| queue.wait | ms | cold | 115 | 8.000 | 15.100 | 16.000 | 16.300 | 8.510 | 2 of 2 |
| queue.wait [pose-only] | ms | warm | 315 | 8.300 | 14.500 | 16.500 | 90.500 | 9.095 |  |
| queue.wait [pose-only] | ms | cold | 62 | 8.400 | 15.200 | 16.300 | 16.300 | 8.985 |  |
| queue.wait [static-install] | ms | warm | 249 | 6.500 | 14.400 | 15.800 | 16.400 | 7.837 |  |
| queue.wait [static-install] | ms | cold | 53 | 7.400 | 13.900 | 15.500 | 15.500 | 7.953 |  |

## TS-S W03_C100_POSE_60HZ_60S pass=clean boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 2
Denominators: submitted=7200 coalesced=5996 dispatched=not-applicable completed=1204 accepted=1204 stale=0 fallback=1204 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| input.lateness | ms | warm | 6598 | 0.167 | 1.200 | 1.800 | 24.233 | 0.218 | 0 of 2 |
| input.lateness | ms | cold | 602 | 0.133 | 1.400 | 2.200 | 24.933 | 0.319 | 0 of 2 |
| job.submit-to-accepted | ms | warm | 1103 | 3.500 | 5.300 | 7.500 | 38.200 | 3.594 | 2 of 2 |
| job.submit-to-accepted | ms | cold | 101 | 3.000 | 8.100 | 9.900 | 41.100 | 3.781 | 2 of 2 |
| pool.compute-metric | ms | warm | 1103 | 3.400 | 5.200 | 6.500 | 37.100 | 3.479 | 2 of 2 |
| pool.compute-metric | ms | cold | 101 | 3.000 | 6.000 | 8.600 | 40.700 | 3.562 | 2 of 2 |
| pose.age-at-accept | ms | warm | 1103 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 2 of 2 |
| pose.age-at-accept | ms | cold | 101 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 2 of 2 |
| pose.latest-wait | ms | warm | 6598 | 44.800 | 87.500 | 88.900 | 123.800 | 45.193 | 0 of 2 |
| pose.latest-wait | ms | cold | 602 | 50.400 | 87.000 | 91.200 | 124.000 | 45.281 | 0 of 2 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 6598 | 44.800 | 87.500 | 88.900 | 123.800 | 45.193 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 602 | 50.400 | 87.000 | 91.200 | 124.000 | 45.281 |  |
| queue.client | ms | cold | 2 | 0.400 | 0.500 | 0.500 | 0.500 | 0.450 | 2 of 2 |
| queue.wait | ms | warm | 1103 | 0.100 | 0.200 | 0.200 | 31.700 | 0.114 | 2 of 2 |
| queue.wait | ms | cold | 101 | 0.100 | 0.200 | 3.600 | 8.200 | 0.219 | 2 of 2 |

## TS-S W04_C100_STATIC_5HZ_30S pass=clean boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 2
Denominators: submitted=3900 coalesced=3296 dispatched=not-applicable completed=604 accepted=604 stale=0 fallback=604 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| input.lateness | ms | warm | 3247 | 0.267 | 1.233 | 1.833 | 10.867 | 0.263 | 0 of 2 |
| input.lateness | ms | cold | 653 | 0.167 | 1.267 | 2.067 | 14.500 | 0.269 | 0 of 2 |
| job.submit-to-accepted | ms | warm | 502 | 3.700 | 5.800 | 12.100 | 77.000 | 3.998 | 2 of 2 |
| job.submit-to-accepted | ms | cold | 102 | 3.100 | 6.100 | 8.400 | 12.200 | 3.329 | 2 of 2 |
| pool.compute-metric | ms | warm | 502 | 3.700 | 5.700 | 11.100 | 21.600 | 3.781 | 2 of 2 |
| pool.compute-metric | ms | cold | 102 | 3.000 | 6.000 | 7.700 | 10.700 | 3.254 | 2 of 2 |
| pose.age-at-accept | ms | warm | 502 | 0.000 | 0.000 | 0.000 | 20.900 | 0.042 | 2 of 2 |
| pose.age-at-accept | ms | cold | 102 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 2 of 2 |
| pose.latest-wait | ms | warm | 3247 | 52.400 | 88.300 | 95.900 | 109.600 | 48.047 | 0 of 2 |
| pose.latest-wait | ms | cold | 653 | 50.900 | 87.700 | 90.200 | 96.200 | 46.302 | 0 of 2 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 3247 | 52.400 | 88.300 | 95.900 | 109.600 | 48.047 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 653 | 50.900 | 87.700 | 90.200 | 96.200 | 46.302 |  |
| queue.client | ms | cold | 2 | 0.100 | 0.500 | 0.500 | 0.500 | 0.300 | 2 of 2 |
| queue.wait | ms | warm | 502 | 0.100 | 0.200 | 0.200 | 73.900 | 0.215 | 2 of 2 |
| queue.wait | ms | cold | 102 | 0.100 | 0.200 | 0.700 | 1.500 | 0.075 | 2 of 2 |

## TS-W APP_C_DRAG pass=clean boundary=browser-app workers=2 audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 1
Denominators: submitted=254 coalesced=not-applicable dispatched=117 completed=117 accepted=117 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | warm | 17 | 0.500 | 20.800 | 20.800 | 20.800 | 2.024 | 1 of 1 |
| accept.to-first-param | ms | cold | 100 | 0.500 | 3.300 | 13.300 | 13.700 | 1.269 | 1 of 1 |
| accept.to-first-param [pose-only] | ms | warm | 17 | 0.500 | 20.800 | 20.800 | 20.800 | 2.024 |  |
| accept.to-first-param [pose-only] | ms | cold | 100 | 0.500 | 3.300 | 13.300 | 13.700 | 1.269 |  |
| accept.to-overlay-commit | ms | warm | 17 | 0.500 | 6.800 | 6.800 | 6.800 | 1.065 | 1 of 1 |
| accept.to-overlay-commit | ms | cold | 100 | 0.500 | 2.600 | 9.200 | 9.500 | 0.926 | 1 of 1 |
| accept.to-overlay-commit [pose-only] | ms | warm | 17 | 0.500 | 6.800 | 6.800 | 6.800 | 1.065 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 0.500 | 2.600 | 9.200 | 9.500 | 0.926 |  |
| accept.to-status-commit | ms | warm | 17 | 0.900 | 35.900 | 35.900 | 35.900 | 3.559 | 1 of 1 |
| accept.to-status-commit | ms | cold | 100 | 1.000 | 9.900 | 24.500 | 42.700 | 2.605 | 1 of 1 |
| accept.to-status-commit [pose-only] | ms | warm | 17 | 0.900 | 35.900 | 35.900 | 35.900 | 3.559 |  |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 1.000 | 9.900 | 24.500 | 42.700 | 2.605 |  |
| app.input-to-commit | ms | warm | 1 | 90.700 | 90.700 | 90.700 | 90.700 | 90.700 | 1 of 1 |
| app.input-to-commit [pose-only] | ms | warm | 1 | 90.700 | 90.700 | 90.700 | 90.700 | 90.700 |  |
| app.input-to-dispatch | ms | warm | 1 | 65.700 | 65.700 | 65.700 | 65.700 | 65.700 | 1 of 1 |
| app.input-to-dispatch [pose-only] | ms | warm | 1 | 65.700 | 65.700 | 65.700 | 65.700 | 65.700 |  |
| app.long-animation-frame | ms | cold | 1 | 61.500 | 61.500 | 61.500 | 61.500 | 61.500 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 1 | 0.600 | 0.600 | 0.600 | 0.600 | 0.600 | 1 of 1 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 3 | 47.200 | 60.400 | 60.400 | 60.400 | 35.867 | 1 of 1 |
| app.long-animation-frame.out-of-window | ms | cold | 3 | 111.200 | 205.000 | 205.000 | 205.000 | 137.833 | 1 of 1 |
| app.long-task.out-of-window | ms | cold | 1 | 97.000 | 97.000 | 97.000 | 97.000 | 97.000 | 1 of 1 |
| app.worker-compute-metric | ms | warm | 17 | 0.000 | 18.000 | 18.000 | 18.000 | 2.000 | 1 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 1.000 | 4.000 | 9.000 | 9.000 | 1.220 | 1 of 1 |
| app.worker-compute-metric [pose-only] | ms | warm | 17 | 0.000 | 18.000 | 18.000 | 18.000 | 2.000 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 1.000 | 4.000 | 9.000 | 9.000 | 1.220 |  |
| audio.apply-window | ms | warm | 17 | 0.000 | 0.700 | 0.700 | 0.700 | 0.094 | 1 of 1 |
| audio.apply-window | ms | cold | 100 | 0.000 | 0.200 | 0.800 | 0.900 | 0.067 | 1 of 1 |
| audio.apply-window [pose-only] | ms | warm | 17 | 0.000 | 0.700 | 0.700 | 0.700 | 0.094 |  |
| audio.apply-window [pose-only] | ms | cold | 100 | 0.000 | 0.200 | 0.800 | 0.900 | 0.067 |  |
| audio.callback-interval-mean | s | cold | 49 | 0.010 | 0.011 | 0.011 | 0.011 | 0.010 | 1 of 1 |
| audio.param-call-total-ms | ms | warm | 17 | 0.000 | 0.300 | 0.300 | 0.300 | 0.035 | 1 of 1 |
| audio.param-call-total-ms | ms | cold | 100 | 0.000 | 0.100 | 0.300 | 0.400 | 0.028 | 1 of 1 |
| audio.param-call-total-ms [pose-only] | ms | warm | 17 | 0.000 | 0.300 | 0.300 | 0.300 | 0.035 |  |
| audio.param-call-total-ms [pose-only] | ms | cold | 100 | 0.000 | 0.100 | 0.300 | 0.400 | 0.028 |  |
| audio.param-ops | count | warm | 17 | 9.000 | 19.000 | 19.000 | 19.000 | 10.118 | 1 of 1 |
| audio.param-ops | count | cold | 100 | 8.000 | 19.000 | 29.000 | 29.000 | 8.890 | 1 of 1 |
| audio.param-ops [pose-only] | count | warm | 17 | 9.000 | 19.000 | 19.000 | 19.000 | 10.118 |  |
| audio.param-ops [pose-only] | count | cold | 100 | 8.000 | 19.000 | 29.000 | 29.000 | 8.890 |  |
| audio.render-capacity | ratio | cold | 49 | 0.091 | 0.941 | 0.989 | 0.989 | 0.174 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | warm | 17 | 14.000 | 20.800 | 20.800 | 20.800 | 13.088 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 11.300 | 18.200 | 34.200 | 69.200 | 11.414 | 1 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 17 | 14.000 | 20.800 | 20.800 | 20.800 | 13.088 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 11.300 | 18.200 | 34.200 | 69.200 | 11.414 |  |
| display.status-commit-to-frame-end | ms | warm | 17 | 13.300 | 34.200 | 34.200 | 34.200 | 13.094 | 1 of 1 |
| display.status-commit-to-frame-end | ms | cold | 100 | 11.200 | 17.600 | 51.000 | 52.000 | 11.240 | 1 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 17 | 13.300 | 34.200 | 34.200 | 34.200 | 13.094 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 11.200 | 17.600 | 51.000 | 52.000 | 11.240 |  |
| merge.handler | ms | warm | 34 | 0.100 | 0.900 | 2.000 | 2.000 | 0.188 | 1 of 1 |
| merge.handler | ms | cold | 200 | 0.100 | 0.600 | 2.700 | 3.900 | 0.188 | 1 of 1 |
| merge.handler [pose-only] | ms | warm | 34 | 0.100 | 0.900 | 2.000 | 2.000 | 0.188 |  |
| merge.handler [pose-only] | ms | cold | 200 | 0.100 | 0.600 | 2.700 | 3.900 | 0.188 |  |
| merge.reply-deserialize | ms | warm | 34 | 0.000 | 0.800 | 1.000 | 1.000 | 0.082 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.400 | 0.500 | 0.031 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 34 | 0.000 | 0.800 | 1.000 | 1.000 | 0.082 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 200 | 0.000 | 0.100 | 0.400 | 0.500 | 0.031 |  |
| shard.compute-reported | ms | warm | 34 | 0.000 | 2.000 | 3.000 | 3.000 | 0.235 | 1 of 1 |
| shard.compute-reported | ms | cold | 200 | 0.000 | 1.000 | 2.000 | 3.000 | 0.265 | 1 of 1 |
| shard.compute-reported [pose-only] | ms | warm | 34 | 0.000 | 2.000 | 3.000 | 3.000 | 0.235 |  |
| shard.compute-reported [pose-only] | ms | cold | 200 | 0.000 | 1.000 | 2.000 | 3.000 | 0.265 |  |
| shard.post | ms | warm | 34 | 0.000 | 0.300 | 0.300 | 0.300 | 0.068 | 1 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.200 | 0.300 | 0.800 | 0.048 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 34 | 0.000 | 0.300 | 0.300 | 0.300 | 0.068 |  |
| shard.post [pose-only] | ms | cold | 200 | 0.000 | 0.200 | 0.300 | 0.800 | 0.048 |  |
| shard.roundtrip | ms | warm | 34 | 0.400 | 15.000 | 15.400 | 15.400 | 1.500 | 1 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.400 | 2.600 | 3.900 | 4.600 | 0.742 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 34 | 0.400 | 15.000 | 15.400 | 15.400 | 1.500 |  |
| shard.roundtrip [pose-only] | ms | cold | 200 | 0.400 | 2.600 | 3.900 | 4.600 | 0.742 |  |

## TS-W APP_C_DRAG pass=stock boundary=browser-app workers=not-applicable audio=on build=prod driver=stock-poll browser-channel=default viewport=default browser-args=[]

Runs: 1
Denominators: submitted=not-applicable coalesced=not-applicable dispatched=not-applicable completed=not-applicable accepted=not-applicable stale=not-applicable fallback=not-applicable error=not-applicable timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |

## TS-W APP_C_DRAG pass=traced boundary=browser-app workers=2 audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 1
Denominators: submitted=226 coalesced=not-applicable dispatched=105 completed=105 accepted=105 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | warm | 5 | 0.500 | 0.700 | 0.700 | 0.700 | 0.500 | 1 of 1 |
| accept.to-first-param | ms | cold | 100 | 0.600 | 12.000 | 28.600 | 103.900 | 3.061 | 1 of 1 |
| accept.to-first-param [pose-only] | ms | warm | 5 | 0.500 | 0.700 | 0.700 | 0.700 | 0.500 |  |
| accept.to-first-param [pose-only] | ms | cold | 100 | 0.600 | 12.000 | 28.600 | 103.900 | 3.061 |  |
| accept.to-overlay-commit | ms | warm | 5 | 0.400 | 0.400 | 0.400 | 0.400 | 0.360 | 1 of 1 |
| accept.to-overlay-commit | ms | cold | 100 | 0.500 | 5.300 | 12.500 | 22.600 | 1.425 | 1 of 1 |
| accept.to-overlay-commit [pose-only] | ms | warm | 5 | 0.400 | 0.400 | 0.400 | 0.400 | 0.360 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 0.500 | 5.300 | 12.500 | 22.600 | 1.425 |  |
| accept.to-status-commit | ms | warm | 5 | 1.000 | 1.100 | 1.100 | 1.100 | 0.900 | 1 of 1 |
| accept.to-status-commit | ms | cold | 100 | 1.100 | 17.000 | 131.500 | 215.500 | 7.053 | 1 of 1 |
| accept.to-status-commit [pose-only] | ms | warm | 5 | 1.000 | 1.100 | 1.100 | 1.100 | 0.900 |  |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 1.100 | 17.000 | 131.500 | 215.500 | 7.053 |  |
| app.input-to-commit | ms | warm | 1 | 47.900 | 47.900 | 47.900 | 47.900 | 47.900 | 1 of 1 |
| app.input-to-commit [pose-only] | ms | warm | 1 | 47.900 | 47.900 | 47.900 | 47.900 | 47.900 |  |
| app.input-to-dispatch | ms | warm | 1 | 46.200 | 46.200 | 46.200 | 46.200 | 46.200 | 1 of 1 |
| app.input-to-dispatch [pose-only] | ms | warm | 1 | 46.200 | 46.200 | 46.200 | 46.200 | 46.200 |  |
| app.long-animation-frame | ms | cold | 10 | 106.700 | 156.200 | 156.200 | 156.200 | 106.530 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 10 | 10.900 | 90.400 | 90.400 | 90.400 | 36.890 | 1 of 1 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 4 | 2.200 | 283.500 | 283.500 | 283.500 | 85.150 | 1 of 1 |
| app.long-animation-frame.out-of-window | ms | cold | 4 | 75.100 | 344.700 | 344.700 | 344.700 | 144.850 | 1 of 1 |
| app.long-task | ms | cold | 9 | 66.000 | 132.000 | 132.000 | 132.000 | 86.000 | 1 of 1 |
| app.long-task.out-of-window | ms | cold | 2 | 52.000 | 335.000 | 335.000 | 335.000 | 193.500 | 1 of 1 |
| app.worker-compute-metric | ms | warm | 5 | 0.000 | 1.000 | 1.000 | 1.000 | 0.200 | 1 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 1.000 | 5.000 | 54.000 | 77.000 | 2.580 | 1 of 1 |
| app.worker-compute-metric [pose-only] | ms | warm | 5 | 0.000 | 1.000 | 1.000 | 1.000 | 0.200 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 1.000 | 5.000 | 54.000 | 77.000 | 2.580 |  |
| audio.apply-window | ms | warm | 5 | 0.100 | 0.100 | 0.100 | 0.100 | 0.060 | 1 of 1 |
| audio.apply-window | ms | cold | 100 | 0.000 | 0.200 | 0.600 | 8.300 | 0.129 | 1 of 1 |
| audio.apply-window [pose-only] | ms | warm | 5 | 0.100 | 0.100 | 0.100 | 0.100 | 0.060 |  |
| audio.apply-window [pose-only] | ms | cold | 100 | 0.000 | 0.200 | 0.600 | 8.300 | 0.129 |  |
| audio.callback-interval-mean | s | cold | 46 | 0.010 | 0.011 | 0.012 | 0.012 | 0.010 | 1 of 1 |
| audio.param-call-total-ms | ms | warm | 5 | 0.100 | 0.100 | 0.100 | 0.100 | 0.060 | 1 of 1 |
| audio.param-call-total-ms | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 1.900 | 0.038 | 1 of 1 |
| audio.param-call-total-ms [pose-only] | ms | warm | 5 | 0.100 | 0.100 | 0.100 | 0.100 | 0.060 |  |
| audio.param-call-total-ms [pose-only] | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 1.900 | 0.038 |  |
| audio.param-ops | count | warm | 5 | 10.000 | 12.000 | 12.000 | 12.000 | 10.200 | 1 of 1 |
| audio.param-ops | count | cold | 100 | 8.000 | 20.000 | 30.000 | 30.000 | 9.080 | 1 of 1 |
| audio.param-ops [pose-only] | count | warm | 5 | 10.000 | 12.000 | 12.000 | 12.000 | 10.200 |  |
| audio.param-ops [pose-only] | count | cold | 100 | 8.000 | 20.000 | 30.000 | 30.000 | 9.080 |  |
| audio.render-capacity | ratio | cold | 46 | 0.094 | 0.979 | 0.989 | 0.989 | 0.210 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | warm | 5 | 14.100 | 15.100 | 15.100 | 15.100 | 13.140 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 8.600 | 19.700 | 195.900 | 210.700 | 14.553 | 1 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 5 | 14.100 | 15.100 | 15.100 | 15.100 | 13.140 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 8.600 | 19.700 | 195.900 | 210.700 | 14.553 |  |
| display.status-commit-to-frame-end | ms | warm | 5 | 13.500 | 14.700 | 14.700 | 14.700 | 12.600 | 1 of 1 |
| display.status-commit-to-frame-end | ms | cold | 100 | 8.600 | 17.600 | 173.900 | 185.900 | 13.616 | 1 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 5 | 13.500 | 14.700 | 14.700 | 14.700 | 12.600 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 8.600 | 17.600 | 173.900 | 185.900 | 13.616 |  |
| merge.handler | ms | warm | 10 | 0.000 | 0.200 | 0.200 | 0.200 | 0.060 | 1 of 1 |
| merge.handler | ms | cold | 200 | 0.100 | 1.100 | 1.500 | 2.800 | 0.207 | 1 of 1 |
| merge.handler [pose-only] | ms | warm | 10 | 0.000 | 0.200 | 0.200 | 0.200 | 0.060 |  |
| merge.handler [pose-only] | ms | cold | 200 | 0.100 | 1.100 | 1.500 | 2.800 | 0.207 |  |
| merge.reply-deserialize | ms | warm | 10 | 0.000 | 0.100 | 0.100 | 0.100 | 0.010 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.400 | 0.700 | 0.032 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 10 | 0.000 | 0.100 | 0.100 | 0.100 | 0.010 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 200 | 0.000 | 0.100 | 0.400 | 0.700 | 0.032 |  |
| shard.compute-reported | ms | warm | 10 | 0.000 | 1.000 | 1.000 | 1.000 | 0.100 | 1 of 1 |
| shard.compute-reported | ms | cold | 200 | 0.000 | 1.000 | 5.000 | 15.000 | 0.335 | 1 of 1 |
| shard.compute-reported [pose-only] | ms | warm | 10 | 0.000 | 1.000 | 1.000 | 1.000 | 0.100 |  |
| shard.compute-reported [pose-only] | ms | cold | 200 | 0.000 | 1.000 | 5.000 | 15.000 | 0.335 |  |
| shard.post | ms | warm | 10 | 0.000 | 0.100 | 0.100 | 0.100 | 0.020 | 1 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.200 | 0.700 | 14.500 | 0.136 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 10 | 0.000 | 0.100 | 0.100 | 0.100 | 0.020 |  |
| shard.post [pose-only] | ms | cold | 200 | 0.000 | 0.200 | 0.700 | 14.500 | 0.136 |  |
| shard.roundtrip | ms | warm | 10 | 0.200 | 0.500 | 0.500 | 0.500 | 0.260 | 1 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.300 | 3.000 | 43.900 | 70.600 | 1.950 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 10 | 0.200 | 0.500 | 0.500 | 0.500 | 0.260 |  |
| shard.roundtrip [pose-only] | ms | cold | 200 | 0.300 | 3.000 | 43.900 | 70.600 | 1.950 |  |

## TS-W APP_H100_SWITCH pass=alloc boundary=browser-app workers=not-applicable audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 1
Denominators: submitted=200 coalesced=not-applicable dispatched=200 completed=200 accepted=200 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | warm | 100 | 1.000 | 9.700 | 62.000 | 232.700 | 5.237 | 1 of 1 |
| accept.to-first-param | ms | cold | 100 | 1.400 | 8.700 | 45.500 | 62.700 | 3.358 | 1 of 1 |
| accept.to-first-param [pose-only] | ms | warm | 100 | 1.000 | 9.700 | 62.000 | 232.700 | 5.237 |  |
| accept.to-first-param [pose-only] | ms | cold | 100 | 1.400 | 8.700 | 45.500 | 62.700 | 3.358 |  |
| accept.to-overlay-commit | ms | warm | 100 | 1.000 | 3.500 | 4.600 | 5.000 | 1.358 | 1 of 1 |
| accept.to-overlay-commit | ms | cold | 100 | 1.100 | 3.600 | 5.200 | 5.600 | 1.526 | 1 of 1 |
| accept.to-overlay-commit [pose-only] | ms | warm | 100 | 1.000 | 3.500 | 4.600 | 5.000 | 1.358 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 1.100 | 3.600 | 5.200 | 5.600 | 1.526 |  |
| accept.to-status-commit | ms | warm | 100 | 1.900 | 12.000 | 65.800 | 239.800 | 6.654 | 1 of 1 |
| accept.to-status-commit | ms | cold | 100 | 3.000 | 10.900 | 48.000 | 67.700 | 4.797 | 1 of 1 |
| accept.to-status-commit [pose-only] | ms | warm | 100 | 1.900 | 12.000 | 65.800 | 239.800 | 6.654 |  |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 3.000 | 10.900 | 48.000 | 67.700 | 4.797 |  |
| app.input-to-commit | ms | warm | 100 | 22.200 | 52.600 | 118.500 | 275.400 | 31.133 | 1 of 1 |
| app.input-to-commit | ms | cold | 100 | 23.000 | 43.500 | 98.000 | 117.300 | 28.794 | 1 of 1 |
| app.input-to-commit [pose-only] | ms | warm | 100 | 22.200 | 52.600 | 118.500 | 275.400 | 31.133 |  |
| app.input-to-commit [pose-only] | ms | cold | 100 | 23.000 | 43.500 | 98.000 | 117.300 | 28.794 |  |
| app.input-to-dispatch | ms | warm | 100 | 16.800 | 37.600 | 54.400 | 69.800 | 21.920 | 1 of 1 |
| app.input-to-dispatch | ms | cold | 100 | 17.100 | 37.400 | 45.600 | 62.000 | 21.162 | 1 of 1 |
| app.input-to-dispatch [pose-only] | ms | warm | 100 | 16.800 | 37.600 | 54.400 | 69.800 | 21.920 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 100 | 17.100 | 37.400 | 45.600 | 62.000 | 21.162 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 100 | 15.900 | 23.900 | 31.800 | 44.167 | 13.971 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 99 | 15.900 | 21.300 | 45.600 | 45.600 | 13.297 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 100 | 15.900 | 23.900 | 31.800 | 44.167 | 13.971 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 99 | 15.900 | 21.300 | 45.600 | 45.600 | 13.297 |  |
| app.long-animation-frame | ms | warm | 3 | 170.800 | 227.300 | 227.300 | 227.300 | 153.167 | 1 of 1 |
| app.long-animation-frame | ms | cold | 1 | 65.000 | 65.000 | 65.000 | 65.000 | 65.000 | 1 of 1 |
| app.long-animation-frame.blocking | ms | warm | 3 | 108.300 | 160.200 | 160.200 | 160.200 | 90.400 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 1 | 2.900 | 2.900 | 2.900 | 2.900 | 2.900 | 1 of 1 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 1 | 9.700 | 9.700 | 9.700 | 9.700 | 9.700 | 1 of 1 |
| app.long-animation-frame.out-of-window | ms | cold | 1 | 60.800 | 60.800 | 60.800 | 60.800 | 60.800 | 1 of 1 |
| app.long-task | ms | warm | 3 | 160.000 | 214.000 | 214.000 | 214.000 | 142.667 | 1 of 1 |
| app.long-task | ms | cold | 1 | 52.000 | 52.000 | 52.000 | 52.000 | 52.000 | 1 of 1 |
| app.long-task.out-of-window | ms | cold | 1 | 59.000 | 59.000 | 59.000 | 59.000 | 59.000 | 1 of 1 |
| app.worker-compute-metric | ms | warm | 100 | 2.000 | 4.000 | 7.000 | 8.000 | 2.560 | 1 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 3.000 | 5.000 | 5.000 | 7.000 | 2.890 | 1 of 1 |
| app.worker-compute-metric [pose-only] | ms | warm | 100 | 2.000 | 4.000 | 7.000 | 8.000 | 2.560 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 3.000 | 5.000 | 5.000 | 7.000 | 2.890 |  |
| audio.apply-window | ms | warm | 100 | 0.100 | 0.400 | 0.800 | 1.000 | 0.123 | 1 of 1 |
| audio.apply-window | ms | cold | 100 | 0.100 | 0.400 | 0.700 | 0.700 | 0.150 | 1 of 1 |
| audio.apply-window [pose-only] | ms | warm | 100 | 0.100 | 0.400 | 0.800 | 1.000 | 0.123 |  |
| audio.apply-window [pose-only] | ms | cold | 100 | 0.100 | 0.400 | 0.700 | 0.700 | 0.150 |  |
| audio.param-call-total-ms | ms | warm | 100 | 0.000 | 0.200 | 0.300 | 0.400 | 0.051 | 1 of 1 |
| audio.param-call-total-ms | ms | cold | 100 | 0.000 | 0.300 | 0.400 | 0.600 | 0.055 | 1 of 1 |
| audio.param-call-total-ms [pose-only] | ms | warm | 100 | 0.000 | 0.200 | 0.300 | 0.400 | 0.051 |  |
| audio.param-call-total-ms [pose-only] | ms | cold | 100 | 0.000 | 0.300 | 0.400 | 0.600 | 0.055 |  |
| audio.param-ops | count | warm | 100 | 21.000 | 139.000 | 139.000 | 139.000 | 35.350 | 1 of 1 |
| audio.param-ops | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 1 of 1 |
| audio.param-ops [pose-only] | count | warm | 100 | 21.000 | 139.000 | 139.000 | 139.000 | 35.350 |  |
| audio.param-ops [pose-only] | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| display.overlay-commit-to-frame-end | ms | warm | 100 | 13.400 | 20.500 | 60.100 | 230.800 | 15.723 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 12.300 | 28.200 | 40.700 | 60.000 | 13.721 | 1 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 100 | 13.400 | 20.500 | 60.100 | 230.800 | 15.723 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 12.300 | 28.200 | 40.700 | 60.000 | 13.721 |  |
| display.status-commit-to-frame-end | ms | warm | 100 | 12.700 | 16.800 | 24.100 | 28.700 | 11.834 | 1 of 1 |
| display.status-commit-to-frame-end | ms | cold | 100 | 11.500 | 23.800 | 33.900 | 79.200 | 12.387 | 1 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 100 | 12.700 | 16.800 | 24.100 | 28.700 | 11.834 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 11.500 | 23.800 | 33.900 | 79.200 | 12.387 |  |
| merge.handler | ms | warm | 400 | 0.100 | 0.400 | 0.800 | 1.800 | 0.133 | 1 of 1 |
| merge.handler | ms | cold | 400 | 0.100 | 0.500 | 0.700 | 0.700 | 0.150 | 1 of 1 |
| merge.handler [pose-only] | ms | warm | 400 | 0.100 | 0.400 | 0.800 | 1.800 | 0.133 |  |
| merge.handler [pose-only] | ms | cold | 400 | 0.100 | 0.500 | 0.700 | 0.700 | 0.150 |  |
| merge.reply-deserialize | ms | warm | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.023 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.017 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.023 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.017 |  |
| queue.rate-limit-estimate | ms | warm | 100 | 0.000 | 36.733 | 49.833 | 51.233 | 7.949 | 1 of 1 |
| queue.rate-limit-estimate | ms | cold | 99 | 0.000 | 36.033 | 52.933 | 52.933 | 7.919 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 100 | 0.000 | 36.733 | 49.833 | 51.233 | 7.949 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 99 | 0.000 | 36.033 | 52.933 | 52.933 | 7.919 |  |
| shard.compute-reported | ms | warm | 400 | 2.000 | 3.000 | 3.000 | 4.000 | 1.590 | 1 of 1 |
| shard.compute-reported | ms | cold | 400 | 2.000 | 3.000 | 4.000 | 6.000 | 1.762 | 1 of 1 |
| shard.compute-reported [pose-only] | ms | warm | 400 | 2.000 | 3.000 | 3.000 | 4.000 | 1.590 |  |
| shard.compute-reported [pose-only] | ms | cold | 400 | 2.000 | 3.000 | 4.000 | 6.000 | 1.762 |  |
| shard.post | ms | warm | 400 | 0.000 | 0.100 | 0.200 | 0.200 | 0.022 | 1 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 1.100 | 0.024 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 400 | 0.000 | 0.100 | 0.200 | 0.200 | 0.022 |  |
| shard.post [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 1.100 | 0.024 |  |
| shard.roundtrip | ms | warm | 400 | 1.900 | 3.200 | 4.500 | 6.900 | 1.953 | 1 of 1 |
| shard.roundtrip | ms | cold | 400 | 2.000 | 3.700 | 4.700 | 6.400 | 2.142 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 400 | 1.900 | 3.200 | 4.500 | 6.900 | 1.953 |  |
| shard.roundtrip [pose-only] | ms | cold | 400 | 2.000 | 3.700 | 4.700 | 6.400 | 2.142 |  |

## TS-W APP_H100_SWITCH pass=clean boundary=browser-app workers=not-applicable audio=off build=prod driver=immediate browser-channel=default viewport=default browser-args=[]

Runs: 1
Denominators: submitted=500 coalesced=not-applicable dispatched=500 completed=500 accepted=500 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-overlay-commit | ms | warm | 400 | 0.900 | 2.300 | 3.600 | 8.400 | 1.130 | 1 of 1 |
| accept.to-overlay-commit | ms | cold | 100 | 0.800 | 2.500 | 7.600 | 8.000 | 1.208 | 1 of 1 |
| accept.to-overlay-commit [pose-only] | ms | warm | 400 | 0.900 | 2.300 | 3.600 | 8.400 | 1.130 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 0.800 | 2.500 | 7.600 | 8.000 | 1.208 |  |
| accept.to-status-commit | ms | warm | 400 | 2.000 | 9.500 | 16.200 | 22.900 | 2.844 | 1 of 1 |
| accept.to-status-commit | ms | cold | 100 | 1.500 | 11.200 | 111.600 | 132.300 | 5.980 | 1 of 1 |
| accept.to-status-commit [pose-only] | ms | warm | 400 | 2.000 | 9.500 | 16.200 | 22.900 | 2.844 |  |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 1.500 | 11.200 | 111.600 | 132.300 | 5.980 |  |
| app.input-to-commit | ms | warm | 400 | 53.600 | 69.600 | 72.400 | 171.300 | 53.810 | 1 of 1 |
| app.input-to-commit | ms | cold | 100 | 54.400 | 69.900 | 198.900 | 228.900 | 57.518 | 1 of 1 |
| app.input-to-commit [pose-only] | ms | warm | 400 | 53.600 | 69.600 | 72.400 | 171.300 | 53.810 |  |
| app.input-to-commit [pose-only] | ms | cold | 100 | 54.400 | 69.900 | 198.900 | 228.900 | 57.518 |  |
| app.input-to-dispatch | ms | warm | 400 | 48.900 | 64.400 | 65.400 | 112.100 | 48.098 | 1 of 1 |
| app.input-to-dispatch | ms | cold | 100 | 49.800 | 64.300 | 66.000 | 147.900 | 48.845 | 1 of 1 |
| app.input-to-dispatch [pose-only] | ms | warm | 400 | 48.900 | 64.400 | 65.400 | 112.100 | 48.098 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 100 | 49.800 | 64.300 | 66.000 | 147.900 | 48.845 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 400 | 3.467 | 15.267 | 33.167 | 112.100 | 5.518 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 99 | 3.667 | 22.000 | 135.367 | 135.367 | 6.661 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 400 | 3.467 | 15.267 | 33.167 | 112.100 | 5.518 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 99 | 3.667 | 22.000 | 135.367 | 135.367 | 6.661 |  |
| app.long-animation-frame | ms | warm | 11 | 56.200 | 138.100 | 138.100 | 138.100 | 73.800 | 1 of 1 |
| app.long-animation-frame | ms | cold | 8 | 69.000 | 153.700 | 153.700 | 153.700 | 98.000 | 1 of 1 |
| app.long-animation-frame.blocking | ms | warm | 11 | 0.000 | 83.000 | 83.000 | 83.000 | 18.773 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 8 | 1.800 | 96.400 | 96.400 | 96.400 | 41.700 | 1 of 1 |
| app.long-task | ms | warm | 4 | 79.000 | 123.000 | 123.000 | 123.000 | 86.500 | 1 of 1 |
| app.long-task | ms | cold | 4 | 118.000 | 125.000 | 125.000 | 125.000 | 109.000 | 1 of 1 |
| app.worker-compute-metric | ms | warm | 400 | 2.000 | 4.000 | 20.000 | 57.000 | 2.868 | 1 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 2.000 | 5.000 | 13.000 | 14.000 | 2.720 | 1 of 1 |
| app.worker-compute-metric [pose-only] | ms | warm | 400 | 2.000 | 4.000 | 20.000 | 57.000 | 2.868 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 2.000 | 5.000 | 13.000 | 14.000 | 2.720 |  |
| display.overlay-commit-to-frame-end | ms | warm | 399 | 13.300 | 20.200 | 39.800 | 132.100 | 13.036 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 12.800 | 18.400 | 75.700 | 122.200 | 14.459 | 1 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 399 | 13.300 | 20.200 | 39.800 | 132.100 | 13.036 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 12.800 | 18.400 | 75.700 | 122.200 | 14.459 |  |
| display.status-commit-to-frame-end | ms | warm | 399 | 12.700 | 19.600 | 36.800 | 127.900 | 12.818 | 1 of 1 |
| display.status-commit-to-frame-end | ms | cold | 100 | 11.800 | 16.800 | 19.500 | 125.500 | 12.515 | 1 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 399 | 12.700 | 19.600 | 36.800 | 127.900 | 12.818 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 11.800 | 16.800 | 19.500 | 125.500 | 12.515 |  |
| merge.handler | ms | warm | 1600 | 0.100 | 0.400 | 0.700 | 1.300 | 0.122 | 0 of 1 |
| merge.handler | ms | cold | 400 | 0.100 | 0.400 | 0.700 | 1.900 | 0.136 | 0 of 1 |
| merge.handler [pose-only] | ms | warm | 1600 | 0.100 | 0.400 | 0.700 | 1.300 | 0.122 |  |
| merge.handler [pose-only] | ms | cold | 400 | 0.100 | 0.400 | 0.700 | 1.900 | 0.136 |  |
| merge.reply-deserialize | ms | warm | 1600 | 0.000 | 0.100 | 0.100 | 0.200 | 0.019 | 0 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.600 | 0.023 | 0 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 1600 | 0.000 | 0.100 | 0.100 | 0.200 | 0.019 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.600 | 0.023 |  |
| queue.rate-limit-estimate | ms | warm | 400 | 47.033 | 54.133 | 58.233 | 59.033 | 42.581 | 1 of 1 |
| queue.rate-limit-estimate | ms | cold | 99 | 47.933 | 56.533 | 58.533 | 58.533 | 42.489 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 400 | 47.033 | 54.133 | 58.233 | 59.033 | 42.581 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 99 | 47.933 | 56.533 | 58.533 | 58.533 | 42.489 |  |
| shard.compute-reported | ms | warm | 1600 | 1.000 | 2.000 | 3.000 | 4.000 | 1.304 | 0 of 1 |
| shard.compute-reported | ms | cold | 400 | 1.000 | 3.000 | 6.000 | 9.000 | 1.515 | 0 of 1 |
| shard.compute-reported [pose-only] | ms | warm | 1600 | 1.000 | 2.000 | 3.000 | 4.000 | 1.304 |  |
| shard.compute-reported [pose-only] | ms | cold | 400 | 1.000 | 3.000 | 6.000 | 9.000 | 1.515 |  |
| shard.post | ms | warm | 1600 | 0.000 | 0.100 | 0.200 | 0.400 | 0.021 | 0 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.400 | 0.021 | 0 of 1 |
| shard.post [pose-only] | ms | warm | 1600 | 0.000 | 0.100 | 0.200 | 0.400 | 0.021 |  |
| shard.post [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.400 | 0.021 |  |
| shard.roundtrip | ms | warm | 1600 | 1.700 | 3.100 | 18.700 | 56.500 | 2.305 | 0 of 1 |
| shard.roundtrip | ms | cold | 400 | 1.800 | 3.700 | 10.100 | 11.100 | 2.047 | 0 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 1600 | 1.700 | 3.100 | 18.700 | 56.500 | 2.305 |  |
| shard.roundtrip [pose-only] | ms | cold | 400 | 1.800 | 3.700 | 10.100 | 11.100 | 2.047 |  |

## TS-W APP_H100_SWITCH pass=clean boundary=browser-app workers=not-applicable audio=off build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 1
Denominators: submitted=1000 coalesced=not-applicable dispatched=1000 completed=1000 accepted=1000 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-overlay-commit | ms | warm | 900 | 0.800 | 2.500 | 3.900 | 53.300 | 1.107 | 0 of 1 |
| accept.to-overlay-commit | ms | cold | 100 | 0.800 | 2.600 | 4.200 | 28.400 | 1.373 | 0 of 1 |
| accept.to-overlay-commit [pose-only] | ms | warm | 900 | 0.800 | 2.500 | 3.900 | 53.300 | 1.107 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 0.800 | 2.600 | 4.200 | 28.400 | 1.373 |  |
| accept.to-status-commit | ms | warm | 900 | 1.400 | 7.300 | 22.300 | 59.100 | 2.698 | 0 of 1 |
| accept.to-status-commit | ms | cold | 100 | 1.400 | 8.000 | 12.400 | 32.700 | 2.833 | 0 of 1 |
| accept.to-status-commit [pose-only] | ms | warm | 900 | 1.400 | 7.300 | 22.300 | 59.100 | 2.698 |  |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 1.400 | 8.000 | 12.400 | 32.700 | 2.833 |  |
| app.input-to-commit | ms | warm | 900 | 20.600 | 43.800 | 71.100 | 249.800 | 26.561 | 0 of 1 |
| app.input-to-commit | ms | cold | 100 | 19.600 | 40.600 | 63.000 | 69.900 | 24.444 | 0 of 1 |
| app.input-to-commit [pose-only] | ms | warm | 900 | 20.600 | 43.800 | 71.100 | 249.800 | 26.561 |  |
| app.input-to-commit [pose-only] | ms | cold | 100 | 19.600 | 40.600 | 63.000 | 69.900 | 24.444 |  |
| app.input-to-dispatch | ms | warm | 900 | 16.600 | 38.600 | 61.800 | 172.100 | 21.424 | 0 of 1 |
| app.input-to-dispatch | ms | cold | 100 | 16.200 | 34.900 | 37.300 | 60.000 | 19.123 | 0 of 1 |
| app.input-to-dispatch [pose-only] | ms | warm | 900 | 16.600 | 38.600 | 61.800 | 172.100 | 21.424 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 100 | 16.200 | 34.900 | 37.300 | 60.000 | 19.123 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 900 | 15.700 | 20.500 | 36.100 | 172.100 | 13.784 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 99 | 15.600 | 24.600 | 33.100 | 33.100 | 13.821 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 900 | 15.700 | 20.500 | 36.100 | 172.100 | 13.784 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 99 | 15.600 | 24.600 | 33.100 | 33.100 | 13.821 |  |
| app.long-animation-frame | ms | warm | 8 | 111.300 | 178.700 | 178.700 | 178.700 | 114.213 | 1 of 1 |
| app.long-animation-frame | ms | cold | 4 | 56.600 | 108.200 | 108.200 | 108.200 | 71.750 | 1 of 1 |
| app.long-animation-frame.blocking | ms | warm | 8 | 59.300 | 108.100 | 108.100 | 108.100 | 55.513 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 4 | 0.000 | 48.100 | 48.100 | 48.100 | 14.950 | 1 of 1 |
| app.long-task | ms | warm | 2 | 98.000 | 155.000 | 155.000 | 155.000 | 126.500 | 1 of 1 |
| app.long-task | ms | cold | 1 | 56.000 | 56.000 | 56.000 | 56.000 | 56.000 | 1 of 1 |
| app.worker-compute-metric | ms | warm | 900 | 2.000 | 3.000 | 5.000 | 109.000 | 2.457 | 0 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 2.000 | 4.000 | 6.000 | 6.000 | 2.410 | 0 of 1 |
| app.worker-compute-metric [pose-only] | ms | warm | 900 | 2.000 | 3.000 | 5.000 | 109.000 | 2.457 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 2.000 | 4.000 | 6.000 | 6.000 | 2.410 |  |
| display.overlay-commit-to-frame-end | ms | warm | 900 | 13.700 | 17.400 | 32.100 | 45.000 | 13.387 | 0 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 13.700 | 16.700 | 37.100 | 54.800 | 13.815 | 0 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 900 | 13.700 | 17.400 | 32.100 | 45.000 | 13.387 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 13.700 | 16.700 | 37.100 | 54.800 | 13.815 |  |
| display.status-commit-to-frame-end | ms | warm | 900 | 13.200 | 17.100 | 30.500 | 43.400 | 12.535 | 0 of 1 |
| display.status-commit-to-frame-end | ms | cold | 100 | 13.200 | 16.500 | 31.800 | 45.600 | 12.849 | 0 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 900 | 13.200 | 17.100 | 30.500 | 43.400 | 12.535 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 13.200 | 16.500 | 31.800 | 45.600 | 12.849 |  |
| merge.handler | ms | warm | 3600 | 0.100 | 0.300 | 0.600 | 1.200 | 0.110 | 0 of 1 |
| merge.handler | ms | cold | 400 | 0.100 | 0.400 | 0.700 | 1.300 | 0.130 | 0 of 1 |
| merge.handler [pose-only] | ms | warm | 3600 | 0.100 | 0.300 | 0.600 | 1.200 | 0.110 |  |
| merge.handler [pose-only] | ms | cold | 400 | 0.100 | 0.400 | 0.700 | 1.300 | 0.130 |  |
| merge.reply-deserialize | ms | warm | 3600 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 | 0 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 | 0 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 3600 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 |  |
| queue.rate-limit-estimate | ms | warm | 900 | 0.000 | 36.933 | 51.233 | 52.433 | 7.640 | 1 of 1 |
| queue.rate-limit-estimate | ms | cold | 99 | 0.000 | 34.533 | 50.133 | 50.133 | 5.344 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 900 | 0.000 | 36.933 | 51.233 | 52.433 | 7.640 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 99 | 0.000 | 34.533 | 50.133 | 50.133 | 5.344 |  |
| shard.compute-reported | ms | warm | 3600 | 1.000 | 2.000 | 3.000 | 20.000 | 1.354 | 0 of 1 |
| shard.compute-reported | ms | cold | 400 | 1.000 | 3.000 | 3.000 | 4.000 | 1.472 | 0 of 1 |
| shard.compute-reported [pose-only] | ms | warm | 3600 | 1.000 | 2.000 | 3.000 | 20.000 | 1.354 |  |
| shard.compute-reported [pose-only] | ms | cold | 400 | 1.000 | 3.000 | 3.000 | 4.000 | 1.472 |  |
| shard.post | ms | warm | 3600 | 0.000 | 0.100 | 0.200 | 1.300 | 0.023 | 0 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.200 | 0.025 | 0 of 1 |
| shard.post [pose-only] | ms | warm | 3600 | 0.000 | 0.100 | 0.200 | 1.300 | 0.023 |  |
| shard.post [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.200 | 0.025 |  |
| shard.roundtrip | ms | warm | 3600 | 1.700 | 2.500 | 4.100 | 108.200 | 1.933 | 0 of 1 |
| shard.roundtrip | ms | cold | 400 | 1.700 | 3.300 | 4.500 | 5.200 | 1.852 | 0 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 3600 | 1.700 | 2.500 | 4.100 | 108.200 | 1.933 |  |
| shard.roundtrip [pose-only] | ms | cold | 400 | 1.700 | 3.300 | 4.500 | 5.200 | 1.852 |  |

## TS-W APP_H100_SWITCH pass=clean boundary=browser-app workers=not-applicable audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 1
Denominators: submitted=1000 coalesced=not-applicable dispatched=1000 completed=1000 accepted=1000 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | warm | 900 | 0.900 | 7.600 | 30.800 | 164.100 | 2.540 | 0 of 1 |
| accept.to-first-param | ms | cold | 100 | 0.800 | 7.300 | 10.800 | 37.100 | 1.969 | 0 of 1 |
| accept.to-first-param [pose-only] | ms | warm | 900 | 0.900 | 7.600 | 30.800 | 164.100 | 2.540 |  |
| accept.to-first-param [pose-only] | ms | cold | 100 | 0.800 | 7.300 | 10.800 | 37.100 | 1.969 |  |
| accept.to-overlay-commit | ms | warm | 900 | 0.800 | 2.700 | 4.100 | 38.400 | 1.173 | 0 of 1 |
| accept.to-overlay-commit | ms | cold | 100 | 0.800 | 2.700 | 3.700 | 4.700 | 1.117 | 0 of 1 |
| accept.to-overlay-commit [pose-only] | ms | warm | 900 | 0.800 | 2.700 | 4.100 | 38.400 | 1.173 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 0.800 | 2.700 | 3.700 | 4.700 | 1.117 |  |
| accept.to-status-commit | ms | warm | 900 | 1.800 | 10.900 | 54.600 | 204.000 | 4.096 | 0 of 1 |
| accept.to-status-commit | ms | cold | 100 | 1.500 | 9.800 | 13.900 | 39.500 | 3.094 | 0 of 1 |
| accept.to-status-commit [pose-only] | ms | warm | 900 | 1.800 | 10.900 | 54.600 | 204.000 | 4.096 |  |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 1.500 | 9.800 | 13.900 | 39.500 | 3.094 |  |
| app.input-to-commit | ms | warm | 900 | 21.200 | 49.400 | 112.600 | 306.500 | 28.381 | 0 of 1 |
| app.input-to-commit | ms | cold | 100 | 20.400 | 42.000 | 53.300 | 75.000 | 24.839 | 0 of 1 |
| app.input-to-commit [pose-only] | ms | warm | 900 | 21.200 | 49.400 | 112.600 | 306.500 | 28.381 |  |
| app.input-to-commit [pose-only] | ms | cold | 100 | 20.400 | 42.000 | 53.300 | 75.000 | 24.839 |  |
| app.input-to-dispatch | ms | warm | 900 | 16.700 | 36.900 | 59.500 | 211.800 | 21.533 | 0 of 1 |
| app.input-to-dispatch | ms | cold | 100 | 16.300 | 35.300 | 40.200 | 44.700 | 19.315 | 0 of 1 |
| app.input-to-dispatch [pose-only] | ms | warm | 900 | 16.700 | 36.900 | 59.500 | 211.800 | 21.533 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 100 | 16.300 | 35.300 | 40.200 | 44.700 | 19.315 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 900 | 15.700 | 26.967 | 41.900 | 191.967 | 14.377 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 99 | 15.800 | 19.900 | 35.000 | 35.000 | 13.818 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 900 | 15.700 | 26.967 | 41.900 | 191.967 | 14.377 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 99 | 15.800 | 19.900 | 35.000 | 35.000 | 13.818 |  |
| app.long-animation-frame | ms | warm | 32 | 82.300 | 197.600 | 215.800 | 215.800 | 96.297 | 1 of 1 |
| app.long-animation-frame | ms | cold | 2 | 61.800 | 110.800 | 110.800 | 110.800 | 86.300 | 1 of 1 |
| app.long-animation-frame.blocking | ms | warm | 32 | 21.300 | 127.100 | 145.400 | 145.400 | 37.466 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 2 | 11.000 | 48.100 | 48.100 | 48.100 | 29.550 | 1 of 1 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 3 | 0.000 | 32.900 | 32.900 | 32.900 | 10.967 | 1 of 1 |
| app.long-animation-frame.out-of-window | ms | cold | 3 | 79.600 | 85.100 | 85.100 | 85.100 | 76.700 | 1 of 1 |
| app.long-task | ms | warm | 13 | 80.000 | 205.000 | 205.000 | 205.000 | 98.154 | 1 of 1 |
| app.long-task | ms | cold | 1 | 120.000 | 120.000 | 120.000 | 120.000 | 120.000 | 1 of 1 |
| app.long-task.out-of-window | ms | cold | 2 | 51.000 | 82.000 | 82.000 | 82.000 | 66.500 | 1 of 1 |
| app.worker-compute-metric | ms | warm | 900 | 2.000 | 4.000 | 9.000 | 128.000 | 2.746 | 0 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 2.000 | 5.000 | 7.000 | 8.000 | 2.380 | 0 of 1 |
| app.worker-compute-metric [pose-only] | ms | warm | 900 | 2.000 | 4.000 | 9.000 | 128.000 | 2.746 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 2.000 | 5.000 | 7.000 | 8.000 | 2.380 |  |
| audio.apply-window | ms | warm | 900 | 0.100 | 0.400 | 0.600 | 1.100 | 0.109 | 0 of 1 |
| audio.apply-window | ms | cold | 100 | 0.100 | 0.500 | 0.700 | 1.200 | 0.122 | 0 of 1 |
| audio.apply-window [pose-only] | ms | warm | 900 | 0.100 | 0.400 | 0.600 | 1.100 | 0.109 |  |
| audio.apply-window [pose-only] | ms | cold | 100 | 0.100 | 0.500 | 0.700 | 1.200 | 0.122 |  |
| audio.param-call-total-ms | ms | warm | 900 | 0.000 | 0.200 | 0.400 | 0.500 | 0.048 | 0 of 1 |
| audio.param-call-total-ms | ms | cold | 100 | 0.000 | 0.200 | 0.300 | 0.500 | 0.044 | 0 of 1 |
| audio.param-call-total-ms [pose-only] | ms | warm | 900 | 0.000 | 0.200 | 0.400 | 0.500 | 0.048 |  |
| audio.param-call-total-ms [pose-only] | ms | cold | 100 | 0.000 | 0.200 | 0.300 | 0.500 | 0.044 |  |
| audio.param-ops | count | warm | 900 | 21.000 | 139.000 | 139.000 | 139.000 | 36.150 | 0 of 1 |
| audio.param-ops | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 0 of 1 |
| audio.param-ops [pose-only] | count | warm | 900 | 21.000 | 139.000 | 139.000 | 139.000 | 36.150 |  |
| audio.param-ops [pose-only] | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| display.overlay-commit-to-frame-end | ms | warm | 900 | 13.700 | 19.300 | 58.200 | 194.700 | 14.664 | 0 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 13.900 | 16.400 | 35.100 | 135.300 | 14.494 | 0 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 900 | 13.700 | 19.300 | 58.200 | 194.700 | 14.664 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 13.900 | 16.400 | 35.100 | 135.300 | 14.494 |  |
| display.status-commit-to-frame-end | ms | warm | 900 | 13.000 | 18.900 | 37.100 | 186.900 | 12.989 | 0 of 1 |
| display.status-commit-to-frame-end | ms | cold | 100 | 13.200 | 16.900 | 20.800 | 126.800 | 13.565 | 0 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 900 | 13.000 | 18.900 | 37.100 | 186.900 | 12.989 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 13.200 | 16.900 | 20.800 | 126.800 | 13.565 |  |
| merge.handler | ms | warm | 3600 | 0.100 | 0.400 | 0.700 | 2.400 | 0.120 | 0 of 1 |
| merge.handler | ms | cold | 400 | 0.100 | 0.300 | 0.600 | 1.000 | 0.109 | 0 of 1 |
| merge.handler [pose-only] | ms | warm | 3600 | 0.100 | 0.400 | 0.700 | 2.400 | 0.120 |  |
| merge.handler [pose-only] | ms | cold | 400 | 0.100 | 0.300 | 0.600 | 1.000 | 0.109 |  |
| merge.reply-deserialize | ms | warm | 3600 | 0.000 | 0.100 | 0.100 | 0.700 | 0.021 | 0 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.020 | 0 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 3600 | 0.000 | 0.100 | 0.100 | 0.700 | 0.021 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.020 |  |
| queue.rate-limit-estimate | ms | warm | 900 | 0.000 | 35.533 | 49.933 | 53.433 | 7.156 | 1 of 1 |
| queue.rate-limit-estimate | ms | cold | 99 | 0.000 | 34.733 | 39.733 | 39.733 | 5.391 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 900 | 0.000 | 35.533 | 49.933 | 53.433 | 7.156 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 99 | 0.000 | 34.733 | 39.733 | 39.733 | 5.391 |  |
| shard.compute-reported | ms | warm | 3600 | 1.000 | 2.000 | 3.000 | 19.000 | 1.396 | 0 of 1 |
| shard.compute-reported | ms | cold | 400 | 1.000 | 2.000 | 4.000 | 5.000 | 1.470 | 0 of 1 |
| shard.compute-reported [pose-only] | ms | warm | 3600 | 1.000 | 2.000 | 3.000 | 19.000 | 1.396 |  |
| shard.compute-reported [pose-only] | ms | cold | 400 | 1.000 | 2.000 | 4.000 | 5.000 | 1.470 |  |
| shard.post | ms | warm | 3600 | 0.000 | 0.100 | 0.200 | 0.500 | 0.024 | 0 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.019 | 0 of 1 |
| shard.post [pose-only] | ms | warm | 3600 | 0.000 | 0.100 | 0.200 | 0.500 | 0.024 |  |
| shard.post [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.019 |  |
| shard.roundtrip | ms | warm | 3600 | 1.700 | 3.100 | 7.300 | 127.800 | 2.178 | 0 of 1 |
| shard.roundtrip | ms | cold | 400 | 1.600 | 3.300 | 5.500 | 7.600 | 1.803 | 0 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 3600 | 1.700 | 3.100 | 7.300 | 127.800 | 2.178 |  |
| shard.roundtrip [pose-only] | ms | cold | 400 | 1.600 | 3.300 | 5.500 | 7.600 | 1.803 |  |

## TS-W APP_H100_SWITCH pass=clean boundary=browser-app workers=1 audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 1
Denominators: submitted=500 coalesced=not-applicable dispatched=500 completed=500 accepted=500 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | warm | 400 | 0.700 | 3.000 | 7.100 | 7.800 | 1.177 | 1 of 1 |
| accept.to-first-param | ms | cold | 100 | 0.900 | 3.500 | 7.600 | 7.900 | 1.443 | 1 of 1 |
| accept.to-first-param [pose-only] | ms | warm | 400 | 0.700 | 3.000 | 7.100 | 7.800 | 1.177 |  |
| accept.to-first-param [pose-only] | ms | cold | 100 | 0.900 | 3.500 | 7.600 | 7.900 | 1.443 |  |
| accept.to-overlay-commit | ms | warm | 400 | 0.700 | 2.300 | 3.000 | 3.900 | 0.945 | 1 of 1 |
| accept.to-overlay-commit | ms | cold | 100 | 0.800 | 2.400 | 2.900 | 4.800 | 1.091 | 1 of 1 |
| accept.to-overlay-commit [pose-only] | ms | warm | 400 | 0.700 | 2.300 | 3.000 | 3.900 | 0.945 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 0.800 | 2.400 | 2.900 | 4.800 | 1.091 |  |
| accept.to-status-commit | ms | warm | 400 | 1.400 | 6.300 | 9.700 | 17.100 | 2.203 | 1 of 1 |
| accept.to-status-commit | ms | cold | 100 | 2.100 | 9.100 | 9.900 | 9.900 | 2.717 | 1 of 1 |
| accept.to-status-commit [pose-only] | ms | warm | 400 | 1.400 | 6.300 | 9.700 | 17.100 | 2.203 |  |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 2.100 | 9.100 | 9.900 | 9.900 | 2.717 |  |
| app.input-to-commit | ms | warm | 400 | 23.900 | 40.500 | 83.500 | 157.500 | 26.810 | 1 of 1 |
| app.input-to-commit | ms | cold | 100 | 25.300 | 49.700 | 87.500 | 96.300 | 28.589 | 1 of 1 |
| app.input-to-commit [pose-only] | ms | warm | 400 | 23.900 | 40.500 | 83.500 | 157.500 | 26.810 |  |
| app.input-to-commit [pose-only] | ms | cold | 100 | 25.300 | 49.700 | 87.500 | 96.300 | 28.589 |  |
| app.input-to-dispatch | ms | warm | 400 | 16.400 | 30.900 | 41.800 | 91.700 | 18.327 | 1 of 1 |
| app.input-to-dispatch | ms | cold | 100 | 16.800 | 34.600 | 72.600 | 84.100 | 19.624 | 1 of 1 |
| app.input-to-dispatch [pose-only] | ms | warm | 400 | 16.400 | 30.900 | 41.800 | 91.700 | 18.327 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 100 | 16.800 | 34.600 | 72.600 | 84.100 | 19.624 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 400 | 16.000 | 20.000 | 30.900 | 91.700 | 15.597 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 99 | 16.100 | 22.300 | 84.100 | 84.100 | 16.406 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 400 | 16.000 | 20.000 | 30.900 | 91.700 | 15.597 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 99 | 16.100 | 22.300 | 84.100 | 84.100 | 16.406 |  |
| app.long-animation-frame | ms | warm | 4 | 60.500 | 91.500 | 91.500 | 91.500 | 67.425 | 1 of 1 |
| app.long-animation-frame.blocking | ms | warm | 4 | 2.400 | 10.100 | 10.100 | 10.100 | 4.975 | 1 of 1 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 1 | 32.500 | 32.500 | 32.500 | 32.500 | 32.500 | 1 of 1 |
| app.long-animation-frame.out-of-window | ms | cold | 1 | 85.700 | 85.700 | 85.700 | 85.700 | 85.700 | 1 of 1 |
| app.long-task | ms | warm | 1 | 56.000 | 56.000 | 56.000 | 56.000 | 56.000 | 1 of 1 |
| app.long-task.out-of-window | ms | cold | 1 | 81.000 | 81.000 | 81.000 | 81.000 | 81.000 | 1 of 1 |
| app.worker-compute-metric | ms | warm | 400 | 6.000 | 7.000 | 12.000 | 64.000 | 6.280 | 1 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 6.000 | 8.000 | 9.000 | 11.000 | 6.230 | 1 of 1 |
| app.worker-compute-metric [pose-only] | ms | warm | 400 | 6.000 | 7.000 | 12.000 | 64.000 | 6.280 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 6.000 | 8.000 | 9.000 | 11.000 | 6.230 |  |
| audio.apply-window | ms | warm | 400 | 0.100 | 0.300 | 0.600 | 0.700 | 0.091 | 1 of 1 |
| audio.apply-window | ms | cold | 100 | 0.100 | 0.400 | 0.600 | 0.800 | 0.122 | 1 of 1 |
| audio.apply-window [pose-only] | ms | warm | 400 | 0.100 | 0.300 | 0.600 | 0.700 | 0.091 |  |
| audio.apply-window [pose-only] | ms | cold | 100 | 0.100 | 0.400 | 0.600 | 0.800 | 0.122 |  |
| audio.callback-interval-mean | s | warm | 251 | 0.010 | 0.010 | 0.010 | 0.010 | 0.010 | 1 of 1 |
| audio.callback-interval-mean | s | cold | 67 | 0.010 | 0.010 | 0.010 | 0.010 | 0.010 | 1 of 1 |
| audio.param-call-total-ms | ms | warm | 400 | 0.000 | 0.200 | 0.300 | 0.500 | 0.037 | 1 of 1 |
| audio.param-call-total-ms | ms | cold | 100 | 0.000 | 0.200 | 0.300 | 0.600 | 0.056 | 1 of 1 |
| audio.param-call-total-ms [pose-only] | ms | warm | 400 | 0.000 | 0.200 | 0.300 | 0.500 | 0.037 |  |
| audio.param-call-total-ms [pose-only] | ms | cold | 100 | 0.000 | 0.200 | 0.300 | 0.600 | 0.056 |  |
| audio.param-ops | count | warm | 400 | 21.000 | 139.000 | 139.000 | 139.000 | 36.250 | 1 of 1 |
| audio.param-ops | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 1 of 1 |
| audio.param-ops [pose-only] | count | warm | 400 | 21.000 | 139.000 | 139.000 | 139.000 | 36.250 |  |
| audio.param-ops [pose-only] | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| audio.render-capacity | ratio | warm | 251 | 0.096 | 0.261 | 0.473 | 0.628 | 0.124 | 1 of 1 |
| audio.render-capacity | ratio | cold | 67 | 0.107 | 0.265 | 0.942 | 0.942 | 0.138 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | warm | 400 | 10.400 | 16.900 | 23.700 | 34.100 | 10.867 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 9.200 | 16.800 | 20.600 | 27.200 | 10.057 | 1 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 400 | 10.400 | 16.900 | 23.700 | 34.100 | 10.867 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 9.200 | 16.800 | 20.600 | 27.200 | 10.057 |  |
| display.status-commit-to-frame-end | ms | warm | 400 | 9.800 | 15.400 | 20.900 | 31.100 | 10.174 | 1 of 1 |
| display.status-commit-to-frame-end | ms | cold | 100 | 8.700 | 15.400 | 18.300 | 22.900 | 9.167 | 1 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 400 | 9.800 | 15.400 | 20.900 | 31.100 | 10.174 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 8.700 | 15.400 | 18.300 | 22.900 | 9.167 |  |
| merge.handler | ms | warm | 400 | 0.300 | 0.900 | 1.800 | 2.400 | 0.366 | 1 of 1 |
| merge.handler | ms | cold | 100 | 0.300 | 1.200 | 2.000 | 3.200 | 0.439 | 1 of 1 |
| merge.handler [pose-only] | ms | warm | 400 | 0.300 | 0.900 | 1.800 | 2.400 | 0.366 |  |
| merge.handler [pose-only] | ms | cold | 100 | 0.300 | 1.200 | 2.000 | 3.200 | 0.439 |  |
| merge.reply-deserialize | ms | warm | 400 | 0.000 | 0.200 | 0.200 | 0.400 | 0.049 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 0.200 | 0.049 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 400 | 0.000 | 0.200 | 0.200 | 0.400 | 0.049 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 0.200 | 0.049 |  |
| queue.rate-limit-estimate | ms | warm | 400 | 0.000 | 26.733 | 39.733 | 43.233 | 2.730 | 1 of 1 |
| queue.rate-limit-estimate | ms | cold | 99 | 0.000 | 31.533 | 43.133 | 43.133 | 3.219 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 400 | 0.000 | 26.733 | 39.733 | 43.233 | 2.730 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 99 | 0.000 | 31.533 | 43.133 | 43.133 | 3.219 |  |
| shard.compute-reported | ms | warm | 400 | 5.000 | 6.000 | 9.000 | 16.000 | 5.185 | 1 of 1 |
| shard.compute-reported | ms | cold | 100 | 6.000 | 7.000 | 8.000 | 9.000 | 5.420 | 1 of 1 |
| shard.compute-reported [pose-only] | ms | warm | 400 | 5.000 | 6.000 | 9.000 | 16.000 | 5.185 |  |
| shard.compute-reported [pose-only] | ms | cold | 100 | 6.000 | 7.000 | 8.000 | 9.000 | 5.420 |  |
| shard.post | ms | warm | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.033 | 1 of 1 |
| shard.post | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.200 | 0.037 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.033 |  |
| shard.post [pose-only] | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.200 | 0.037 |  |
| shard.roundtrip | ms | warm | 400 | 5.600 | 6.300 | 10.900 | 62.400 | 5.865 | 1 of 1 |
| shard.roundtrip | ms | cold | 100 | 5.900 | 7.500 | 7.900 | 9.800 | 5.760 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 400 | 5.600 | 6.300 | 10.900 | 62.400 | 5.865 |  |
| shard.roundtrip [pose-only] | ms | cold | 100 | 5.900 | 7.500 | 7.900 | 9.800 | 5.760 |  |

## TS-W APP_H100_SWITCH pass=clean boundary=browser-app workers=4 audio=off build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 1
Denominators: submitted=1000 coalesced=not-applicable dispatched=1000 completed=1000 accepted=1000 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-overlay-commit | ms | warm | 900 | 0.700 | 2.200 | 3.500 | 4.800 | 0.922 | 0 of 1 |
| accept.to-overlay-commit | ms | cold | 100 | 0.700 | 3.100 | 4.700 | 4.800 | 1.080 | 0 of 1 |
| accept.to-overlay-commit [pose-only] | ms | warm | 900 | 0.700 | 2.200 | 3.500 | 4.800 | 0.922 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 0.700 | 3.100 | 4.700 | 4.800 | 1.080 |  |
| accept.to-status-commit | ms | warm | 900 | 1.200 | 5.200 | 12.700 | 31.700 | 2.059 | 0 of 1 |
| accept.to-status-commit | ms | cold | 100 | 1.300 | 7.000 | 12.700 | 36.900 | 2.703 | 0 of 1 |
| accept.to-status-commit [pose-only] | ms | warm | 900 | 1.200 | 5.200 | 12.700 | 31.700 | 2.059 |  |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 1.300 | 7.000 | 12.700 | 36.900 | 2.703 |  |
| app.input-to-commit | ms | warm | 900 | 20.900 | 56.800 | 68.200 | 180.600 | 27.072 | 0 of 1 |
| app.input-to-commit | ms | cold | 100 | 22.100 | 45.700 | 62.100 | 70.800 | 28.303 | 0 of 1 |
| app.input-to-commit [pose-only] | ms | warm | 900 | 20.900 | 56.800 | 68.200 | 180.600 | 27.072 |  |
| app.input-to-commit [pose-only] | ms | cold | 100 | 22.100 | 45.700 | 62.100 | 70.800 | 28.303 |  |
| app.input-to-dispatch | ms | warm | 900 | 16.600 | 51.300 | 62.800 | 166.700 | 22.615 | 0 of 1 |
| app.input-to-dispatch | ms | cold | 100 | 17.000 | 39.200 | 54.400 | 56.000 | 22.785 | 0 of 1 |
| app.input-to-dispatch [pose-only] | ms | warm | 900 | 16.600 | 51.300 | 62.800 | 166.700 | 22.615 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 100 | 17.000 | 39.200 | 54.400 | 56.000 | 22.785 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 900 | 15.400 | 19.200 | 31.400 | 166.700 | 12.798 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 99 | 15.300 | 22.500 | 31.600 | 31.600 | 11.970 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 900 | 15.400 | 19.200 | 31.400 | 166.700 | 12.798 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 99 | 15.300 | 22.500 | 31.600 | 31.600 | 11.970 |  |
| app.long-animation-frame | ms | warm | 5 | 70.900 | 141.100 | 141.100 | 141.100 | 92.820 | 1 of 1 |
| app.long-animation-frame.blocking | ms | warm | 5 | 4.800 | 76.700 | 76.700 | 76.700 | 31.980 | 1 of 1 |
| app.long-task | ms | warm | 4 | 75.000 | 131.000 | 131.000 | 131.000 | 86.250 | 1 of 1 |
| app.worker-compute-metric | ms | warm | 900 | 2.000 | 3.000 | 5.000 | 47.000 | 2.393 | 0 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 2.000 | 4.000 | 5.000 | 29.000 | 2.790 | 0 of 1 |
| app.worker-compute-metric [pose-only] | ms | warm | 900 | 2.000 | 3.000 | 5.000 | 47.000 | 2.393 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 2.000 | 4.000 | 5.000 | 29.000 | 2.790 |  |
| display.overlay-commit-to-frame-end | ms | warm | 900 | 13.400 | 17.600 | 27.700 | 67.600 | 13.142 | 0 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 12.600 | 16.800 | 28.700 | 34.200 | 12.318 | 0 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 900 | 13.400 | 17.600 | 27.700 | 67.600 | 13.142 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 12.600 | 16.800 | 28.700 | 34.200 | 12.318 |  |
| display.status-commit-to-frame-end | ms | warm | 900 | 12.900 | 17.100 | 25.600 | 59.700 | 12.302 | 0 of 1 |
| display.status-commit-to-frame-end | ms | cold | 100 | 11.600 | 16.000 | 17.100 | 24.900 | 11.279 | 0 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 900 | 12.900 | 17.100 | 25.600 | 59.700 | 12.302 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 11.600 | 16.000 | 17.100 | 24.900 | 11.279 |  |
| merge.handler | ms | warm | 3600 | 0.100 | 0.300 | 0.500 | 1.500 | 0.101 | 0 of 1 |
| merge.handler | ms | cold | 400 | 0.100 | 0.300 | 0.500 | 0.900 | 0.114 | 0 of 1 |
| merge.handler [pose-only] | ms | warm | 3600 | 0.100 | 0.300 | 0.500 | 1.500 | 0.101 |  |
| merge.handler [pose-only] | ms | cold | 400 | 0.100 | 0.300 | 0.500 | 0.900 | 0.114 |  |
| merge.reply-deserialize | ms | warm | 3600 | 0.000 | 0.100 | 0.100 | 0.400 | 0.017 | 0 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.020 | 0 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 3600 | 0.000 | 0.100 | 0.100 | 0.400 | 0.017 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.020 |  |
| queue.rate-limit-estimate | ms | warm | 900 | 0.000 | 49.533 | 53.133 | 55.033 | 9.817 | 1 of 1 |
| queue.rate-limit-estimate | ms | cold | 99 | 0.000 | 39.333 | 51.633 | 51.633 | 10.883 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 900 | 0.000 | 49.533 | 53.133 | 55.033 | 9.817 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 99 | 0.000 | 39.333 | 51.633 | 51.633 | 10.883 |  |
| shard.compute-reported | ms | warm | 3600 | 1.000 | 2.000 | 2.000 | 5.000 | 1.410 | 0 of 1 |
| shard.compute-reported | ms | cold | 400 | 2.000 | 3.000 | 3.000 | 5.000 | 1.620 | 0 of 1 |
| shard.compute-reported [pose-only] | ms | warm | 3600 | 1.000 | 2.000 | 2.000 | 5.000 | 1.410 |  |
| shard.compute-reported [pose-only] | ms | cold | 400 | 2.000 | 3.000 | 3.000 | 5.000 | 1.620 |  |
| shard.post | ms | warm | 3600 | 0.000 | 0.100 | 0.100 | 0.300 | 0.024 | 0 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.500 | 0.019 | 0 of 1 |
| shard.post [pose-only] | ms | warm | 3600 | 0.000 | 0.100 | 0.100 | 0.300 | 0.024 |  |
| shard.post [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.500 | 0.019 |  |
| shard.roundtrip | ms | warm | 3600 | 1.800 | 2.500 | 3.700 | 47.200 | 1.946 | 0 of 1 |
| shard.roundtrip | ms | cold | 400 | 2.000 | 3.400 | 5.100 | 28.100 | 2.297 | 0 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 3600 | 1.800 | 2.500 | 3.700 | 47.200 | 1.946 |  |
| shard.roundtrip [pose-only] | ms | cold | 400 | 2.000 | 3.400 | 5.100 | 28.100 | 2.297 |  |

## TS-W APP_H100_SWITCH pass=clean boundary=browser-app workers=4 audio=on build=prod driver=poll browser-channel=chromium viewport=default browser-args=["--use-angle=d3d11","--enable-gpu-rasterization","--ignore-gpu-blocklist"]

Runs: 2
Denominators: submitted=1000 coalesced=not-applicable dispatched=1000 completed=1000 accepted=1000 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | warm | 800 | 0.700 | 4.200 | 10.300 | 71.700 | 1.541 | 2 of 2 |
| accept.to-first-param | ms | cold | 200 | 1.000 | 6.200 | 9.000 | 35.900 | 1.996 | 2 of 2 |
| accept.to-first-param [pose-only] | ms | warm | 800 | 0.700 | 4.200 | 10.300 | 71.700 | 1.541 |  |
| accept.to-first-param [pose-only] | ms | cold | 200 | 1.000 | 6.200 | 9.000 | 35.900 | 1.996 |  |
| accept.to-overlay-commit | ms | warm | 800 | 0.700 | 2.400 | 3.600 | 68.100 | 1.030 | 2 of 2 |
| accept.to-overlay-commit | ms | cold | 200 | 0.800 | 2.600 | 3.800 | 5.300 | 1.176 | 2 of 2 |
| accept.to-overlay-commit [pose-only] | ms | warm | 800 | 0.700 | 2.400 | 3.600 | 68.100 | 1.030 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 200 | 0.800 | 2.600 | 3.800 | 5.300 | 1.176 |  |
| accept.to-status-commit | ms | warm | 800 | 1.300 | 6.800 | 15.700 | 73.700 | 2.576 | 2 of 2 |
| accept.to-status-commit | ms | cold | 200 | 1.900 | 10.100 | 18.200 | 40.400 | 3.464 | 2 of 2 |
| accept.to-status-commit [pose-only] | ms | warm | 800 | 1.300 | 6.800 | 15.700 | 73.700 | 2.576 |  |
| accept.to-status-commit [pose-only] | ms | cold | 200 | 1.900 | 10.100 | 18.200 | 40.400 | 3.464 |  |
| app.input-to-commit | ms | warm | 800 | 22.000 | 56.900 | 68.900 | 251.700 | 28.182 | 2 of 2 |
| app.input-to-commit | ms | cold | 200 | 25.600 | 45.700 | 72.600 | 221.000 | 30.306 | 2 of 2 |
| app.input-to-commit [pose-only] | ms | warm | 800 | 22.000 | 56.900 | 68.900 | 251.700 | 28.182 |  |
| app.input-to-commit [pose-only] | ms | cold | 200 | 25.600 | 45.700 | 72.600 | 221.000 | 30.306 |  |
| app.input-to-dispatch | ms | warm | 800 | 17.000 | 52.600 | 63.700 | 107.600 | 23.141 | 2 of 2 |
| app.input-to-dispatch | ms | cold | 200 | 18.700 | 40.600 | 63.000 | 190.700 | 24.140 | 2 of 2 |
| app.input-to-dispatch [pose-only] | ms | warm | 800 | 17.000 | 52.600 | 63.700 | 107.600 | 23.141 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 200 | 18.700 | 40.600 | 63.000 | 190.700 | 24.140 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 800 | 15.500 | 19.400 | 31.300 | 96.567 | 12.484 | 2 of 2 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 198 | 15.200 | 20.100 | 30.400 | 183.667 | 12.115 | 2 of 2 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 800 | 15.500 | 19.400 | 31.300 | 96.567 | 12.484 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 198 | 15.200 | 20.100 | 30.400 | 183.667 | 12.115 |  |
| app.long-animation-frame | ms | warm | 7 | 81.000 | 118.300 | 118.300 | 118.300 | 82.386 | 2 of 2 |
| app.long-animation-frame | ms | cold | 2 | 55.300 | 160.900 | 160.900 | 160.900 | 108.100 | 2 of 2 |
| app.long-animation-frame.blocking | ms | warm | 7 | 18.700 | 64.000 | 64.000 | 64.000 | 27.743 | 2 of 2 |
| app.long-animation-frame.blocking | ms | cold | 2 | 0.000 | 109.100 | 109.100 | 109.100 | 54.550 | 2 of 2 |
| app.long-task | ms | warm | 3 | 103.000 | 115.000 | 115.000 | 115.000 | 92.667 | 2 of 2 |
| app.long-task | ms | cold | 1 | 148.000 | 148.000 | 148.000 | 148.000 | 148.000 | 2 of 2 |
| app.worker-compute-metric | ms | warm | 800 | 2.000 | 3.000 | 4.000 | 127.000 | 2.461 | 2 of 2 |
| app.worker-compute-metric | ms | cold | 200 | 2.000 | 4.000 | 6.000 | 12.000 | 2.675 | 2 of 2 |
| app.worker-compute-metric [pose-only] | ms | warm | 800 | 2.000 | 3.000 | 4.000 | 127.000 | 2.461 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 200 | 2.000 | 4.000 | 6.000 | 12.000 | 2.675 |  |
| audio.apply-window | ms | warm | 800 | 0.100 | 0.300 | 0.500 | 0.700 | 0.090 | 2 of 2 |
| audio.apply-window | ms | cold | 200 | 0.100 | 0.500 | 0.700 | 1.500 | 0.142 | 2 of 2 |
| audio.apply-window [pose-only] | ms | warm | 800 | 0.100 | 0.300 | 0.500 | 0.700 | 0.090 |  |
| audio.apply-window [pose-only] | ms | cold | 200 | 0.100 | 0.500 | 0.700 | 1.500 | 0.142 |  |
| audio.callback-interval-mean | s | warm | 426 | 0.010 | 0.010 | 0.011 | 0.011 | 0.010 | 2 of 2 |
| audio.callback-interval-mean | s | cold | 111 | 0.010 | 0.010 | 0.011 | 0.011 | 0.010 | 2 of 2 |
| audio.param-call-total-ms | ms | warm | 800 | 0.000 | 0.200 | 0.300 | 0.500 | 0.043 | 2 of 2 |
| audio.param-call-total-ms | ms | cold | 200 | 0.000 | 0.300 | 0.400 | 0.900 | 0.061 | 2 of 2 |
| audio.param-call-total-ms [pose-only] | ms | warm | 800 | 0.000 | 0.200 | 0.300 | 0.500 | 0.043 |  |
| audio.param-call-total-ms [pose-only] | ms | cold | 200 | 0.000 | 0.300 | 0.400 | 0.900 | 0.061 |  |
| audio.param-ops | count | warm | 800 | 21.000 | 139.000 | 139.000 | 139.000 | 36.250 | 2 of 2 |
| audio.param-ops | count | cold | 200 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 2 of 2 |
| audio.param-ops [pose-only] | count | warm | 800 | 21.000 | 139.000 | 139.000 | 139.000 | 36.250 |  |
| audio.param-ops [pose-only] | count | cold | 200 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| audio.render-capacity | ratio | warm | 426 | 0.093 | 0.292 | 0.647 | 0.994 | 0.127 | 2 of 2 |
| audio.render-capacity | ratio | cold | 111 | 0.113 | 0.304 | 0.986 | 0.995 | 0.149 | 2 of 2 |
| display.overlay-commit-to-frame-end | ms | warm | 800 | 13.100 | 17.100 | 27.600 | 49.900 | 12.735 | 2 of 2 |
| display.overlay-commit-to-frame-end | ms | cold | 200 | 11.300 | 16.700 | 29.200 | 45.800 | 11.810 | 2 of 2 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 800 | 13.100 | 17.100 | 27.600 | 49.900 | 12.735 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 200 | 11.300 | 16.700 | 29.200 | 45.800 | 11.810 |  |
| display.status-commit-to-frame-end | ms | warm | 800 | 12.300 | 16.600 | 23.500 | 109.400 | 11.889 | 2 of 2 |
| display.status-commit-to-frame-end | ms | cold | 200 | 10.400 | 16.000 | 27.100 | 32.900 | 10.695 | 2 of 2 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 800 | 12.300 | 16.600 | 23.500 | 109.400 | 11.889 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 200 | 10.400 | 16.000 | 27.100 | 32.900 | 10.695 |  |
| merge.handler | ms | warm | 3200 | 0.100 | 0.300 | 0.500 | 2.700 | 0.099 | 0 of 2 |
| merge.handler | ms | cold | 800 | 0.100 | 0.400 | 0.700 | 1.900 | 0.135 | 0 of 2 |
| merge.handler [pose-only] | ms | warm | 3200 | 0.100 | 0.300 | 0.500 | 2.700 | 0.099 |  |
| merge.handler [pose-only] | ms | cold | 800 | 0.100 | 0.400 | 0.700 | 1.900 | 0.135 |  |
| merge.reply-deserialize | ms | warm | 3200 | 0.000 | 0.100 | 0.100 | 0.500 | 0.017 | 0 of 2 |
| merge.reply-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.200 | 0.018 | 0 of 2 |
| merge.reply-deserialize [pose-only] | ms | warm | 3200 | 0.000 | 0.100 | 0.100 | 0.500 | 0.017 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.200 | 0.018 |  |
| queue.rate-limit-estimate | ms | warm | 800 | 0.000 | 50.733 | 52.233 | 54.033 | 10.657 | 2 of 2 |
| queue.rate-limit-estimate | ms | cold | 198 | 0.000 | 39.533 | 52.033 | 55.033 | 12.041 | 2 of 2 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 800 | 0.000 | 50.733 | 52.233 | 54.033 | 10.657 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 198 | 0.000 | 39.533 | 52.033 | 55.033 | 12.041 |  |
| shard.compute-reported | ms | warm | 3200 | 1.000 | 2.000 | 3.000 | 18.000 | 1.487 | 0 of 2 |
| shard.compute-reported | ms | cold | 800 | 2.000 | 3.000 | 4.000 | 4.000 | 1.656 | 0 of 2 |
| shard.compute-reported [pose-only] | ms | warm | 3200 | 1.000 | 2.000 | 3.000 | 18.000 | 1.487 |  |
| shard.compute-reported [pose-only] | ms | cold | 800 | 2.000 | 3.000 | 4.000 | 4.000 | 1.656 |  |
| shard.post | ms | warm | 3200 | 0.000 | 0.100 | 0.100 | 0.400 | 0.022 | 0 of 2 |
| shard.post | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.300 | 0.023 | 0 of 2 |
| shard.post [pose-only] | ms | warm | 3200 | 0.000 | 0.100 | 0.100 | 0.400 | 0.022 |  |
| shard.post [pose-only] | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.300 | 0.023 |  |
| shard.roundtrip | ms | warm | 3200 | 1.800 | 2.500 | 3.500 | 124.300 | 1.975 | 0 of 2 |
| shard.roundtrip | ms | cold | 800 | 2.000 | 3.200 | 4.700 | 9.900 | 2.100 | 0 of 2 |
| shard.roundtrip [pose-only] | ms | warm | 3200 | 1.800 | 2.500 | 3.500 | 124.300 | 1.975 |  |
| shard.roundtrip [pose-only] | ms | cold | 800 | 2.000 | 3.200 | 4.700 | 9.900 | 2.100 |  |

## TS-W APP_H100_SWITCH pass=clean boundary=browser-app workers=4 audio=on build=prod driver=poll browser-channel=chromium viewport=default browser-args=[]

Runs: 2
Denominators: submitted=1000 coalesced=not-applicable dispatched=1000 completed=1000 accepted=1000 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | warm | 800 | 0.900 | 5.600 | 11.500 | 229.300 | 2.208 | 2 of 2 |
| accept.to-first-param | ms | cold | 200 | 0.800 | 4.200 | 9.600 | 13.700 | 1.506 | 2 of 2 |
| accept.to-first-param [pose-only] | ms | warm | 800 | 0.900 | 5.600 | 11.500 | 229.300 | 2.208 |  |
| accept.to-first-param [pose-only] | ms | cold | 200 | 0.800 | 4.200 | 9.600 | 13.700 | 1.506 |  |
| accept.to-overlay-commit | ms | warm | 800 | 0.700 | 2.500 | 4.700 | 30.800 | 1.149 | 2 of 2 |
| accept.to-overlay-commit | ms | cold | 200 | 0.700 | 2.600 | 3.700 | 5.500 | 1.030 | 2 of 2 |
| accept.to-overlay-commit [pose-only] | ms | warm | 800 | 0.700 | 2.500 | 4.700 | 30.800 | 1.149 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 200 | 0.700 | 2.600 | 3.700 | 5.500 | 1.030 |  |
| accept.to-status-commit | ms | warm | 800 | 1.800 | 8.200 | 26.400 | 235.200 | 3.470 | 2 of 2 |
| accept.to-status-commit | ms | cold | 200 | 1.500 | 7.300 | 12.100 | 17.300 | 2.685 | 2 of 2 |
| accept.to-status-commit [pose-only] | ms | warm | 800 | 1.800 | 8.200 | 26.400 | 235.200 | 3.470 |  |
| accept.to-status-commit [pose-only] | ms | cold | 200 | 1.500 | 7.300 | 12.100 | 17.300 | 2.685 |  |
| app.input-to-commit | ms | warm | 800 | 23.400 | 58.600 | 98.900 | 282.700 | 30.293 | 2 of 2 |
| app.input-to-commit | ms | cold | 200 | 23.300 | 55.000 | 68.200 | 102.600 | 28.943 | 2 of 2 |
| app.input-to-commit [pose-only] | ms | warm | 800 | 23.400 | 58.600 | 98.900 | 282.700 | 30.293 |  |
| app.input-to-commit [pose-only] | ms | cold | 200 | 23.300 | 55.000 | 68.200 | 102.600 | 28.943 |  |
| app.input-to-dispatch | ms | warm | 800 | 17.600 | 53.200 | 65.100 | 224.000 | 24.046 | 2 of 2 |
| app.input-to-dispatch | ms | cold | 200 | 17.700 | 51.100 | 64.900 | 64.900 | 23.428 | 2 of 2 |
| app.input-to-dispatch [pose-only] | ms | warm | 800 | 17.600 | 53.200 | 65.100 | 224.000 | 24.046 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 200 | 17.700 | 51.100 | 64.900 | 64.900 | 23.428 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 800 | 15.300 | 21.100 | 43.800 | 195.667 | 12.721 | 2 of 2 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 198 | 15.100 | 19.900 | 32.400 | 51.100 | 11.620 | 2 of 2 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 800 | 15.300 | 21.100 | 43.800 | 195.667 | 12.721 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 198 | 15.100 | 19.900 | 32.400 | 51.100 | 11.620 |  |
| app.long-animation-frame | ms | warm | 11 | 55.400 | 205.600 | 205.600 | 205.600 | 94.091 | 2 of 2 |
| app.long-animation-frame.blocking | ms | warm | 11 | 0.000 | 154.000 | 154.000 | 154.000 | 39.273 | 2 of 2 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 3 | 0.200 | 119.400 | 119.400 | 119.400 | 39.867 | 1 of 2 |
| app.long-animation-frame.out-of-window | ms | cold | 3 | 64.900 | 173.400 | 173.400 | 173.400 | 97.533 | 1 of 2 |
| app.long-task | ms | warm | 4 | 75.000 | 206.000 | 206.000 | 206.000 | 125.500 | 2 of 2 |
| app.long-task.out-of-window | ms | cold | 1 | 166.000 | 166.000 | 166.000 | 166.000 | 166.000 | 1 of 2 |
| app.worker-compute-metric | ms | warm | 800 | 2.000 | 3.000 | 6.000 | 187.000 | 2.766 | 2 of 2 |
| app.worker-compute-metric | ms | cold | 200 | 2.000 | 4.000 | 5.000 | 44.000 | 2.800 | 2 of 2 |
| app.worker-compute-metric [pose-only] | ms | warm | 800 | 2.000 | 3.000 | 6.000 | 187.000 | 2.766 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 200 | 2.000 | 4.000 | 5.000 | 44.000 | 2.800 |  |
| audio.apply-window | ms | warm | 800 | 0.100 | 0.400 | 0.500 | 0.600 | 0.101 | 2 of 2 |
| audio.apply-window | ms | cold | 200 | 0.100 | 0.400 | 0.700 | 1.200 | 0.110 | 2 of 2 |
| audio.apply-window [pose-only] | ms | warm | 800 | 0.100 | 0.400 | 0.500 | 0.600 | 0.101 |  |
| audio.apply-window [pose-only] | ms | cold | 200 | 0.100 | 0.400 | 0.700 | 1.200 | 0.110 |  |
| audio.callback-interval-mean | s | warm | 426 | 0.010 | 0.010 | 0.011 | 0.011 | 0.010 | 2 of 2 |
| audio.callback-interval-mean | s | cold | 109 | 0.010 | 0.010 | 0.010 | 0.010 | 0.010 | 2 of 2 |
| audio.param-call-total-ms | ms | warm | 800 | 0.000 | 0.200 | 0.300 | 0.500 | 0.042 | 2 of 2 |
| audio.param-call-total-ms | ms | cold | 200 | 0.000 | 0.200 | 0.500 | 0.900 | 0.051 | 2 of 2 |
| audio.param-call-total-ms [pose-only] | ms | warm | 800 | 0.000 | 0.200 | 0.300 | 0.500 | 0.042 |  |
| audio.param-call-total-ms [pose-only] | ms | cold | 200 | 0.000 | 0.200 | 0.500 | 0.900 | 0.051 |  |
| audio.param-ops | count | warm | 800 | 21.000 | 139.000 | 139.000 | 139.000 | 36.250 | 2 of 2 |
| audio.param-ops | count | cold | 200 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 2 of 2 |
| audio.param-ops [pose-only] | count | warm | 800 | 21.000 | 139.000 | 139.000 | 139.000 | 36.250 |  |
| audio.param-ops [pose-only] | count | cold | 200 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| audio.render-capacity | ratio | warm | 426 | 0.104 | 0.358 | 0.967 | 0.994 | 0.149 | 2 of 2 |
| audio.render-capacity | ratio | cold | 109 | 0.097 | 0.242 | 0.452 | 0.713 | 0.122 | 2 of 2 |
| display.overlay-commit-to-frame-end | ms | warm | 800 | 12.700 | 17.600 | 32.100 | 216.900 | 13.013 | 2 of 2 |
| display.overlay-commit-to-frame-end | ms | cold | 200 | 12.700 | 17.500 | 19.500 | 21.900 | 12.363 | 2 of 2 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 800 | 12.700 | 17.600 | 32.100 | 216.900 | 13.013 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 200 | 12.700 | 17.500 | 19.500 | 21.900 | 12.363 |  |
| display.status-commit-to-frame-end | ms | warm | 800 | 11.700 | 16.700 | 19.700 | 42.800 | 11.426 | 2 of 2 |
| display.status-commit-to-frame-end | ms | cold | 200 | 12.100 | 16.400 | 17.800 | 21.200 | 11.450 | 2 of 2 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 800 | 11.700 | 16.700 | 19.700 | 42.800 | 11.426 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 200 | 12.100 | 16.400 | 17.800 | 21.200 | 11.450 |  |
| merge.handler | ms | warm | 3200 | 0.100 | 0.300 | 0.600 | 1.700 | 0.112 | 0 of 2 |
| merge.handler | ms | cold | 800 | 0.100 | 0.300 | 0.600 | 1.000 | 0.109 | 0 of 2 |
| merge.handler [pose-only] | ms | warm | 3200 | 0.100 | 0.300 | 0.600 | 1.700 | 0.112 |  |
| merge.handler [pose-only] | ms | cold | 800 | 0.100 | 0.300 | 0.600 | 1.000 | 0.109 |  |
| merge.reply-deserialize | ms | warm | 3200 | 0.000 | 0.100 | 0.100 | 0.300 | 0.018 | 0 of 2 |
| merge.reply-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 | 0 of 2 |
| merge.reply-deserialize [pose-only] | ms | warm | 3200 | 0.000 | 0.100 | 0.100 | 0.300 | 0.018 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 |  |
| queue.rate-limit-estimate | ms | warm | 800 | 0.000 | 50.133 | 52.333 | 54.933 | 11.326 | 2 of 2 |
| queue.rate-limit-estimate | ms | cold | 198 | 0.000 | 50.033 | 51.833 | 52.333 | 11.851 | 2 of 2 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 800 | 0.000 | 50.133 | 52.333 | 54.933 | 11.326 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 198 | 0.000 | 50.033 | 51.833 | 52.333 | 11.851 |  |
| shard.compute-reported | ms | warm | 3200 | 1.000 | 2.000 | 3.000 | 6.000 | 1.482 | 0 of 2 |
| shard.compute-reported | ms | cold | 800 | 2.000 | 3.000 | 4.000 | 4.000 | 1.635 | 0 of 2 |
| shard.compute-reported [pose-only] | ms | warm | 3200 | 1.000 | 2.000 | 3.000 | 6.000 | 1.482 |  |
| shard.compute-reported [pose-only] | ms | cold | 800 | 2.000 | 3.000 | 4.000 | 4.000 | 1.635 |  |
| shard.post | ms | warm | 3200 | 0.000 | 0.100 | 0.200 | 0.300 | 0.023 | 0 of 2 |
| shard.post | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.200 | 0.024 | 0 of 2 |
| shard.post [pose-only] | ms | warm | 3200 | 0.000 | 0.100 | 0.200 | 0.300 | 0.023 |  |
| shard.post [pose-only] | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.200 | 0.024 |  |
| shard.roundtrip | ms | warm | 3200 | 1.900 | 2.700 | 4.800 | 185.000 | 2.280 | 0 of 2 |
| shard.roundtrip | ms | cold | 800 | 2.000 | 3.300 | 4.100 | 43.700 | 2.254 | 0 of 2 |
| shard.roundtrip [pose-only] | ms | warm | 3200 | 1.900 | 2.700 | 4.800 | 185.000 | 2.280 |  |
| shard.roundtrip [pose-only] | ms | cold | 800 | 2.000 | 3.300 | 4.100 | 43.700 | 2.254 |  |

## TS-W APP_H100_SWITCH pass=clean boundary=browser-app workers=4 audio=on build=prod driver=poll browser-channel=default viewport=1920x1080 browser-args=[]

Runs: 2
Denominators: submitted=1000 coalesced=not-applicable dispatched=1000 completed=1000 accepted=1000 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | warm | 800 | 0.800 | 5.700 | 94.200 | 243.400 | 3.954 | 2 of 2 |
| accept.to-first-param | ms | cold | 200 | 0.900 | 14.100 | 75.600 | 301.400 | 5.428 | 2 of 2 |
| accept.to-first-param [pose-only] | ms | warm | 800 | 0.800 | 5.700 | 94.200 | 243.400 | 3.954 |  |
| accept.to-first-param [pose-only] | ms | cold | 200 | 0.900 | 14.100 | 75.600 | 301.400 | 5.428 |  |
| accept.to-overlay-commit | ms | warm | 800 | 0.700 | 2.800 | 5.200 | 90.200 | 1.199 | 2 of 2 |
| accept.to-overlay-commit | ms | cold | 200 | 0.800 | 3.500 | 13.400 | 18.500 | 1.314 | 2 of 2 |
| accept.to-overlay-commit [pose-only] | ms | warm | 800 | 0.700 | 2.800 | 5.200 | 90.200 | 1.199 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 200 | 0.800 | 3.500 | 13.400 | 18.500 | 1.314 |  |
| accept.to-status-commit | ms | warm | 800 | 1.300 | 9.800 | 98.600 | 272.500 | 5.499 | 2 of 2 |
| accept.to-status-commit | ms | cold | 200 | 1.600 | 18.500 | 185.000 | 307.900 | 8.418 | 2 of 2 |
| accept.to-status-commit [pose-only] | ms | warm | 800 | 1.300 | 9.800 | 98.600 | 272.500 | 5.499 |  |
| accept.to-status-commit [pose-only] | ms | cold | 200 | 1.600 | 18.500 | 185.000 | 307.900 | 8.418 |  |
| app.input-to-commit | ms | warm | 800 | 21.000 | 96.100 | 284.300 | 364.700 | 36.723 | 2 of 2 |
| app.input-to-commit | ms | cold | 200 | 21.500 | 127.600 | 318.600 | 378.400 | 41.604 | 2 of 2 |
| app.input-to-commit [pose-only] | ms | warm | 800 | 21.000 | 96.100 | 284.300 | 364.700 | 36.723 |  |
| app.input-to-commit [pose-only] | ms | cold | 200 | 21.500 | 127.600 | 318.600 | 378.400 | 41.604 |  |
| app.input-to-dispatch | ms | warm | 800 | 16.800 | 50.200 | 96.700 | 278.400 | 25.780 | 2 of 2 |
| app.input-to-dispatch | ms | cold | 200 | 16.500 | 51.600 | 148.300 | 224.600 | 26.479 | 2 of 2 |
| app.input-to-dispatch [pose-only] | ms | warm | 800 | 16.800 | 50.200 | 96.700 | 278.400 | 25.780 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 200 | 16.500 | 51.600 | 148.300 | 224.600 | 26.479 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 800 | 15.900 | 32.500 | 96.167 | 244.700 | 19.810 | 2 of 2 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 198 | 16.000 | 35.467 | 160.100 | 189.267 | 20.579 | 2 of 2 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 800 | 15.900 | 32.500 | 96.167 | 244.700 | 19.810 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 198 | 16.000 | 35.467 | 160.100 | 189.267 | 20.579 |  |
| app.long-animation-frame | ms | warm | 151 | 60.600 | 229.300 | 270.800 | 290.200 | 86.172 | 2 of 2 |
| app.long-animation-frame | ms | cold | 63 | 65.700 | 254.100 | 294.900 | 294.900 | 97.749 | 2 of 2 |
| app.long-animation-frame.blocking | ms | warm | 151 | 2.100 | 168.000 | 202.200 | 207.100 | 29.362 | 2 of 2 |
| app.long-animation-frame.blocking | ms | cold | 63 | 10.300 | 203.000 | 240.200 | 240.200 | 42.583 | 2 of 2 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 3 | 25.300 | 49.600 | 49.600 | 49.600 | 24.967 | 2 of 2 |
| app.long-animation-frame.out-of-window | ms | cold | 3 | 76.800 | 104.500 | 104.500 | 104.500 | 78.733 | 2 of 2 |
| app.long-task | ms | warm | 52 | 76.000 | 245.000 | 261.000 | 261.000 | 103.135 | 2 of 2 |
| app.long-task | ms | cold | 16 | 70.000 | 285.000 | 285.000 | 285.000 | 119.438 | 2 of 2 |
| app.long-task.out-of-window | ms | cold | 2 | 74.000 | 98.000 | 98.000 | 98.000 | 86.000 | 2 of 2 |
| app.worker-compute-metric | ms | warm | 800 | 2.000 | 6.000 | 73.000 | 243.000 | 5.451 | 2 of 2 |
| app.worker-compute-metric | ms | cold | 200 | 3.000 | 6.000 | 112.000 | 286.000 | 6.660 | 2 of 2 |
| app.worker-compute-metric [pose-only] | ms | warm | 800 | 2.000 | 6.000 | 73.000 | 243.000 | 5.451 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 200 | 3.000 | 6.000 | 112.000 | 286.000 | 6.660 |  |
| audio.apply-window | ms | warm | 800 | 0.100 | 0.300 | 0.500 | 7.900 | 0.089 | 2 of 2 |
| audio.apply-window | ms | cold | 200 | 0.100 | 0.600 | 1.100 | 2.100 | 0.139 | 2 of 2 |
| audio.apply-window [pose-only] | ms | warm | 800 | 0.100 | 0.300 | 0.500 | 7.900 | 0.089 |  |
| audio.apply-window [pose-only] | ms | cold | 200 | 0.100 | 0.600 | 1.100 | 2.100 | 0.139 |  |
| audio.callback-interval-mean | s | warm | 457 | 0.010 | 0.011 | 0.012 | 0.012 | 0.010 | 2 of 2 |
| audio.callback-interval-mean | s | cold | 125 | 0.010 | 0.011 | 0.011 | 0.012 | 0.010 | 2 of 2 |
| audio.param-call-total-ms | ms | warm | 800 | 0.000 | 0.100 | 0.300 | 7.000 | 0.042 | 2 of 2 |
| audio.param-call-total-ms | ms | cold | 200 | 0.000 | 0.200 | 0.700 | 0.900 | 0.057 | 2 of 2 |
| audio.param-call-total-ms [pose-only] | ms | warm | 800 | 0.000 | 0.100 | 0.300 | 7.000 | 0.042 |  |
| audio.param-call-total-ms [pose-only] | ms | cold | 200 | 0.000 | 0.200 | 0.700 | 0.900 | 0.057 |  |
| audio.param-ops | count | warm | 800 | 21.000 | 139.000 | 139.000 | 139.000 | 36.250 | 2 of 2 |
| audio.param-ops | count | cold | 200 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 2 of 2 |
| audio.param-ops [pose-only] | count | warm | 800 | 21.000 | 139.000 | 139.000 | 139.000 | 36.250 |  |
| audio.param-ops [pose-only] | count | cold | 200 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| audio.render-capacity | ratio | warm | 457 | 0.119 | 0.949 | 0.994 | 0.996 | 0.199 | 2 of 2 |
| audio.render-capacity | ratio | cold | 125 | 0.122 | 0.987 | 0.993 | 0.996 | 0.258 | 2 of 2 |
| display.overlay-commit-to-frame-end | ms | warm | 800 | 14.000 | 48.900 | 122.100 | 272.300 | 21.390 | 2 of 2 |
| display.overlay-commit-to-frame-end | ms | cold | 200 | 13.500 | 48.600 | 110.100 | 288.500 | 21.474 | 2 of 2 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 800 | 14.000 | 48.900 | 122.100 | 272.300 | 21.390 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 200 | 13.500 | 48.600 | 110.100 | 288.500 | 21.474 |  |
| display.status-commit-to-frame-end | ms | warm | 800 | 13.300 | 47.000 | 67.700 | 269.500 | 18.710 | 2 of 2 |
| display.status-commit-to-frame-end | ms | cold | 200 | 12.700 | 47.000 | 75.600 | 160.700 | 18.473 | 2 of 2 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 800 | 13.300 | 47.000 | 67.700 | 269.500 | 18.710 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 200 | 12.700 | 47.000 | 75.600 | 160.700 | 18.473 |  |
| merge.handler | ms | warm | 3200 | 0.100 | 0.300 | 0.700 | 2.900 | 0.107 | 0 of 2 |
| merge.handler | ms | cold | 800 | 0.100 | 0.500 | 1.300 | 4.400 | 0.159 | 0 of 2 |
| merge.handler [pose-only] | ms | warm | 3200 | 0.100 | 0.300 | 0.700 | 2.900 | 0.107 |  |
| merge.handler [pose-only] | ms | cold | 800 | 0.100 | 0.500 | 1.300 | 4.400 | 0.159 |  |
| merge.reply-deserialize | ms | warm | 3200 | 0.000 | 0.100 | 0.100 | 0.400 | 0.018 | 0 of 2 |
| merge.reply-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 1.100 | 0.024 | 0 of 2 |
| merge.reply-deserialize [pose-only] | ms | warm | 3200 | 0.000 | 0.100 | 0.100 | 0.400 | 0.018 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 1.100 | 0.024 |  |
| queue.rate-limit-estimate | ms | warm | 800 | 0.000 | 34.733 | 37.433 | 45.333 | 5.969 | 2 of 2 |
| queue.rate-limit-estimate | ms | cold | 198 | 0.000 | 35.233 | 38.433 | 43.733 | 5.986 | 2 of 2 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 800 | 0.000 | 34.733 | 37.433 | 45.333 | 5.969 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 198 | 0.000 | 35.233 | 38.433 | 43.733 | 5.986 |  |
| shard.compute-reported | ms | warm | 3200 | 2.000 | 2.000 | 6.000 | 19.000 | 1.630 | 0 of 2 |
| shard.compute-reported | ms | cold | 800 | 2.000 | 4.000 | 17.000 | 30.000 | 2.121 | 0 of 2 |
| shard.compute-reported [pose-only] | ms | warm | 3200 | 2.000 | 2.000 | 6.000 | 19.000 | 1.630 |  |
| shard.compute-reported [pose-only] | ms | cold | 800 | 2.000 | 4.000 | 17.000 | 30.000 | 2.121 |  |
| shard.post | ms | warm | 3200 | 0.000 | 0.100 | 0.300 | 1.600 | 0.025 | 0 of 2 |
| shard.post | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.900 | 0.025 | 0 of 2 |
| shard.post [pose-only] | ms | warm | 3200 | 0.000 | 0.100 | 0.300 | 1.600 | 0.025 |  |
| shard.post [pose-only] | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.900 | 0.025 |  |
| shard.roundtrip | ms | warm | 3200 | 1.900 | 4.300 | 71.500 | 242.000 | 4.469 | 0 of 2 |
| shard.roundtrip | ms | cold | 800 | 2.100 | 4.600 | 111.500 | 285.200 | 5.742 | 0 of 2 |
| shard.roundtrip [pose-only] | ms | warm | 3200 | 1.900 | 4.300 | 71.500 | 242.000 | 4.469 |  |
| shard.roundtrip [pose-only] | ms | cold | 800 | 2.100 | 4.600 | 111.500 | 285.200 | 5.742 |  |

## TS-W APP_H100_SWITCH pass=clean boundary=browser-app workers=4 audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 3
Denominators: submitted=2000 coalesced=not-applicable dispatched=2000 completed=2000 accepted=2000 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | warm | 1700 | 0.900 | 5.900 | 14.900 | 247.400 | 2.178 | 2 of 3 |
| accept.to-first-param | ms | cold | 300 | 0.900 | 6.300 | 48.200 | 79.000 | 2.957 | 2 of 3 |
| accept.to-first-param [pose-only] | ms | warm | 1700 | 0.900 | 5.900 | 14.900 | 247.400 | 2.178 |  |
| accept.to-first-param [pose-only] | ms | cold | 300 | 0.900 | 6.300 | 48.200 | 79.000 | 2.957 |  |
| accept.to-overlay-commit | ms | warm | 1700 | 0.800 | 2.600 | 4.100 | 61.200 | 1.152 | 2 of 3 |
| accept.to-overlay-commit | ms | cold | 300 | 0.800 | 3.000 | 5.000 | 56.800 | 1.413 | 2 of 3 |
| accept.to-overlay-commit [pose-only] | ms | warm | 1700 | 0.800 | 2.600 | 4.100 | 61.200 | 1.152 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 300 | 0.800 | 3.000 | 5.000 | 56.800 | 1.413 |  |
| accept.to-status-commit | ms | warm | 1700 | 1.800 | 9.200 | 33.200 | 252.900 | 3.419 | 2 of 3 |
| accept.to-status-commit | ms | cold | 300 | 1.700 | 11.300 | 56.900 | 107.300 | 4.469 | 2 of 3 |
| accept.to-status-commit [pose-only] | ms | warm | 1700 | 1.800 | 9.200 | 33.200 | 252.900 | 3.419 |  |
| accept.to-status-commit [pose-only] | ms | cold | 300 | 1.700 | 11.300 | 56.900 | 107.300 | 4.469 |  |
| app.input-to-commit | ms | warm | 1700 | 22.900 | 57.900 | 93.300 | 308.700 | 29.383 | 2 of 3 |
| app.input-to-commit | ms | cold | 300 | 23.900 | 56.200 | 144.500 | 291.600 | 31.366 | 2 of 3 |
| app.input-to-commit [pose-only] | ms | warm | 1700 | 22.900 | 57.900 | 93.300 | 308.700 | 29.383 |  |
| app.input-to-commit [pose-only] | ms | cold | 300 | 23.900 | 56.200 | 144.500 | 291.600 | 31.366 |  |
| app.input-to-dispatch | ms | warm | 1700 | 17.600 | 41.200 | 62.400 | 151.600 | 23.281 | 2 of 3 |
| app.input-to-dispatch | ms | cold | 300 | 17.700 | 45.200 | 64.100 | 198.500 | 23.975 | 2 of 3 |
| app.input-to-dispatch [pose-only] | ms | warm | 1700 | 17.600 | 41.200 | 62.400 | 151.600 | 23.281 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 300 | 17.700 | 45.200 | 64.100 | 198.500 | 23.975 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 1700 | 15.300 | 22.000 | 39.300 | 151.600 | 12.607 | 3 of 3 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 297 | 15.300 | 25.300 | 72.200 | 198.500 | 13.770 | 3 of 3 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 1700 | 15.300 | 22.000 | 39.300 | 151.600 | 12.607 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 297 | 15.300 | 25.300 | 72.200 | 198.500 | 13.770 |  |
| app.long-animation-frame | ms | warm | 29 | 63.800 | 147.400 | 230.700 | 230.700 | 80.476 | 3 of 3 |
| app.long-animation-frame | ms | cold | 8 | 67.800 | 156.500 | 156.500 | 156.500 | 82.262 | 3 of 3 |
| app.long-animation-frame.blocking | ms | warm | 29 | 6.000 | 83.400 | 172.200 | 172.200 | 24.072 | 3 of 3 |
| app.long-animation-frame.blocking | ms | cold | 8 | 11.900 | 105.300 | 105.300 | 105.300 | 25.675 | 3 of 3 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 3 | 13.000 | 24.600 | 24.600 | 24.600 | 16.400 | 3 of 3 |
| app.long-animation-frame.out-of-window | ms | cold | 3 | 64.400 | 76.200 | 76.200 | 76.200 | 68.300 | 3 of 3 |
| app.long-task | ms | warm | 11 | 95.000 | 223.000 | 223.000 | 223.000 | 96.818 | 3 of 3 |
| app.long-task | ms | cold | 5 | 68.000 | 146.000 | 146.000 | 146.000 | 79.400 | 3 of 3 |
| app.long-task.out-of-window | ms | cold | 3 | 62.000 | 74.000 | 74.000 | 74.000 | 65.667 | 3 of 3 |
| app.worker-compute-metric | ms | warm | 1700 | 2.000 | 3.000 | 7.000 | 119.000 | 2.672 | 2 of 3 |
| app.worker-compute-metric | ms | cold | 300 | 2.000 | 4.000 | 6.000 | 85.000 | 2.907 | 2 of 3 |
| app.worker-compute-metric [pose-only] | ms | warm | 1700 | 2.000 | 3.000 | 7.000 | 119.000 | 2.672 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 300 | 2.000 | 4.000 | 6.000 | 85.000 | 2.907 |  |
| audio.apply-window | ms | warm | 1700 | 0.100 | 0.400 | 0.500 | 1.000 | 0.099 | 2 of 3 |
| audio.apply-window | ms | cold | 300 | 0.100 | 0.400 | 0.900 | 1.500 | 0.128 | 2 of 3 |
| audio.apply-window [pose-only] | ms | warm | 1700 | 0.100 | 0.400 | 0.500 | 1.000 | 0.099 |  |
| audio.apply-window [pose-only] | ms | cold | 300 | 0.100 | 0.400 | 0.900 | 1.500 | 0.128 |  |
| audio.callback-interval-mean | s | warm | 910 | 0.010 | 0.010 | 0.011 | 0.012 | 0.010 | 3 of 3 |
| audio.callback-interval-mean | s | cold | 174 | 0.010 | 0.010 | 0.011 | 0.012 | 0.010 | 3 of 3 |
| audio.param-call-total-ms | ms | warm | 1700 | 0.000 | 0.200 | 0.300 | 0.600 | 0.046 | 2 of 3 |
| audio.param-call-total-ms | ms | cold | 300 | 0.000 | 0.200 | 0.600 | 0.700 | 0.052 | 2 of 3 |
| audio.param-call-total-ms [pose-only] | ms | warm | 1700 | 0.000 | 0.200 | 0.300 | 0.600 | 0.046 |  |
| audio.param-call-total-ms [pose-only] | ms | cold | 300 | 0.000 | 0.200 | 0.600 | 0.700 | 0.052 |  |
| audio.param-ops | count | warm | 1700 | 21.000 | 139.000 | 139.000 | 139.000 | 36.197 | 2 of 3 |
| audio.param-ops | count | cold | 300 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 2 of 3 |
| audio.param-ops [pose-only] | count | warm | 1700 | 21.000 | 139.000 | 139.000 | 139.000 | 36.197 |  |
| audio.param-ops [pose-only] | count | cold | 300 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| audio.render-capacity | ratio | warm | 910 | 0.112 | 0.398 | 0.987 | 0.995 | 0.157 | 3 of 3 |
| audio.render-capacity | ratio | cold | 174 | 0.109 | 0.472 | 0.974 | 0.985 | 0.165 | 3 of 3 |
| display.overlay-commit-to-frame-end | ms | warm | 1700 | 13.100 | 18.000 | 40.600 | 230.700 | 13.330 | 2 of 3 |
| display.overlay-commit-to-frame-end | ms | cold | 300 | 12.600 | 20.300 | 41.800 | 89.500 | 13.342 | 2 of 3 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 1700 | 13.100 | 18.000 | 40.600 | 230.700 | 13.330 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 300 | 12.600 | 20.300 | 41.800 | 89.500 | 13.342 |  |
| display.status-commit-to-frame-end | ms | warm | 1700 | 12.100 | 17.200 | 26.400 | 139.300 | 11.853 | 2 of 3 |
| display.status-commit-to-frame-end | ms | cold | 300 | 11.500 | 16.600 | 25.200 | 44.600 | 11.258 | 2 of 3 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 1700 | 12.100 | 17.200 | 26.400 | 139.300 | 11.853 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 300 | 11.500 | 16.600 | 25.200 | 44.600 | 11.258 |  |
| merge.handler | ms | warm | 6800 | 0.100 | 0.300 | 0.600 | 3.000 | 0.111 | 0 of 3 |
| merge.handler | ms | cold | 1200 | 0.100 | 0.400 | 0.700 | 3.200 | 0.134 | 0 of 3 |
| merge.handler [pose-only] | ms | warm | 6800 | 0.100 | 0.300 | 0.600 | 3.000 | 0.111 |  |
| merge.handler [pose-only] | ms | cold | 1200 | 0.100 | 0.400 | 0.700 | 3.200 | 0.134 |  |
| merge.reply-deserialize | ms | warm | 6800 | 0.000 | 0.100 | 0.100 | 0.400 | 0.018 | 0 of 3 |
| merge.reply-deserialize | ms | cold | 1200 | 0.000 | 0.100 | 0.200 | 0.300 | 0.020 | 0 of 3 |
| merge.reply-deserialize [pose-only] | ms | warm | 6800 | 0.000 | 0.100 | 0.100 | 0.400 | 0.018 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 1200 | 0.000 | 0.100 | 0.200 | 0.300 | 0.020 |  |
| queue.rate-limit-estimate | ms | warm | 1700 | 0.000 | 38.533 | 51.933 | 54.633 | 10.674 | 3 of 3 |
| queue.rate-limit-estimate | ms | cold | 297 | 0.000 | 38.233 | 51.733 | 52.633 | 10.268 | 3 of 3 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 1700 | 0.000 | 38.533 | 51.933 | 54.633 | 10.674 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 297 | 0.000 | 38.233 | 51.733 | 52.633 | 10.268 |  |
| shard.compute-reported | ms | warm | 6800 | 1.000 | 2.000 | 3.000 | 21.000 | 1.471 | 0 of 3 |
| shard.compute-reported | ms | cold | 1200 | 2.000 | 3.000 | 4.000 | 8.000 | 1.680 | 0 of 3 |
| shard.compute-reported [pose-only] | ms | warm | 6800 | 1.000 | 2.000 | 3.000 | 21.000 | 1.471 |  |
| shard.compute-reported [pose-only] | ms | cold | 1200 | 2.000 | 3.000 | 4.000 | 8.000 | 1.680 |  |
| shard.post | ms | warm | 6800 | 0.000 | 0.100 | 0.200 | 0.900 | 0.025 | 0 of 3 |
| shard.post | ms | cold | 1200 | 0.000 | 0.100 | 0.200 | 0.300 | 0.023 | 0 of 3 |
| shard.post [pose-only] | ms | warm | 6800 | 0.000 | 0.100 | 0.200 | 0.900 | 0.025 |  |
| shard.post [pose-only] | ms | cold | 1200 | 0.000 | 0.100 | 0.200 | 0.300 | 0.023 |  |
| shard.roundtrip | ms | warm | 6800 | 1.800 | 2.700 | 5.000 | 117.600 | 2.158 | 0 of 3 |
| shard.roundtrip | ms | cold | 1200 | 2.000 | 3.400 | 5.500 | 82.900 | 2.341 | 0 of 3 |
| shard.roundtrip [pose-only] | ms | warm | 6800 | 1.800 | 2.700 | 5.000 | 117.600 | 2.158 |  |
| shard.roundtrip [pose-only] | ms | cold | 1200 | 2.000 | 3.400 | 5.500 | 82.900 | 2.341 |  |

## TS-W APP_H100_SWITCH pass=stock boundary=browser-app workers=not-applicable audio=on build=prod driver=stock-poll browser-channel=default viewport=default browser-args=[]

Runs: 3
Denominators: submitted=72 coalesced=not-applicable dispatched=not-applicable completed=72 accepted=72 stale=not-applicable fallback=not-applicable error=not-applicable timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| app.worker-compute-metric | ms | cold | 72 | 3.000 | 5.000 | 101.000 | 101.000 | 4.333 | 3 of 3 |

## TS-W APP_H100_SWITCH pass=stock boundary=browser-app workers=not-applicable audio=on build=prod driver=stock-poll browser-channel=not-applicable viewport=not-applicable browser-args="not-applicable"

Runs: 5
Denominators: submitted=120 coalesced=not-applicable dispatched=not-applicable completed=120 accepted=120 stale=not-applicable fallback=not-applicable error=not-applicable timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| app.worker-compute-metric | ms | cold | 120 | 3.000 | 5.000 | 5.000 | 6.000 | 3.075 | 5 of 5 |

## TS-W APP_H100_SWITCH pass=traced boundary=browser-app workers=not-applicable audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 2
Denominators: submitted=400 coalesced=not-applicable dispatched=400 completed=400 accepted=400 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | warm | 200 | 1.200 | 10.100 | 62.700 | 125.100 | 4.361 | 2 of 2 |
| accept.to-first-param | ms | cold | 200 | 1.400 | 33.300 | 55.500 | 66.000 | 4.913 | 2 of 2 |
| accept.to-first-param [pose-only] | ms | warm | 200 | 1.200 | 10.100 | 62.700 | 125.100 | 4.361 |  |
| accept.to-first-param [pose-only] | ms | cold | 200 | 1.400 | 33.300 | 55.500 | 66.000 | 4.913 |  |
| accept.to-overlay-commit | ms | warm | 200 | 1.100 | 3.800 | 6.300 | 14.200 | 1.552 | 2 of 2 |
| accept.to-overlay-commit | ms | cold | 200 | 1.200 | 4.200 | 10.400 | 19.100 | 1.720 | 2 of 2 |
| accept.to-overlay-commit [pose-only] | ms | warm | 200 | 1.100 | 3.800 | 6.300 | 14.200 | 1.552 |  |
| accept.to-overlay-commit [pose-only] | ms | cold | 200 | 1.200 | 4.200 | 10.400 | 19.100 | 1.720 |  |
| accept.to-status-commit | ms | warm | 200 | 2.200 | 33.200 | 68.700 | 171.200 | 6.733 | 2 of 2 |
| accept.to-status-commit | ms | cold | 200 | 2.400 | 44.700 | 64.400 | 71.800 | 6.919 | 2 of 2 |
| accept.to-status-commit [pose-only] | ms | warm | 200 | 2.200 | 33.200 | 68.700 | 171.200 | 6.733 |  |
| accept.to-status-commit [pose-only] | ms | cold | 200 | 2.400 | 44.700 | 64.400 | 71.800 | 6.919 |  |
| app.input-to-commit | ms | warm | 200 | 21.900 | 101.800 | 265.600 | 343.400 | 37.186 | 2 of 2 |
| app.input-to-commit | ms | cold | 200 | 23.300 | 114.000 | 202.300 | 340.300 | 36.280 | 2 of 2 |
| app.input-to-commit [pose-only] | ms | warm | 200 | 21.900 | 101.800 | 265.600 | 343.400 | 37.186 |  |
| app.input-to-commit [pose-only] | ms | cold | 200 | 23.300 | 114.000 | 202.300 | 340.300 | 36.280 |  |
| app.input-to-dispatch | ms | warm | 200 | 17.000 | 44.700 | 208.600 | 235.100 | 26.437 | 2 of 2 |
| app.input-to-dispatch | ms | cold | 200 | 16.900 | 50.300 | 136.000 | 247.200 | 24.609 | 2 of 2 |
| app.input-to-dispatch [pose-only] | ms | warm | 200 | 17.000 | 44.700 | 208.600 | 235.100 | 26.437 |  |
| app.input-to-dispatch [pose-only] | ms | cold | 200 | 16.900 | 50.300 | 136.000 | 247.200 | 24.609 |  |
| app.input-to-dispatch-minus-rate-limit | ms | warm | 200 | 16.000 | 43.600 | 208.600 | 235.100 | 19.558 | 2 of 2 |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 198 | 15.800 | 50.300 | 138.100 | 247.200 | 17.862 | 2 of 2 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | warm | 200 | 16.000 | 43.600 | 208.600 | 235.100 | 19.558 |  |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 198 | 15.800 | 50.300 | 138.100 | 247.200 | 17.862 |  |
| app.long-animation-frame | ms | warm | 20 | 58.800 | 228.000 | 236.800 | 236.800 | 97.650 | 2 of 2 |
| app.long-animation-frame | ms | cold | 20 | 59.700 | 118.700 | 224.900 | 224.900 | 73.810 | 2 of 2 |
| app.long-animation-frame.blocking | ms | warm | 20 | 3.200 | 170.600 | 184.900 | 184.900 | 39.690 | 2 of 2 |
| app.long-animation-frame.blocking | ms | cold | 20 | 0.000 | 64.700 | 168.200 | 168.200 | 17.510 | 2 of 2 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 4 | 0.000 | 49.600 | 49.600 | 49.600 | 19.500 | 2 of 2 |
| app.long-animation-frame.out-of-window | ms | cold | 4 | 79.100 | 228.400 | 228.400 | 228.400 | 116.025 | 2 of 2 |
| app.long-task | ms | warm | 9 | 102.000 | 214.000 | 214.000 | 214.000 | 113.889 | 2 of 2 |
| app.long-task | ms | cold | 8 | 57.000 | 179.000 | 179.000 | 179.000 | 79.750 | 2 of 2 |
| app.long-task.out-of-window | ms | cold | 2 | 77.000 | 98.000 | 98.000 | 98.000 | 87.500 | 2 of 2 |
| app.worker-compute-metric | ms | warm | 200 | 2.000 | 6.000 | 44.000 | 273.000 | 4.005 | 2 of 2 |
| app.worker-compute-metric | ms | cold | 200 | 2.000 | 7.000 | 67.000 | 104.000 | 4.695 | 2 of 2 |
| app.worker-compute-metric [pose-only] | ms | warm | 200 | 2.000 | 6.000 | 44.000 | 273.000 | 4.005 |  |
| app.worker-compute-metric [pose-only] | ms | cold | 200 | 2.000 | 7.000 | 67.000 | 104.000 | 4.695 |  |
| audio.apply-window | ms | warm | 200 | 0.100 | 0.300 | 0.800 | 9.200 | 0.146 | 2 of 2 |
| audio.apply-window | ms | cold | 200 | 0.100 | 0.400 | 1.100 | 2.200 | 0.140 | 2 of 2 |
| audio.apply-window [pose-only] | ms | warm | 200 | 0.100 | 0.300 | 0.800 | 9.200 | 0.146 |  |
| audio.apply-window [pose-only] | ms | cold | 200 | 0.100 | 0.400 | 1.100 | 2.200 | 0.140 |  |
| audio.param-call-total-ms | ms | warm | 200 | 0.000 | 0.200 | 0.500 | 6.000 | 0.069 | 2 of 2 |
| audio.param-call-total-ms | ms | cold | 200 | 0.000 | 0.200 | 0.500 | 1.000 | 0.060 | 2 of 2 |
| audio.param-call-total-ms [pose-only] | ms | warm | 200 | 0.000 | 0.200 | 0.500 | 6.000 | 0.069 |  |
| audio.param-call-total-ms [pose-only] | ms | cold | 200 | 0.000 | 0.200 | 0.500 | 1.000 | 0.060 |  |
| audio.param-ops | count | warm | 200 | 21.000 | 139.000 | 139.000 | 139.000 | 35.350 | 2 of 2 |
| audio.param-ops | count | cold | 200 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 2 of 2 |
| audio.param-ops [pose-only] | count | warm | 200 | 21.000 | 139.000 | 139.000 | 139.000 | 35.350 |  |
| audio.param-ops [pose-only] | count | cold | 200 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| display.overlay-commit-to-frame-end | ms | warm | 200 | 13.900 | 40.100 | 60.600 | 135.800 | 16.060 | 2 of 2 |
| display.overlay-commit-to-frame-end | ms | cold | 200 | 13.700 | 38.400 | 52.900 | 63.900 | 15.047 | 2 of 2 |
| display.overlay-commit-to-frame-end [pose-only] | ms | warm | 200 | 13.900 | 40.100 | 60.600 | 135.800 | 16.060 |  |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 200 | 13.700 | 38.400 | 52.900 | 63.900 | 15.047 |  |
| display.status-commit-to-frame-end | ms | warm | 200 | 12.400 | 20.900 | 38.400 | 47.900 | 12.370 | 2 of 2 |
| display.status-commit-to-frame-end | ms | cold | 200 | 12.500 | 24.600 | 32.700 | 59.500 | 12.243 | 2 of 2 |
| display.status-commit-to-frame-end [pose-only] | ms | warm | 200 | 12.400 | 20.900 | 38.400 | 47.900 | 12.370 |  |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 200 | 12.500 | 24.600 | 32.700 | 59.500 | 12.243 |  |
| merge.handler | ms | warm | 800 | 0.100 | 0.500 | 0.900 | 1.500 | 0.151 | 2 of 2 |
| merge.handler | ms | cold | 800 | 0.100 | 0.500 | 1.100 | 12.500 | 0.185 | 2 of 2 |
| merge.handler [pose-only] | ms | warm | 800 | 0.100 | 0.500 | 0.900 | 1.500 | 0.151 |  |
| merge.handler [pose-only] | ms | cold | 800 | 0.100 | 0.500 | 1.100 | 12.500 | 0.185 |  |
| merge.reply-deserialize | ms | warm | 800 | 0.000 | 0.100 | 0.200 | 0.400 | 0.028 | 2 of 2 |
| merge.reply-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 1.000 | 0.028 | 2 of 2 |
| merge.reply-deserialize [pose-only] | ms | warm | 800 | 0.000 | 0.100 | 0.200 | 0.400 | 0.028 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 1.000 | 0.028 |  |
| queue.rate-limit-estimate | ms | warm | 200 | 0.000 | 34.533 | 36.133 | 38.533 | 6.879 | 2 of 2 |
| queue.rate-limit-estimate | ms | cold | 198 | 0.000 | 34.133 | 50.033 | 50.533 | 6.746 | 2 of 2 |
| queue.rate-limit-estimate [pose-only] | ms | warm | 200 | 0.000 | 34.533 | 36.133 | 38.533 | 6.879 |  |
| queue.rate-limit-estimate [pose-only] | ms | cold | 198 | 0.000 | 34.133 | 50.033 | 50.533 | 6.746 |  |
| shard.compute-reported | ms | warm | 800 | 1.000 | 3.000 | 5.000 | 50.000 | 1.241 | 2 of 2 |
| shard.compute-reported | ms | cold | 800 | 1.000 | 3.000 | 6.000 | 11.000 | 1.226 | 2 of 2 |
| shard.compute-reported [pose-only] | ms | warm | 800 | 1.000 | 3.000 | 5.000 | 50.000 | 1.241 |  |
| shard.compute-reported [pose-only] | ms | cold | 800 | 1.000 | 3.000 | 6.000 | 11.000 | 1.226 |  |
| shard.post | ms | warm | 800 | 0.000 | 0.100 | 0.300 | 0.600 | 0.028 | 2 of 2 |
| shard.post | ms | cold | 800 | 0.000 | 0.100 | 0.300 | 0.900 | 0.028 | 2 of 2 |
| shard.post [pose-only] | ms | warm | 800 | 0.000 | 0.100 | 0.300 | 0.600 | 0.028 |  |
| shard.post [pose-only] | ms | cold | 800 | 0.000 | 0.100 | 0.300 | 0.900 | 0.028 |  |
| shard.roundtrip | ms | warm | 800 | 1.100 | 4.500 | 42.700 | 271.400 | 2.986 | 2 of 2 |
| shard.roundtrip | ms | cold | 800 | 1.300 | 5.000 | 64.500 | 102.100 | 3.403 | 2 of 2 |
| shard.roundtrip [pose-only] | ms | warm | 800 | 1.100 | 4.500 | 42.700 | 271.400 | 2.986 |  |
| shard.roundtrip [pose-only] | ms | cold | 800 | 1.300 | 5.000 | 64.500 | 102.100 | 3.403 |  |

## TS-W APP_H100_SWITCH pass=traced boundary=browser-app workers=4 audio=on build=prod driver=poll browser-channel=chromium viewport=default browser-args=["--use-angle=d3d11","--enable-gpu-rasterization","--ignore-gpu-blocklist"]

Runs: 1
Denominators: submitted=100 coalesced=not-applicable dispatched=100 completed=100 accepted=100 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | cold | 100 | 1.000 | 6.300 | 11.800 | 41.000 | 2.093 | 1 of 1 |
| accept.to-first-param [pose-only] | ms | cold | 100 | 1.000 | 6.300 | 11.800 | 41.000 | 2.093 |  |
| accept.to-overlay-commit | ms | cold | 100 | 0.900 | 2.800 | 5.600 | 10.600 | 1.258 | 1 of 1 |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 0.900 | 2.800 | 5.600 | 10.600 | 1.258 |  |
| accept.to-status-commit | ms | cold | 100 | 1.800 | 10.600 | 37.700 | 44.000 | 3.535 | 1 of 1 |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 1.800 | 10.600 | 37.700 | 44.000 | 3.535 |  |
| app.input-to-commit | ms | cold | 100 | 19.500 | 42.700 | 138.200 | 155.100 | 26.617 | 1 of 1 |
| app.input-to-commit [pose-only] | ms | cold | 100 | 19.500 | 42.700 | 138.200 | 155.100 | 26.617 |  |
| app.input-to-dispatch | ms | cold | 100 | 16.100 | 34.300 | 50.400 | 56.300 | 19.703 | 1 of 1 |
| app.input-to-dispatch [pose-only] | ms | cold | 100 | 16.100 | 34.300 | 50.400 | 56.300 | 19.703 |  |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 99 | 15.800 | 28.200 | 56.300 | 56.300 | 14.630 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 99 | 15.800 | 28.200 | 56.300 | 56.300 | 14.630 |  |
| app.long-animation-frame | ms | cold | 4 | 57.200 | 75.600 | 75.600 | 75.600 | 60.325 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 4 | 0.000 | 14.100 | 14.100 | 14.100 | 5.200 | 1 of 1 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 2 | 0.000 | 4.400 | 4.400 | 4.400 | 2.200 | 1 of 1 |
| app.long-animation-frame.out-of-window | ms | cold | 2 | 54.800 | 269.800 | 269.800 | 269.800 | 162.300 | 1 of 1 |
| app.long-task.out-of-window | ms | cold | 1 | 54.000 | 54.000 | 54.000 | 54.000 | 54.000 | 1 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 2.000 | 5.000 | 62.000 | 81.000 | 3.410 | 1 of 1 |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 2.000 | 5.000 | 62.000 | 81.000 | 3.410 |  |
| audio.apply-window | ms | cold | 100 | 0.100 | 0.300 | 0.500 | 1.400 | 0.103 | 1 of 1 |
| audio.apply-window [pose-only] | ms | cold | 100 | 0.100 | 0.300 | 0.500 | 1.400 | 0.103 |  |
| audio.callback-interval-mean | s | cold | 63 | 0.010 | 0.010 | 0.010 | 0.010 | 0.010 | 1 of 1 |
| audio.param-call-total-ms | ms | cold | 100 | 0.000 | 0.200 | 0.300 | 1.100 | 0.045 | 1 of 1 |
| audio.param-call-total-ms [pose-only] | ms | cold | 100 | 0.000 | 0.200 | 0.300 | 1.100 | 0.045 |  |
| audio.param-ops | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 1 of 1 |
| audio.param-ops [pose-only] | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| audio.render-capacity | ratio | cold | 63 | 0.112 | 0.390 | 0.981 | 0.981 | 0.160 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 13.900 | 18.700 | 35.800 | 37.800 | 13.782 | 1 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 13.900 | 18.700 | 35.800 | 37.800 | 13.782 |  |
| display.status-commit-to-frame-end | ms | cold | 100 | 12.900 | 15.000 | 20.300 | 26.900 | 12.108 | 1 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 12.900 | 15.000 | 20.300 | 26.900 | 12.108 |  |
| merge.handler | ms | cold | 400 | 0.100 | 0.400 | 0.700 | 1.100 | 0.127 | 1 of 1 |
| merge.handler [pose-only] | ms | cold | 400 | 0.100 | 0.400 | 0.700 | 1.100 | 0.127 |  |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.023 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.023 |  |
| queue.rate-limit-estimate | ms | cold | 99 | 0.000 | 32.633 | 34.033 | 34.033 | 5.119 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | cold | 99 | 0.000 | 32.633 | 34.033 | 34.033 | 5.119 |  |
| shard.compute-reported | ms | cold | 400 | 1.000 | 2.000 | 5.000 | 11.000 | 1.010 | 1 of 1 |
| shard.compute-reported [pose-only] | ms | cold | 400 | 1.000 | 2.000 | 5.000 | 11.000 | 1.010 |  |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 1.100 | 0.023 | 1 of 1 |
| shard.post [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 1.100 | 0.023 |  |
| shard.roundtrip | ms | cold | 400 | 1.100 | 3.200 | 60.700 | 79.900 | 2.515 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | cold | 400 | 1.100 | 3.200 | 60.700 | 79.900 | 2.515 |  |

## TS-W APP_H100_SWITCH pass=traced boundary=browser-app workers=4 audio=on build=prod driver=poll browser-channel=chromium viewport=default browser-args=[]

Runs: 1
Denominators: submitted=100 coalesced=not-applicable dispatched=100 completed=100 accepted=100 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | cold | 100 | 1.100 | 6.300 | 32.900 | 44.300 | 2.450 | 1 of 1 |
| accept.to-first-param [pose-only] | ms | cold | 100 | 1.100 | 6.300 | 32.900 | 44.300 | 2.450 |  |
| accept.to-overlay-commit | ms | cold | 100 | 1.000 | 2.200 | 4.800 | 8.200 | 1.209 | 1 of 1 |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 1.000 | 2.200 | 4.800 | 8.200 | 1.209 |  |
| accept.to-status-commit | ms | cold | 100 | 1.900 | 10.400 | 35.200 | 49.000 | 3.735 | 1 of 1 |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 1.900 | 10.400 | 35.200 | 49.000 | 3.735 |  |
| app.input-to-commit | ms | cold | 100 | 20.100 | 42.500 | 117.800 | 126.900 | 27.018 | 1 of 1 |
| app.input-to-commit [pose-only] | ms | cold | 100 | 20.100 | 42.500 | 117.800 | 126.900 | 27.018 |  |
| app.input-to-dispatch | ms | cold | 100 | 15.900 | 35.900 | 42.100 | 48.400 | 19.739 | 1 of 1 |
| app.input-to-dispatch [pose-only] | ms | cold | 100 | 15.900 | 35.900 | 42.100 | 48.400 | 19.739 |  |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 99 | 15.500 | 30.500 | 48.400 | 48.400 | 13.611 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 99 | 15.500 | 30.500 | 48.400 | 48.400 | 13.611 |  |
| app.long-animation-frame | ms | cold | 2 | 51.100 | 53.300 | 53.300 | 53.300 | 52.200 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 1 of 1 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 1 | 19.700 | 19.700 | 19.700 | 19.700 | 19.700 | 1 of 1 |
| app.long-animation-frame.out-of-window | ms | cold | 1 | 71.300 | 71.300 | 71.300 | 71.300 | 71.300 | 1 of 1 |
| app.long-task.out-of-window | ms | cold | 1 | 69.000 | 69.000 | 69.000 | 69.000 | 69.000 | 1 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 2.000 | 5.000 | 51.000 | 56.000 | 3.390 | 1 of 1 |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 2.000 | 5.000 | 51.000 | 56.000 | 3.390 |  |
| audio.apply-window | ms | cold | 100 | 0.100 | 0.400 | 0.600 | 0.900 | 0.110 | 1 of 1 |
| audio.apply-window [pose-only] | ms | cold | 100 | 0.100 | 0.400 | 0.600 | 0.900 | 0.110 |  |
| audio.callback-interval-mean | s | cold | 61 | 0.010 | 0.010 | 0.010 | 0.010 | 0.010 | 1 of 1 |
| audio.param-call-total-ms | ms | cold | 100 | 0.000 | 0.200 | 0.200 | 0.400 | 0.045 | 1 of 1 |
| audio.param-call-total-ms [pose-only] | ms | cold | 100 | 0.000 | 0.200 | 0.200 | 0.400 | 0.045 |  |
| audio.param-ops | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 1 of 1 |
| audio.param-ops [pose-only] | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| audio.render-capacity | ratio | cold | 61 | 0.109 | 0.364 | 0.448 | 0.448 | 0.148 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 13.400 | 15.500 | 31.800 | 41.900 | 13.105 | 1 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 13.400 | 15.500 | 31.800 | 41.900 | 13.105 |  |
| display.status-commit-to-frame-end | ms | cold | 100 | 12.500 | 15.000 | 35.300 | 45.900 | 12.132 | 1 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 12.500 | 15.000 | 35.300 | 45.900 | 12.132 |  |
| merge.handler | ms | cold | 400 | 0.100 | 0.400 | 0.800 | 0.900 | 0.137 | 1 of 1 |
| merge.handler [pose-only] | ms | cold | 400 | 0.100 | 0.400 | 0.800 | 0.900 | 0.137 |  |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.017 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.017 |  |
| queue.rate-limit-estimate | ms | cold | 99 | 0.000 | 33.633 | 36.333 | 36.333 | 6.174 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | cold | 99 | 0.000 | 33.633 | 36.333 | 36.333 | 6.174 |  |
| shard.compute-reported | ms | cold | 400 | 1.000 | 3.000 | 4.000 | 7.000 | 1.000 | 1 of 1 |
| shard.compute-reported [pose-only] | ms | cold | 400 | 1.000 | 3.000 | 4.000 | 7.000 | 1.000 |  |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.600 | 0.020 | 1 of 1 |
| shard.post [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.600 | 0.020 |  |
| shard.roundtrip | ms | cold | 400 | 1.100 | 3.400 | 51.300 | 55.700 | 2.448 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | cold | 400 | 1.100 | 3.400 | 51.300 | 55.700 | 2.448 |  |

## TS-W APP_H100_SWITCH pass=traced boundary=browser-app workers=4 audio=on build=prod driver=poll browser-channel=default viewport=1920x1080 browser-args=[]

Runs: 1
Denominators: submitted=100 coalesced=not-applicable dispatched=100 completed=100 accepted=100 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | cold | 100 | 1.500 | 5.300 | 12.500 | 66.700 | 2.711 | 1 of 1 |
| accept.to-first-param [pose-only] | ms | cold | 100 | 1.500 | 5.300 | 12.500 | 66.700 | 2.711 |  |
| accept.to-overlay-commit | ms | cold | 100 | 1.000 | 2.200 | 4.600 | 66.000 | 1.824 | 1 of 1 |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 1.000 | 2.200 | 4.600 | 66.000 | 1.824 |  |
| accept.to-status-commit | ms | cold | 100 | 2.300 | 9.600 | 68.200 | 111.200 | 5.009 | 1 of 1 |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 2.300 | 9.600 | 68.200 | 111.200 | 5.009 |  |
| app.input-to-commit | ms | cold | 100 | 20.600 | 57.400 | 119.600 | 157.800 | 29.570 | 1 of 1 |
| app.input-to-commit [pose-only] | ms | cold | 100 | 20.600 | 57.400 | 119.600 | 157.800 | 29.570 |  |
| app.input-to-dispatch | ms | cold | 100 | 16.000 | 47.200 | 52.800 | 53.600 | 21.921 | 1 of 1 |
| app.input-to-dispatch [pose-only] | ms | cold | 100 | 16.000 | 47.200 | 52.800 | 53.600 | 21.921 |  |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 99 | 16.000 | 31.900 | 42.400 | 42.400 | 18.185 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 99 | 16.000 | 31.900 | 42.400 | 42.400 | 18.185 |  |
| app.long-animation-frame | ms | cold | 35 | 52.800 | 105.800 | 115.800 | 115.800 | 61.460 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 35 | 0.000 | 44.000 | 58.900 | 58.900 | 7.460 | 1 of 1 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 4 | 2.100 | 11.500 | 11.500 | 11.500 | 5.500 | 1 of 1 |
| app.long-animation-frame.out-of-window | ms | cold | 4 | 66.500 | 324.200 | 324.200 | 324.200 | 130.075 | 1 of 1 |
| app.long-task | ms | cold | 11 | 64.000 | 110.000 | 110.000 | 110.000 | 72.455 | 1 of 1 |
| app.long-task.out-of-window | ms | cold | 2 | 54.000 | 61.000 | 61.000 | 61.000 | 57.500 | 1 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 2.000 | 6.000 | 7.000 | 9.000 | 2.640 | 1 of 1 |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 2.000 | 6.000 | 7.000 | 9.000 | 2.640 |  |
| audio.apply-window | ms | cold | 100 | 0.100 | 0.300 | 0.500 | 0.600 | 0.101 | 1 of 1 |
| audio.apply-window [pose-only] | ms | cold | 100 | 0.100 | 0.300 | 0.500 | 0.600 | 0.101 |  |
| audio.callback-interval-mean | s | cold | 61 | 0.010 | 0.010 | 0.010 | 0.010 | 0.010 | 1 of 1 |
| audio.param-call-total-ms | ms | cold | 100 | 0.000 | 0.200 | 0.300 | 0.500 | 0.040 | 1 of 1 |
| audio.param-call-total-ms [pose-only] | ms | cold | 100 | 0.000 | 0.200 | 0.300 | 0.500 | 0.040 |  |
| audio.param-ops | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 1 of 1 |
| audio.param-ops [pose-only] | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| audio.render-capacity | ratio | cold | 61 | 0.124 | 0.384 | 0.594 | 0.594 | 0.169 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 13.300 | 50.300 | 56.100 | 108.500 | 17.004 | 1 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 13.300 | 50.300 | 56.100 | 108.500 | 17.004 |  |
| display.status-commit-to-frame-end | ms | cold | 100 | 12.700 | 49.700 | 67.600 | 82.700 | 18.585 | 1 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 12.700 | 49.700 | 67.600 | 82.700 | 18.585 |  |
| merge.handler | ms | cold | 400 | 0.100 | 0.400 | 0.800 | 1.200 | 0.142 | 1 of 1 |
| merge.handler [pose-only] | ms | cold | 400 | 0.100 | 0.400 | 0.800 | 1.200 | 0.142 |  |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.022 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.022 |  |
| queue.rate-limit-estimate | ms | cold | 99 | 0.000 | 24.233 | 34.033 | 34.033 | 3.766 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | cold | 99 | 0.000 | 24.233 | 34.033 | 34.033 | 3.766 |  |
| shard.compute-reported | ms | cold | 400 | 1.000 | 3.000 | 4.000 | 5.000 | 1.090 | 1 of 1 |
| shard.compute-reported [pose-only] | ms | cold | 400 | 1.000 | 3.000 | 4.000 | 5.000 | 1.090 |  |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 1.800 | 0.026 | 1 of 1 |
| shard.post [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 1.800 | 0.026 |  |
| shard.roundtrip | ms | cold | 400 | 1.700 | 4.200 | 5.700 | 7.800 | 1.901 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | cold | 400 | 1.700 | 4.200 | 5.700 | 7.800 | 1.901 |  |

## TS-W APP_H100_SWITCH pass=traced boundary=browser-app workers=4 audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[] trace-extra-categories=["cc","disabled-by-default-cc.debug.scheduler"]

Runs: 1
Denominators: submitted=100 coalesced=not-applicable dispatched=100 completed=100 accepted=100 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | cold | 100 | 1.300 | 8.700 | 49.600 | 213.000 | 4.838 | 1 of 1 |
| accept.to-first-param [pose-only] | ms | cold | 100 | 1.300 | 8.700 | 49.600 | 213.000 | 4.838 |  |
| accept.to-overlay-commit | ms | cold | 100 | 1.100 | 4.100 | 8.400 | 39.700 | 1.826 | 1 of 1 |
| accept.to-overlay-commit [pose-only] | ms | cold | 100 | 1.100 | 4.100 | 8.400 | 39.700 | 1.826 |  |
| accept.to-status-commit | ms | cold | 100 | 2.200 | 11.100 | 53.900 | 245.400 | 6.565 | 1 of 1 |
| accept.to-status-commit [pose-only] | ms | cold | 100 | 2.200 | 11.100 | 53.900 | 245.400 | 6.565 |  |
| app.input-to-commit | ms | cold | 100 | 21.400 | 56.700 | 286.900 | 324.600 | 34.880 | 1 of 1 |
| app.input-to-commit [pose-only] | ms | cold | 100 | 21.400 | 56.700 | 286.900 | 324.600 | 34.880 |  |
| app.input-to-dispatch | ms | cold | 100 | 16.700 | 35.200 | 221.200 | 279.100 | 25.366 | 1 of 1 |
| app.input-to-dispatch [pose-only] | ms | cold | 100 | 16.700 | 35.200 | 221.200 | 279.100 | 25.366 |  |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 99 | 15.600 | 31.800 | 249.867 | 249.867 | 17.921 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 99 | 15.600 | 31.800 | 249.867 | 249.867 | 17.921 |  |
| app.long-animation-frame | ms | cold | 5 | 139.200 | 269.400 | 269.400 | 269.400 | 152.000 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 5 | 75.200 | 205.800 | 205.800 | 205.800 | 86.720 | 1 of 1 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 2 | 48.300 | 111.800 | 111.800 | 111.800 | 80.050 | 1 of 1 |
| app.long-animation-frame.out-of-window | ms | cold | 2 | 99.300 | 165.800 | 165.800 | 165.800 | 132.550 | 1 of 1 |
| app.long-task | ms | cold | 3 | 197.000 | 246.000 | 246.000 | 246.000 | 209.333 | 1 of 1 |
| app.long-task.out-of-window | ms | cold | 1 | 97.000 | 97.000 | 97.000 | 97.000 | 97.000 | 1 of 1 |
| app.worker-compute-metric | ms | cold | 100 | 2.000 | 6.000 | 12.000 | 54.000 | 2.930 | 1 of 1 |
| app.worker-compute-metric [pose-only] | ms | cold | 100 | 2.000 | 6.000 | 12.000 | 54.000 | 2.930 |  |
| audio.apply-window | ms | cold | 100 | 0.100 | 0.400 | 0.700 | 10.700 | 0.202 | 1 of 1 |
| audio.apply-window [pose-only] | ms | cold | 100 | 0.100 | 0.400 | 0.700 | 10.700 | 0.202 |  |
| audio.callback-interval-mean | s | cold | 61 | 0.010 | 0.011 | 0.011 | 0.011 | 0.010 | 1 of 1 |
| audio.param-call-total-ms | ms | cold | 100 | 0.000 | 0.200 | 0.300 | 0.700 | 0.044 | 1 of 1 |
| audio.param-call-total-ms [pose-only] | ms | cold | 100 | 0.000 | 0.200 | 0.300 | 0.700 | 0.044 |  |
| audio.param-ops | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 1 of 1 |
| audio.param-ops [pose-only] | count | cold | 100 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| audio.render-capacity | ratio | cold | 61 | 0.125 | 0.977 | 0.991 | 0.991 | 0.250 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 100 | 13.200 | 24.200 | 31.200 | 224.700 | 15.161 | 1 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 100 | 13.200 | 24.200 | 31.200 | 224.700 | 15.161 |  |
| display.status-commit-to-frame-end | ms | cold | 100 | 12.400 | 22.200 | 26.100 | 32.400 | 12.211 | 1 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 100 | 12.400 | 22.200 | 26.100 | 32.400 | 12.211 |  |
| merge.handler | ms | cold | 400 | 0.100 | 0.400 | 0.700 | 1.900 | 0.154 | 1 of 1 |
| merge.handler [pose-only] | ms | cold | 400 | 0.100 | 0.400 | 0.700 | 1.900 | 0.154 |  |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.024 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.024 |  |
| queue.rate-limit-estimate | ms | cold | 99 | 0.000 | 33.733 | 50.133 | 50.133 | 7.554 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | cold | 99 | 0.000 | 33.733 | 50.133 | 50.133 | 7.554 |  |
| shard.compute-reported | ms | cold | 400 | 1.000 | 3.000 | 5.000 | 6.000 | 1.173 | 1 of 1 |
| shard.compute-reported [pose-only] | ms | cold | 400 | 1.000 | 3.000 | 5.000 | 6.000 | 1.173 |  |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.400 | 0.024 | 1 of 1 |
| shard.post [pose-only] | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.400 | 0.024 |  |
| shard.roundtrip | ms | cold | 400 | 1.300 | 4.200 | 11.100 | 53.100 | 2.150 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | cold | 400 | 1.300 | 4.200 | 11.100 | 53.100 | 2.150 |  |

## TS-W APP_H100_SWITCH pass=traced boundary=browser-app workers=4 audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[] trace-extra-categories=["disabled-by-default-devtools.timeline.invalidationTracking","disabled-by-default-blink.invalidation"]

Runs: 1
Denominators: submitted=50 coalesced=not-applicable dispatched=50 completed=50 accepted=50 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | cold | 50 | 2.500 | 8.500 | 39.400 | 39.400 | 3.698 | 1 of 1 |
| accept.to-first-param [pose-only] | ms | cold | 50 | 2.500 | 8.500 | 39.400 | 39.400 | 3.698 |  |
| accept.to-overlay-commit | ms | cold | 50 | 1.900 | 3.300 | 8.100 | 8.100 | 2.088 | 1 of 1 |
| accept.to-overlay-commit [pose-only] | ms | cold | 50 | 1.900 | 3.300 | 8.100 | 8.100 | 2.088 |  |
| accept.to-status-commit | ms | cold | 50 | 3.500 | 10.000 | 43.300 | 43.300 | 4.950 | 1 of 1 |
| accept.to-status-commit [pose-only] | ms | cold | 50 | 3.500 | 10.000 | 43.300 | 43.300 | 4.950 |  |
| app.input-to-commit | ms | cold | 50 | 34.400 | 53.300 | 106.900 | 106.900 | 33.786 | 1 of 1 |
| app.input-to-commit [pose-only] | ms | cold | 50 | 34.400 | 53.300 | 106.900 | 106.900 | 33.786 |  |
| app.input-to-dispatch | ms | cold | 50 | 25.200 | 44.000 | 58.000 | 58.000 | 26.868 | 1 of 1 |
| app.input-to-dispatch [pose-only] | ms | cold | 50 | 25.200 | 44.000 | 58.000 | 58.000 | 26.868 |  |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 49 | 15.300 | 31.200 | 58.000 | 58.000 | 12.040 | 1 of 1 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 49 | 15.300 | 31.200 | 58.000 | 58.000 | 12.040 |  |
| app.long-animation-frame | ms | cold | 1 | 59.100 | 59.100 | 59.100 | 59.100 | 59.100 | 1 of 1 |
| app.long-animation-frame.blocking | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 1 of 1 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 2 | 0.000 | 13.100 | 13.100 | 13.100 | 6.550 | 1 of 1 |
| app.long-animation-frame.out-of-window | ms | cold | 2 | 64.500 | 242.500 | 242.500 | 242.500 | 153.500 | 1 of 1 |
| app.long-task.out-of-window | ms | cold | 1 | 62.000 | 62.000 | 62.000 | 62.000 | 62.000 | 1 of 1 |
| app.worker-compute-metric | ms | cold | 50 | 2.000 | 3.000 | 5.000 | 5.000 | 1.980 | 1 of 1 |
| app.worker-compute-metric [pose-only] | ms | cold | 50 | 2.000 | 3.000 | 5.000 | 5.000 | 1.980 |  |
| audio.apply-window | ms | cold | 50 | 0.100 | 0.300 | 0.700 | 0.700 | 0.114 | 1 of 1 |
| audio.apply-window [pose-only] | ms | cold | 50 | 0.100 | 0.300 | 0.700 | 0.700 | 0.114 |  |
| audio.callback-interval-mean | s | cold | 28 | 0.010 | 0.010 | 0.010 | 0.010 | 0.010 | 1 of 1 |
| audio.param-call-total-ms | ms | cold | 50 | 0.000 | 0.200 | 0.400 | 0.400 | 0.052 | 1 of 1 |
| audio.param-call-total-ms [pose-only] | ms | cold | 50 | 0.000 | 0.200 | 0.400 | 0.400 | 0.052 |  |
| audio.param-ops | count | cold | 50 | 21.000 | 139.000 | 139.000 | 139.000 | 35.680 | 1 of 1 |
| audio.param-ops [pose-only] | count | cold | 50 | 21.000 | 139.000 | 139.000 | 139.000 | 35.680 |  |
| audio.render-capacity | ratio | cold | 28 | 0.109 | 0.245 | 0.359 | 0.359 | 0.127 | 1 of 1 |
| display.overlay-commit-to-frame-end | ms | cold | 50 | 10.700 | 19.800 | 33.200 | 33.200 | 10.900 | 1 of 1 |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 50 | 10.700 | 19.800 | 33.200 | 33.200 | 10.900 |  |
| display.status-commit-to-frame-end | ms | cold | 50 | 10.200 | 17.700 | 22.600 | 22.600 | 10.818 | 1 of 1 |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 50 | 10.200 | 17.700 | 22.600 | 22.600 | 10.818 |  |
| merge.handler | ms | cold | 200 | 0.100 | 0.300 | 0.500 | 0.900 | 0.118 | 1 of 1 |
| merge.handler [pose-only] | ms | cold | 200 | 0.100 | 0.300 | 0.500 | 0.900 | 0.118 |  |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.200 | 0.017 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.200 | 0.017 |  |
| queue.rate-limit-estimate | ms | cold | 49 | 2.133 | 36.133 | 46.833 | 46.833 | 15.007 | 1 of 1 |
| queue.rate-limit-estimate [pose-only] | ms | cold | 49 | 2.133 | 36.133 | 46.833 | 46.833 | 15.007 |  |
| shard.compute-reported | ms | cold | 200 | 1.000 | 2.000 | 3.000 | 3.000 | 0.905 | 1 of 1 |
| shard.compute-reported [pose-only] | ms | cold | 200 | 1.000 | 2.000 | 3.000 | 3.000 | 0.905 |  |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.500 | 0.021 | 1 of 1 |
| shard.post [pose-only] | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.500 | 0.021 |  |
| shard.roundtrip | ms | cold | 200 | 1.100 | 2.600 | 3.300 | 4.600 | 1.313 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | cold | 200 | 1.100 | 2.600 | 3.300 | 4.600 | 1.313 |  |

## TS-W APP_H100_SWITCH pass=traced boundary=browser-app workers=4 audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 2
Denominators: submitted=200 coalesced=not-applicable dispatched=200 completed=200 accepted=200 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.to-first-param | ms | cold | 200 | 0.900 | 4.200 | 30.500 | 47.900 | 1.891 | 2 of 2 |
| accept.to-first-param [pose-only] | ms | cold | 200 | 0.900 | 4.200 | 30.500 | 47.900 | 1.891 |  |
| accept.to-overlay-commit | ms | cold | 200 | 0.800 | 2.100 | 3.800 | 46.700 | 1.253 | 2 of 2 |
| accept.to-overlay-commit [pose-only] | ms | cold | 200 | 0.800 | 2.100 | 3.800 | 46.700 | 1.253 |  |
| accept.to-status-commit | ms | cold | 200 | 1.600 | 7.300 | 43.700 | 53.000 | 3.174 | 2 of 2 |
| accept.to-status-commit [pose-only] | ms | cold | 200 | 1.600 | 7.300 | 43.700 | 53.000 | 3.174 |  |
| app.input-to-commit | ms | cold | 200 | 19.500 | 40.600 | 78.100 | 106.500 | 24.092 | 2 of 2 |
| app.input-to-commit [pose-only] | ms | cold | 200 | 19.500 | 40.600 | 78.100 | 106.500 | 24.092 |  |
| app.input-to-dispatch | ms | cold | 200 | 16.200 | 34.000 | 36.300 | 43.300 | 18.791 | 2 of 2 |
| app.input-to-dispatch [pose-only] | ms | cold | 200 | 16.200 | 34.000 | 36.300 | 43.300 | 18.791 |  |
| app.input-to-dispatch-minus-rate-limit | ms | cold | 198 | 15.800 | 19.200 | 31.500 | 43.300 | 14.460 | 2 of 2 |
| app.input-to-dispatch-minus-rate-limit [pose-only] | ms | cold | 198 | 15.800 | 19.200 | 31.500 | 43.300 | 14.460 |  |
| app.long-animation-frame | ms | cold | 2 | 52.500 | 65.700 | 65.700 | 65.700 | 59.100 | 1 of 2 |
| app.long-animation-frame.blocking | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 1 of 2 |
| app.long-animation-frame.blocking.out-of-window | ms | cold | 4 | 12.800 | 195.400 | 195.400 | 195.400 | 56.975 | 2 of 2 |
| app.long-animation-frame.out-of-window | ms | cold | 4 | 71.100 | 337.200 | 337.200 | 337.200 | 183.225 | 2 of 2 |
| app.long-task.out-of-window | ms | cold | 3 | 69.000 | 246.000 | 246.000 | 246.000 | 125.667 | 2 of 2 |
| app.worker-compute-metric | ms | cold | 200 | 2.000 | 4.000 | 7.000 | 30.000 | 2.095 | 2 of 2 |
| app.worker-compute-metric [pose-only] | ms | cold | 200 | 2.000 | 4.000 | 7.000 | 30.000 | 2.095 |  |
| audio.apply-window | ms | cold | 200 | 0.100 | 0.200 | 0.400 | 0.600 | 0.087 | 2 of 2 |
| audio.apply-window [pose-only] | ms | cold | 200 | 0.100 | 0.200 | 0.400 | 0.600 | 0.087 |  |
| audio.callback-interval-mean | s | cold | 127 | 0.010 | 0.010 | 0.010 | 0.010 | 0.010 | 2 of 2 |
| audio.param-call-total-ms | ms | cold | 200 | 0.000 | 0.200 | 0.300 | 0.400 | 0.038 | 2 of 2 |
| audio.param-call-total-ms [pose-only] | ms | cold | 200 | 0.000 | 0.200 | 0.300 | 0.400 | 0.038 |  |
| audio.param-ops | count | cold | 200 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 | 2 of 2 |
| audio.param-ops [pose-only] | count | cold | 200 | 26.000 | 139.000 | 139.000 | 139.000 | 37.190 |  |
| audio.render-capacity | ratio | cold | 127 | 0.103 | 0.337 | 0.802 | 0.957 | 0.146 | 2 of 2 |
| display.overlay-commit-to-frame-end | ms | cold | 200 | 13.900 | 15.800 | 31.500 | 42.900 | 13.616 | 2 of 2 |
| display.overlay-commit-to-frame-end [pose-only] | ms | cold | 200 | 13.900 | 15.800 | 31.500 | 42.900 | 13.616 |  |
| display.status-commit-to-frame-end | ms | cold | 200 | 13.100 | 15.100 | 18.000 | 26.600 | 12.381 | 2 of 2 |
| display.status-commit-to-frame-end [pose-only] | ms | cold | 200 | 13.100 | 15.100 | 18.000 | 26.600 | 12.381 |  |
| merge.handler | ms | cold | 800 | 0.100 | 0.300 | 0.500 | 1.200 | 0.116 | 2 of 2 |
| merge.handler [pose-only] | ms | cold | 800 | 0.100 | 0.300 | 0.500 | 1.200 | 0.116 |  |
| merge.reply-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 | 2 of 2 |
| merge.reply-deserialize [pose-only] | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 |  |
| queue.rate-limit-estimate | ms | cold | 198 | 0.000 | 33.433 | 35.633 | 35.933 | 4.272 | 2 of 2 |
| queue.rate-limit-estimate [pose-only] | ms | cold | 198 | 0.000 | 33.433 | 35.633 | 35.933 | 4.272 |  |
| shard.compute-reported | ms | cold | 800 | 1.000 | 2.000 | 4.000 | 6.000 | 0.865 | 2 of 2 |
| shard.compute-reported [pose-only] | ms | cold | 800 | 1.000 | 2.000 | 4.000 | 6.000 | 0.865 |  |
| shard.post | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.300 | 0.015 | 2 of 2 |
| shard.post [pose-only] | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.300 | 0.015 |  |
| shard.roundtrip | ms | cold | 800 | 1.100 | 3.000 | 5.300 | 30.000 | 1.468 | 2 of 2 |
| shard.roundtrip [pose-only] | ms | cold | 800 | 1.100 | 3.000 | 5.300 | 30.000 | 1.468 |  |

## TS-W CONTROLS pass=traced boundary=browser-app workers=2 audio=on build=prod driver=poll browser-channel=default viewport=default browser-args=[]

Runs: 1
Denominators: submitted=0 coalesced=not-applicable dispatched=19 completed=19 accepted=19 stale=not-applicable fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |

## TS-W CONTROLS pass=traced boundary=browser-pool workers=not-applicable audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=not-applicable coalesced=not-applicable dispatched=not-applicable completed=not-applicable accepted=not-applicable stale=not-applicable fallback=not-applicable error=not-applicable timeout=not-applicable

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |

## TS-W TC01_LISTENER_TAPE_SEEDED pass=alloc boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=192 coalesced=0 dispatched=192 completed=192 accepted=192 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.decide | ms | warm | 92 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 | 1 of 1 |
| accept.decide | ms | cold | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 1 of 1 |
| accept.decide [pose-only] | ms | warm | 92 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 |  |
| accept.decide [pose-only] | ms | cold | 99 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| accept.decide [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| dispatch.prepare | ms | warm | 92 | 0.100 | 0.300 | 1.000 | 1.000 | 0.129 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.100 | 0.300 | 1.100 | 4.600 | 0.181 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 92 | 0.100 | 0.300 | 1.000 | 1.000 | 0.129 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.100 | 0.300 | 1.100 | 1.100 | 0.136 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 4.600 | 4.600 | 4.600 | 4.600 | 4.600 |  |
| install.ack-roundtrip | ms | cold | 2 | 30.700 | 36.000 | 36.000 | 36.000 | 33.350 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 2 | 30.700 | 36.000 | 36.000 | 36.000 | 33.350 |  |
| install.post | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 1 of 1 |
| install.post [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| install.worker-deserialize | ms | cold | 2 | 0.100 | 1.000 | 1.000 | 1.000 | 0.550 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 2 | 0.100 | 1.000 | 1.000 | 1.000 | 0.550 |  |
| job.phase-residual | ms | warm | 85 | 0.000 | 0.000 | 0.100 | 0.100 | -0.005 | 1 of 1 |
| job.phase-residual | ms | cold | 96 | 0.000 | 0.000 | 0.100 | 0.100 | -0.003 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 85 | 0.000 | 0.000 | 0.100 | 0.100 | -0.005 |  |
| job.phase-residual [pose-only] | ms | cold | 95 | 0.000 | 0.000 | 0.100 | 0.100 | -0.001 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.200 | -0.200 | -0.200 | -0.200 | -0.200 |  |
| job.submit-to-accepted | ms | warm | 92 | 92.800 | 95.100 | 109.600 | 109.600 | 90.980 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 91.900 | 96.800 | 101.300 | 104.600 | 90.457 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 92 | 92.800 | 95.100 | 109.600 | 109.600 | 90.980 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 99 | 92.000 | 97.100 | 104.600 | 104.600 | 90.770 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 59.500 | 59.500 | 59.500 | 59.500 | 59.500 |  |
| merge.assemble | ms | warm | 85 | 0.000 | 0.100 | 0.100 | 0.100 | 0.008 | 1 of 1 |
| merge.assemble | ms | cold | 96 | 0.000 | 0.000 | 0.500 | 0.500 | 0.008 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 85 | 0.000 | 0.100 | 0.100 | 0.100 | 0.008 |  |
| merge.assemble [pose-only] | ms | cold | 95 | 0.000 | 0.000 | 0.100 | 0.100 | 0.003 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.500 | 0.500 | 0.500 | 0.500 | 0.500 |  |
| merge.reply-deserialize | ms | warm | 184 | 0.000 | 0.100 | 0.400 | 0.400 | 0.029 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.300 | 0.800 | 0.035 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 0.400 | 0.400 | 0.029 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.800 | 0.800 | 0.034 |  |
| merge.reply-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.200 | 0.200 | 0.200 | 0.100 |  |
| merge.validate | ms | warm | 184 | 0.100 | 0.300 | 1.700 | 2.200 | 0.116 | 1 of 1 |
| merge.validate | ms | cold | 200 | 0.100 | 0.400 | 2.900 | 7.200 | 0.208 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 184 | 0.100 | 0.300 | 1.700 | 2.200 | 0.116 |  |
| merge.validate [pose-only] | ms | cold | 198 | 0.100 | 0.400 | 2.800 | 2.900 | 0.159 |  |
| merge.validate [static-install] | ms | cold | 2 | 3.100 | 7.200 | 7.200 | 7.200 | 5.150 |  |
| pool.compute-metric | ms | warm | 92 | 0.600 | 2.100 | 9.700 | 9.700 | 0.905 | 1 of 1 |
| pool.compute-metric | ms | cold | 100 | 0.700 | 2.900 | 10.300 | 54.500 | 1.593 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 92 | 0.600 | 2.100 | 9.700 | 9.700 | 0.905 |  |
| pool.compute-metric [pose-only] | ms | cold | 99 | 0.700 | 2.900 | 10.300 | 10.300 | 1.059 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 54.500 | 54.500 | 54.500 | 54.500 | 54.500 |  |
| pool.shard-max | ms | warm | 92 | 0.200 | 0.500 | 2.000 | 2.000 | 0.213 | 1 of 1 |
| pool.shard-max | ms | cold | 100 | 0.200 | 1.100 | 3.100 | 12.600 | 0.462 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 92 | 0.200 | 0.500 | 2.000 | 2.000 | 0.213 |  |
| pool.shard-max [pose-only] | ms | cold | 99 | 0.200 | 1.100 | 3.100 | 3.100 | 0.339 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 12.600 | 12.600 | 12.600 | 12.600 | 12.600 |  |
| pool.shard-total | ms | warm | 92 | 0.300 | 0.700 | 3.800 | 3.800 | 0.335 | 1 of 1 |
| pool.shard-total | ms | cold | 100 | 0.300 | 1.400 | 4.200 | 16.500 | 0.638 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 92 | 0.300 | 0.700 | 3.800 | 3.800 | 0.335 |  |
| pool.shard-total [pose-only] | ms | cold | 99 | 0.300 | 1.400 | 4.200 | 4.200 | 0.478 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 16.500 | 16.500 | 16.500 | 16.500 | 16.500 |  |
| queue.client | ms | warm | 92 | 0.200 | 0.700 | 4.400 | 4.400 | 0.342 | 1 of 1 |
| queue.client | ms | cold | 100 | 0.200 | 0.800 | 2.700 | 3.600 | 0.348 | 1 of 1 |
| queue.rate-limit | ms | warm | 92 | 83.033 | 83.233 | 83.233 | 83.233 | 82.920 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 83.033 | 83.233 | 83.233 | 83.233 | 82.036 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 92 | 83.033 | 83.233 | 83.233 | 83.233 | 82.920 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 83.033 | 83.233 | 83.233 | 83.233 | 82.865 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 92 | 8.767 | 10.867 | 16.867 | 16.867 | 6.776 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 7.867 | 11.067 | 15.467 | 15.767 | 6.424 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 92 | 8.767 | 10.867 | 16.867 | 16.867 | 6.776 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 7.967 | 12.367 | 15.767 | 15.767 | 6.487 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 0.200 | 0.200 | 0.200 | 0.200 | 0.200 |  |
| queue.wait | ms | warm | 92 | 92.000 | 94.200 | 99.700 | 99.700 | 90.041 | 1 of 1 |
| queue.wait | ms | cold | 100 | 91.100 | 94.400 | 98.300 | 98.800 | 88.818 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 92 | 92.000 | 94.200 | 99.700 | 99.700 | 90.041 |  |
| queue.wait [pose-only] | ms | cold | 99 | 91.100 | 95.600 | 98.800 | 98.800 | 89.683 |  |
| queue.wait [static-install] | ms | cold | 1 | 3.200 | 3.200 | 3.200 | 3.200 | 3.200 |  |
| shard.compute | ms | warm | 184 | 0.100 | 0.500 | 1.800 | 2.000 | 0.167 | 1 of 1 |
| shard.compute | ms | cold | 200 | 0.100 | 1.100 | 3.100 | 12.600 | 0.319 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 184 | 0.100 | 0.500 | 1.800 | 2.000 | 0.167 |  |
| shard.compute [pose-only] | ms | cold | 198 | 0.100 | 1.000 | 2.700 | 3.100 | 0.239 |  |
| shard.compute [static-install] | ms | cold | 2 | 3.900 | 12.600 | 12.600 | 12.600 | 8.250 |  |
| shard.post | ms | warm | 184 | 0.000 | 0.200 | 0.300 | 0.500 | 0.046 | 1 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.400 | 0.800 | 0.052 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 184 | 0.000 | 0.200 | 0.300 | 0.500 | 0.046 |  |
| shard.post [pose-only] | ms | cold | 198 | 0.000 | 0.200 | 0.600 | 0.800 | 0.052 |  |
| shard.post [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |
| shard.reply-post | ms | warm | 184 | 0.000 | 0.100 | 1.400 | 1.600 | 0.075 | 1 of 1 |
| shard.reply-post | ms | cold | 200 | 0.000 | 0.200 | 0.500 | 0.500 | 0.055 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 1.400 | 1.600 | 0.075 |  |
| shard.reply-post [pose-only] | ms | cold | 198 | 0.000 | 0.200 | 0.500 | 0.500 | 0.056 |  |
| shard.reply-post [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |
| shard.roundtrip | ms | warm | 184 | 0.400 | 1.100 | 6.500 | 7.000 | 0.522 | 1 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.400 | 1.500 | 5.600 | 43.800 | 0.963 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 184 | 0.400 | 1.100 | 6.500 | 7.000 | 0.522 |  |
| shard.roundtrip [pose-only] | ms | cold | 198 | 0.400 | 1.300 | 4.600 | 5.600 | 0.548 |  |
| shard.roundtrip [static-install] | ms | cold | 2 | 40.300 | 43.800 | 43.800 | 43.800 | 42.050 |  |
| shard.transport | ms | warm | 184 | 0.200 | 0.600 | 3.600 | 4.100 | 0.243 | 1 of 1 |
| shard.transport | ms | cold | 200 | 0.200 | 0.600 | 1.800 | 36.200 | 0.550 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 184 | 0.200 | 0.600 | 3.600 | 4.100 | 0.243 |  |
| shard.transport [pose-only] | ms | cold | 198 | 0.200 | 0.600 | 1.800 | 1.800 | 0.216 |  |
| shard.transport [static-install] | ms | cold | 2 | 31.100 | 36.200 | 36.200 | 36.200 | 33.650 |  |
| shard.worker-deserialize | ms | warm | 184 | 0.000 | 0.100 | 0.300 | 0.400 | 0.036 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.300 | 0.400 | 0.039 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 0.300 | 0.400 | 0.036 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.300 | 0.400 | 0.038 |  |
| shard.worker-deserialize [static-install] | ms | cold | 2 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |

## TS-W TC01_LISTENER_TAPE_SEEDED pass=bare boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1152 coalesced=0 dispatched=not-applicable completed=1152 accepted=1152 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| job.submit-to-accepted | ms | warm | 1052 | 92.800 | 95.200 | 98.900 | 104.200 | 91.589 | 0 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 93.000 | 94.800 | 95.800 | 99.400 | 91.549 | 0 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 1052 | 92.800 | 95.200 | 98.900 | 104.200 | 91.589 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 99 | 93.000 | 95.000 | 99.400 | 99.400 | 91.988 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 48.100 | 48.100 | 48.100 | 48.100 | 48.100 |  |
| pool.compute-metric | ms | warm | 1052 | 0.500 | 1.300 | 6.300 | 8.100 | 0.683 | 0 of 1 |
| pool.compute-metric | ms | cold | 100 | 0.600 | 1.600 | 2.900 | 43.600 | 1.114 | 0 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 1052 | 0.500 | 1.300 | 6.300 | 8.100 | 0.683 |  |
| pool.compute-metric [pose-only] | ms | cold | 99 | 0.600 | 1.600 | 2.900 | 2.900 | 0.685 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 43.600 | 43.600 | 43.600 | 43.600 | 43.600 |  |

## TS-W TC01_LISTENER_TAPE_SEEDED pass=clean boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1152 coalesced=0 dispatched=1152 completed=1152 accepted=1152 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.decide | ms | warm | 1052 | 0.000 | 0.000 | 0.000 | 0.100 | 0.001 | 0 of 1 |
| accept.decide | ms | cold | 100 | 0.000 | 0.000 | 0.000 | 0.100 | 0.001 | 0 of 1 |
| accept.decide [pose-only] | ms | warm | 1052 | 0.000 | 0.000 | 0.000 | 0.100 | 0.001 |  |
| accept.decide [pose-only] | ms | cold | 99 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 |  |
| accept.decide [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| dispatch.prepare | ms | warm | 1052 | 0.100 | 0.300 | 0.800 | 2.000 | 0.124 | 0 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.100 | 0.200 | 0.300 | 1.000 | 0.111 | 0 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 1052 | 0.100 | 0.300 | 0.800 | 2.000 | 0.124 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.100 | 0.200 | 0.300 | 0.300 | 0.102 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |  |
| install.ack-roundtrip | ms | cold | 2 | 6.200 | 7.000 | 7.000 | 7.000 | 6.600 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 2 | 6.200 | 7.000 | 7.000 | 7.000 | 6.600 |  |
| install.post | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 1 of 1 |
| install.post [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| install.worker-deserialize | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |
| job.phase-residual | ms | warm | 930 | 0.000 | 0.000 | 0.100 | 0.100 | -0.005 | 0 of 1 |
| job.phase-residual | ms | cold | 89 | 0.000 | 0.000 | 0.100 | 0.100 | -0.004 | 0 of 1 |
| job.phase-residual [pose-only] | ms | warm | 930 | 0.000 | 0.000 | 0.100 | 0.100 | -0.005 |  |
| job.phase-residual [pose-only] | ms | cold | 88 | 0.000 | 0.000 | 0.100 | 0.100 | -0.003 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.100 | -0.100 | -0.100 | -0.100 | -0.100 |  |
| job.submit-to-accepted | ms | warm | 1052 | 92.900 | 95.400 | 100.400 | 113.100 | 91.488 | 0 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 92.900 | 95.200 | 98.100 | 99.900 | 90.343 | 0 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 1052 | 92.900 | 95.400 | 100.400 | 113.100 | 91.488 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 99 | 92.900 | 95.400 | 99.900 | 99.900 | 91.134 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 12.000 | 12.000 | 12.000 | 12.000 | 12.000 |  |
| merge.assemble | ms | warm | 930 | 0.000 | 0.100 | 0.100 | 0.300 | 0.007 | 0 of 1 |
| merge.assemble | ms | cold | 89 | 0.000 | 0.000 | 0.100 | 0.100 | 0.003 | 0 of 1 |
| merge.assemble [pose-only] | ms | warm | 930 | 0.000 | 0.100 | 0.100 | 0.300 | 0.007 |  |
| merge.assemble [pose-only] | ms | cold | 88 | 0.000 | 0.000 | 0.100 | 0.100 | 0.003 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| merge.reply-deserialize | ms | warm | 2104 | 0.000 | 0.100 | 0.400 | 1.700 | 0.034 | 0 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 | 0 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 2104 | 0.000 | 0.100 | 0.400 | 1.700 | 0.034 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| merge.reply-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |
| merge.validate | ms | warm | 2104 | 0.100 | 0.200 | 0.900 | 4.600 | 0.092 | 0 of 1 |
| merge.validate | ms | cold | 200 | 0.100 | 0.200 | 0.400 | 1.400 | 0.079 | 0 of 1 |
| merge.validate [pose-only] | ms | warm | 2104 | 0.100 | 0.200 | 0.900 | 4.600 | 0.092 |  |
| merge.validate [pose-only] | ms | cold | 198 | 0.100 | 0.200 | 0.300 | 0.400 | 0.070 |  |
| merge.validate [static-install] | ms | cold | 2 | 0.600 | 1.400 | 1.400 | 1.400 | 1.000 |  |
| pool.compute-metric | ms | warm | 1052 | 0.600 | 1.800 | 7.800 | 20.100 | 0.856 | 0 of 1 |
| pool.compute-metric | ms | cold | 100 | 0.500 | 0.900 | 1.700 | 10.600 | 0.644 | 0 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 1052 | 0.600 | 1.800 | 7.800 | 20.100 | 0.856 |  |
| pool.compute-metric [pose-only] | ms | cold | 99 | 0.500 | 0.900 | 1.700 | 1.700 | 0.543 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 10.600 | 10.600 | 10.600 | 10.600 | 10.600 |  |
| pool.shard-max | ms | warm | 1052 | 0.100 | 0.400 | 0.800 | 2.300 | 0.164 | 0 of 1 |
| pool.shard-max | ms | cold | 100 | 0.100 | 0.300 | 0.800 | 2.000 | 0.167 | 0 of 1 |
| pool.shard-max [pose-only] | ms | warm | 1052 | 0.100 | 0.400 | 0.800 | 2.300 | 0.164 |  |
| pool.shard-max [pose-only] | ms | cold | 99 | 0.100 | 0.300 | 0.800 | 0.800 | 0.149 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 2.000 | 2.000 | 2.000 | 2.000 | 2.000 |  |
| pool.shard-total | ms | warm | 1052 | 0.200 | 0.600 | 1.300 | 2.700 | 0.242 | 0 of 1 |
| pool.shard-total | ms | cold | 100 | 0.200 | 0.400 | 1.000 | 2.700 | 0.226 | 0 of 1 |
| pool.shard-total [pose-only] | ms | warm | 1052 | 0.200 | 0.600 | 1.300 | 2.700 | 0.242 |  |
| pool.shard-total [pose-only] | ms | cold | 99 | 0.200 | 0.400 | 1.000 | 1.000 | 0.201 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 2.700 | 2.700 | 2.700 | 2.700 | 2.700 |  |
| queue.client | ms | warm | 1052 | 0.200 | 0.900 | 3.700 | 5.200 | 0.361 | 0 of 1 |
| queue.client | ms | cold | 100 | 0.200 | 0.300 | 0.400 | 0.700 | 0.200 | 0 of 1 |
| queue.rate-limit | ms | warm | 1052 | 83.033 | 83.233 | 83.233 | 83.333 | 82.886 | 0 of 1 |
| queue.rate-limit | ms | cold | 100 | 83.133 | 83.233 | 83.233 | 83.233 | 82.256 | 0 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 1052 | 83.033 | 83.233 | 83.233 | 83.333 | 82.886 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 83.133 | 83.233 | 83.233 | 83.233 | 83.087 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 1052 | 8.867 | 11.167 | 13.767 | 16.867 | 7.353 | 0 of 1 |
| queue.timer-lateness | ms | cold | 100 | 9.067 | 11.467 | 14.167 | 16.067 | 7.215 | 0 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 1052 | 8.867 | 11.167 | 13.767 | 16.867 | 7.353 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 9.067 | 11.567 | 16.067 | 16.067 | 7.288 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.wait | ms | warm | 1052 | 92.200 | 94.500 | 97.100 | 100.100 | 90.603 | 0 of 1 |
| queue.wait | ms | cold | 100 | 92.400 | 94.800 | 97.500 | 99.400 | 89.679 | 0 of 1 |
| queue.wait [pose-only] | ms | warm | 1052 | 92.200 | 94.500 | 97.100 | 100.100 | 90.603 |  |
| queue.wait [pose-only] | ms | cold | 99 | 92.400 | 94.800 | 99.400 | 99.400 | 90.576 |  |
| queue.wait [static-install] | ms | cold | 1 | 0.900 | 0.900 | 0.900 | 0.900 | 0.900 |  |
| shard.compute | ms | warm | 2104 | 0.100 | 0.300 | 0.700 | 2.300 | 0.121 | 0 of 1 |
| shard.compute | ms | cold | 200 | 0.100 | 0.300 | 0.800 | 2.000 | 0.113 | 0 of 1 |
| shard.compute [pose-only] | ms | warm | 2104 | 0.100 | 0.300 | 0.700 | 2.300 | 0.121 |  |
| shard.compute [pose-only] | ms | cold | 198 | 0.100 | 0.300 | 0.800 | 0.800 | 0.101 |  |
| shard.compute [static-install] | ms | cold | 2 | 0.700 | 2.000 | 2.000 | 2.000 | 1.350 |  |
| shard.post | ms | warm | 2104 | 0.000 | 0.200 | 0.400 | 0.800 | 0.051 | 0 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.200 | 0.027 | 0 of 1 |
| shard.post [pose-only] | ms | warm | 2104 | 0.000 | 0.200 | 0.400 | 0.800 | 0.051 |  |
| shard.post [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.100 | 0.200 | 0.028 |  |
| shard.post [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.reply-post | ms | warm | 2104 | 0.100 | 0.200 | 0.800 | 1.400 | 0.077 | 0 of 1 |
| shard.reply-post | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.200 | 0.037 | 0 of 1 |
| shard.reply-post [pose-only] | ms | warm | 2104 | 0.100 | 0.200 | 0.800 | 1.400 | 0.077 |  |
| shard.reply-post [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.200 | 0.200 | 0.038 |  |
| shard.reply-post [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.roundtrip | ms | warm | 2104 | 0.300 | 1.100 | 4.400 | 17.800 | 0.499 | 0 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.300 | 0.500 | 1.100 | 8.500 | 0.370 | 0 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 2104 | 0.300 | 1.100 | 4.400 | 17.800 | 0.499 |  |
| shard.roundtrip [pose-only] | ms | cold | 198 | 0.300 | 0.500 | 1.000 | 1.100 | 0.291 |  |
| shard.roundtrip [static-install] | ms | cold | 2 | 7.900 | 8.500 | 8.500 | 8.500 | 8.200 |  |
| shard.transport | ms | warm | 2104 | 0.200 | 0.600 | 2.500 | 16.000 | 0.253 | 0 of 1 |
| shard.transport | ms | cold | 200 | 0.100 | 0.300 | 0.400 | 7.100 | 0.201 | 0 of 1 |
| shard.transport [pose-only] | ms | warm | 2104 | 0.200 | 0.600 | 2.500 | 16.000 | 0.253 |  |
| shard.transport [pose-only] | ms | cold | 198 | 0.100 | 0.300 | 0.400 | 0.400 | 0.135 |  |
| shard.transport [static-install] | ms | cold | 2 | 6.500 | 7.100 | 7.100 | 7.100 | 6.800 |  |
| shard.worker-deserialize | ms | warm | 2104 | 0.000 | 0.200 | 0.400 | 0.900 | 0.048 | 0 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.100 | 0.019 | 0 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 2104 | 0.000 | 0.200 | 0.400 | 0.900 | 0.048 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.100 | 0.100 | 0.018 |  |
| shard.worker-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |

## TS-W TC01_LISTENER_TAPE_SEEDED pass=traced boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=192 coalesced=0 dispatched=192 completed=192 accepted=192 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.decide | ms | warm | 92 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 | 1 of 1 |
| accept.decide | ms | cold | 100 | 0.000 | 0.000 | 0.500 | 1.400 | 0.021 | 1 of 1 |
| accept.decide [pose-only] | ms | warm | 92 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 |  |
| accept.decide [pose-only] | ms | cold | 99 | 0.000 | 0.000 | 1.400 | 1.400 | 0.020 |  |
| accept.decide [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| dispatch.prepare | ms | warm | 92 | 0.100 | 0.400 | 4.200 | 4.200 | 0.151 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.100 | 0.700 | 5.100 | 6.800 | 0.258 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 92 | 0.100 | 0.400 | 4.200 | 4.200 | 0.151 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.100 | 0.700 | 6.800 | 6.800 | 0.209 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 5.100 | 5.100 | 5.100 | 5.100 | 5.100 |  |
| install.ack-roundtrip | ms | cold | 2 | 29.700 | 32.400 | 32.400 | 32.400 | 31.050 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 2 | 29.700 | 32.400 | 32.400 | 32.400 | 31.050 |  |
| install.post | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 | 1 of 1 |
| install.post [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |
| install.worker-deserialize | ms | cold | 2 | 0.100 | 0.300 | 0.300 | 0.300 | 0.200 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 2 | 0.100 | 0.300 | 0.300 | 0.300 | 0.200 |  |
| job.phase-residual | ms | warm | 82 | 0.000 | 0.100 | 1.800 | 1.800 | 0.028 | 1 of 1 |
| job.phase-residual | ms | cold | 92 | 0.000 | 0.100 | 0.300 | 0.300 | 0.001 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 82 | 0.000 | 0.100 | 1.800 | 1.800 | 0.028 |  |
| job.phase-residual [pose-only] | ms | cold | 91 | 0.000 | 0.100 | 0.300 | 0.300 | 0.009 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.700 | -0.700 | -0.700 | -0.700 | -0.700 |  |
| job.submit-to-accepted | ms | warm | 92 | 84.000 | 86.000 | 119.000 | 119.000 | 84.688 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 84.000 | 90.100 | 124.600 | 143.000 | 85.364 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 92 | 84.000 | 86.000 | 119.000 | 119.000 | 84.688 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 99 | 84.000 | 93.800 | 143.000 | 143.000 | 85.637 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 58.300 | 58.300 | 58.300 | 58.300 | 58.300 |  |
| merge.assemble | ms | warm | 82 | 0.000 | 0.100 | 0.700 | 0.700 | 0.016 | 1 of 1 |
| merge.assemble | ms | cold | 92 | 0.000 | 0.100 | 0.400 | 0.400 | 0.017 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 82 | 0.000 | 0.100 | 0.700 | 0.700 | 0.016 |  |
| merge.assemble [pose-only] | ms | cold | 91 | 0.000 | 0.100 | 0.200 | 0.200 | 0.013 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.400 | 0.400 | 0.400 | 0.400 | 0.400 |  |
| merge.reply-deserialize | ms | warm | 184 | 0.000 | 0.100 | 0.900 | 1.100 | 0.039 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.300 | 1.000 | 3.300 | 0.072 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 0.900 | 1.100 | 0.039 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.300 | 2.400 | 3.300 | 0.073 |  |
| merge.reply-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |
| merge.validate | ms | warm | 184 | 0.100 | 0.300 | 9.600 | 16.200 | 0.269 | 1 of 1 |
| merge.validate | ms | cold | 200 | 0.100 | 1.500 | 6.400 | 26.500 | 0.517 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 184 | 0.100 | 0.300 | 9.600 | 16.200 | 0.269 |  |
| merge.validate [pose-only] | ms | cold | 198 | 0.100 | 1.200 | 22.600 | 26.500 | 0.476 |  |
| merge.validate [static-install] | ms | cold | 2 | 2.700 | 6.400 | 6.400 | 6.400 | 4.550 |  |
| pool.compute-metric | ms | warm | 92 | 0.500 | 2.500 | 37.800 | 37.800 | 1.422 | 1 of 1 |
| pool.compute-metric | ms | cold | 100 | 0.500 | 6.700 | 49.300 | 54.700 | 2.730 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 92 | 0.500 | 2.500 | 37.800 | 37.800 | 1.422 |  |
| pool.compute-metric [pose-only] | ms | cold | 99 | 0.500 | 6.700 | 54.700 | 54.700 | 2.260 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 49.300 | 49.300 | 49.300 | 49.300 | 49.300 |  |
| pool.shard-max | ms | warm | 92 | 0.100 | 0.400 | 11.400 | 11.400 | 0.377 | 1 of 1 |
| pool.shard-max | ms | cold | 100 | 0.100 | 2.100 | 11.900 | 15.300 | 0.722 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 92 | 0.100 | 0.400 | 11.400 | 11.400 | 0.377 |  |
| pool.shard-max [pose-only] | ms | cold | 99 | 0.100 | 2.100 | 15.300 | 15.300 | 0.639 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 8.900 | 8.900 | 8.900 | 8.900 | 8.900 |  |
| pool.shard-total | ms | warm | 92 | 0.100 | 0.500 | 15.500 | 15.500 | 0.478 | 1 of 1 |
| pool.shard-total | ms | cold | 100 | 0.100 | 3.100 | 20.700 | 22.000 | 1.008 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 92 | 0.100 | 0.500 | 15.500 | 15.500 | 0.478 |  |
| pool.shard-total [pose-only] | ms | cold | 99 | 0.100 | 3.100 | 22.000 | 22.000 | 0.896 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 12.100 | 12.100 | 12.100 | 12.100 | 12.100 |  |
| queue.client | ms | warm | 92 | 0.300 | 1.100 | 12.600 | 12.600 | 0.593 | 1 of 1 |
| queue.client | ms | cold | 100 | 0.300 | 3.200 | 8.600 | 11.400 | 0.754 | 1 of 1 |
| queue.rate-limit | ms | warm | 92 | 82.933 | 83.133 | 83.133 | 83.133 | 82.347 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 82.933 | 83.133 | 83.233 | 83.233 | 81.336 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 92 | 82.933 | 83.133 | 83.133 | 83.133 | 82.347 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 82.933 | 83.133 | 83.233 | 83.233 | 82.158 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 92 | 0.167 | 1.167 | 2.367 | 2.367 | 0.213 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.267 | 1.467 | 4.767 | 7.967 | 0.388 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 92 | 0.167 | 1.167 | 2.367 | 2.367 | 0.213 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 0.267 | 1.467 | 7.967 | 7.967 | 0.386 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 0.600 | 0.600 | 0.600 | 0.600 | 0.600 |  |
| queue.wait | ms | warm | 92 | 83.400 | 84.300 | 84.900 | 84.900 | 83.159 | 1 of 1 |
| queue.wait | ms | cold | 100 | 83.400 | 84.500 | 86.800 | 91.300 | 82.492 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 92 | 83.400 | 84.300 | 84.900 | 84.900 | 83.159 |  |
| queue.wait [pose-only] | ms | cold | 99 | 83.400 | 84.600 | 91.300 | 91.300 | 83.252 |  |
| queue.wait [static-install] | ms | cold | 1 | 7.300 | 7.300 | 7.300 | 7.300 | 7.300 |  |
| shard.compute | ms | warm | 184 | 0.100 | 0.300 | 11.100 | 11.400 | 0.239 | 1 of 1 |
| shard.compute | ms | cold | 200 | 0.100 | 1.900 | 11.800 | 15.300 | 0.504 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 184 | 0.100 | 0.300 | 11.100 | 11.400 | 0.239 |  |
| shard.compute [pose-only] | ms | cold | 198 | 0.100 | 1.800 | 11.900 | 15.300 | 0.448 |  |
| shard.compute [static-install] | ms | cold | 2 | 3.200 | 8.900 | 8.900 | 8.900 | 6.050 |  |
| shard.post | ms | warm | 184 | 0.000 | 0.100 | 1.400 | 3.200 | 0.055 | 1 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.300 | 0.500 | 5.500 | 0.074 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 1.400 | 3.200 | 0.055 |  |
| shard.post [pose-only] | ms | cold | 198 | 0.000 | 0.300 | 1.100 | 5.500 | 0.074 |  |
| shard.post [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.reply-post | ms | warm | 184 | 0.000 | 0.200 | 2.300 | 3.600 | 0.102 | 1 of 1 |
| shard.reply-post | ms | cold | 200 | 0.000 | 0.300 | 1.300 | 2.600 | 0.080 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 184 | 0.000 | 0.200 | 2.300 | 3.600 | 0.102 |  |
| shard.reply-post [pose-only] | ms | cold | 198 | 0.000 | 0.300 | 1.500 | 2.600 | 0.080 |  |
| shard.reply-post [static-install] | ms | cold | 2 | 0.000 | 0.200 | 0.200 | 0.200 | 0.100 |  |
| shard.roundtrip | ms | warm | 184 | 0.300 | 1.400 | 17.000 | 21.400 | 0.739 | 1 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.300 | 4.500 | 28.800 | 38.900 | 1.467 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 184 | 0.300 | 1.400 | 17.000 | 21.400 | 0.739 |  |
| shard.roundtrip [pose-only] | ms | cold | 198 | 0.300 | 4.200 | 23.600 | 28.800 | 1.104 |  |
| shard.roundtrip [static-install] | ms | cold | 2 | 36.000 | 38.900 | 38.900 | 38.900 | 37.450 |  |
| shard.transport | ms | warm | 184 | 0.200 | 0.900 | 5.500 | 7.600 | 0.360 | 1 of 1 |
| shard.transport | ms | cold | 200 | 0.200 | 2.600 | 17.000 | 32.600 | 0.845 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 184 | 0.200 | 0.900 | 5.500 | 7.600 | 0.360 |  |
| shard.transport [pose-only] | ms | cold | 198 | 0.200 | 2.500 | 10.800 | 17.000 | 0.538 |  |
| shard.transport [static-install] | ms | cold | 2 | 29.900 | 32.600 | 32.600 | 32.600 | 31.250 |  |
| shard.worker-deserialize | ms | warm | 184 | 0.000 | 0.100 | 0.600 | 1.100 | 0.039 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.200 | 0.400 | 0.600 | 0.038 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 0.600 | 1.100 | 0.039 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.200 | 0.500 | 0.600 | 0.038 |  |
| shard.worker-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |

## TS-W TC02_STATIC_EDIT_TAPE pass=clean boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1104 coalesced=0 dispatched=1104 completed=1104 accepted=1104 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.decide | ms | warm | 1004 | 0.000 | 0.000 | 0.000 | 0.100 | 0.000 | 0 of 1 |
| accept.decide | ms | cold | 100 | 0.000 | 0.000 | 0.000 | 0.100 | 0.001 | 0 of 1 |
| accept.decide [pose-only] | ms | warm | 461 | 0.000 | 0.000 | 0.000 | 0.100 | 0.000 |  |
| accept.decide [pose-only] | ms | cold | 45 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| accept.decide [static-install] | ms | warm | 543 | 0.000 | 0.000 | 0.000 | 0.100 | 0.000 |  |
| accept.decide [static-install] | ms | cold | 55 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| dispatch.prepare | ms | warm | 1004 | 0.100 | 0.200 | 0.300 | 11.200 | 0.119 | 0 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.100 | 0.300 | 1.100 | 1.600 | 0.159 | 0 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 461 | 0.100 | 0.200 | 0.200 | 11.200 | 0.106 |  |
| dispatch.prepare [pose-only] | ms | cold | 45 | 0.100 | 0.200 | 0.800 | 0.800 | 0.100 |  |
| dispatch.prepare [static-install] | ms | warm | 543 | 0.100 | 0.200 | 0.300 | 0.900 | 0.130 |  |
| dispatch.prepare [static-install] | ms | cold | 55 | 0.200 | 0.500 | 1.600 | 1.600 | 0.207 |  |
| install.ack-roundtrip | ms | warm | 1086 | 0.200 | 0.400 | 0.600 | 3.700 | 0.255 | 0 of 1 |
| install.ack-roundtrip | ms | cold | 110 | 0.200 | 0.600 | 7.100 | 7.400 | 0.383 | 0 of 1 |
| install.ack-roundtrip [static-install] | ms | warm | 1086 | 0.200 | 0.400 | 0.600 | 3.700 | 0.255 |  |
| install.ack-roundtrip [static-install] | ms | cold | 110 | 0.200 | 0.600 | 7.100 | 7.400 | 0.383 |  |
| install.post | ms | warm | 1086 | 0.000 | 0.100 | 0.200 | 0.900 | 0.051 | 0 of 1 |
| install.post | ms | cold | 110 | 0.000 | 0.100 | 0.500 | 0.500 | 0.055 | 0 of 1 |
| install.post [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.200 | 0.900 | 0.051 |  |
| install.post [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.500 | 0.500 | 0.055 |  |
| install.worker-deserialize | ms | warm | 1086 | 0.000 | 0.100 | 0.200 | 1.100 | 0.049 | 0 of 1 |
| install.worker-deserialize | ms | cold | 110 | 0.000 | 0.100 | 0.400 | 0.500 | 0.042 | 0 of 1 |
| install.worker-deserialize [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.200 | 1.100 | 0.049 |  |
| install.worker-deserialize [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.400 | 0.500 | 0.042 |  |
| job.phase-residual | ms | warm | 896 | 0.000 | 0.000 | 0.100 | 0.100 | -0.002 | 1 of 1 |
| job.phase-residual | ms | cold | 86 | 0.000 | 0.100 | 0.100 | 0.100 | 0.002 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 414 | 0.000 | 0.000 | 0.000 | 0.100 | -0.006 |  |
| job.phase-residual [pose-only] | ms | cold | 43 | 0.000 | 0.000 | 0.000 | 0.000 | -0.002 |  |
| job.phase-residual [static-install] | ms | warm | 482 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 |  |
| job.phase-residual [static-install] | ms | cold | 43 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 |  |
| job.submit-to-accepted | ms | warm | 1004 | 92.700 | 95.100 | 97.300 | 99.600 | 90.924 | 0 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 92.900 | 95.600 | 99.300 | 100.100 | 90.562 | 0 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 461 | 92.600 | 95.100 | 97.300 | 99.300 | 90.692 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 45 | 92.900 | 95.600 | 99.300 | 99.300 | 91.104 |  |
| job.submit-to-accepted [static-install] | ms | warm | 543 | 92.800 | 95.200 | 97.700 | 99.600 | 91.122 |  |
| job.submit-to-accepted [static-install] | ms | cold | 55 | 92.900 | 96.900 | 100.100 | 100.100 | 90.118 |  |
| merge.assemble | ms | warm | 896 | 0.000 | 0.000 | 0.100 | 0.100 | 0.003 | 1 of 1 |
| merge.assemble | ms | cold | 86 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 414 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| merge.assemble [pose-only] | ms | cold | 43 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 |  |
| merge.assemble [static-install] | ms | warm | 482 | 0.000 | 0.000 | 0.100 | 0.100 | 0.004 |  |
| merge.assemble [static-install] | ms | cold | 43 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 |  |
| merge.reply-deserialize | ms | warm | 2008 | 0.000 | 0.100 | 0.100 | 0.500 | 0.014 | 0 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.400 | 0.400 | 0.019 | 0 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 922 | 0.000 | 0.100 | 0.100 | 0.500 | 0.016 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.400 | 0.400 | 0.020 |  |
| merge.reply-deserialize [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.100 | 0.400 | 0.013 |  |
| merge.reply-deserialize [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.400 | 0.400 | 0.019 |  |
| merge.validate | ms | warm | 2008 | 0.000 | 0.100 | 0.300 | 1.300 | 0.054 | 0 of 1 |
| merge.validate | ms | cold | 200 | 0.100 | 0.400 | 1.200 | 2.000 | 0.106 | 0 of 1 |
| merge.validate [pose-only] | ms | warm | 922 | 0.000 | 0.100 | 0.200 | 0.900 | 0.051 |  |
| merge.validate [pose-only] | ms | cold | 90 | 0.100 | 0.200 | 1.200 | 1.200 | 0.083 |  |
| merge.validate [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.300 | 1.300 | 0.057 |  |
| merge.validate [static-install] | ms | cold | 110 | 0.100 | 0.500 | 1.700 | 2.000 | 0.125 |  |
| pool.compute-metric | ms | warm | 1004 | 0.600 | 1.000 | 1.900 | 12.800 | 0.663 | 0 of 1 |
| pool.compute-metric | ms | cold | 100 | 0.600 | 1.900 | 9.900 | 16.200 | 0.977 | 0 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 461 | 0.500 | 0.800 | 2.200 | 12.800 | 0.601 |  |
| pool.compute-metric [pose-only] | ms | cold | 45 | 0.500 | 1.100 | 7.800 | 7.800 | 0.718 |  |
| pool.compute-metric [static-install] | ms | warm | 543 | 0.700 | 1.100 | 1.900 | 9.800 | 0.716 |  |
| pool.compute-metric [static-install] | ms | cold | 55 | 0.600 | 2.700 | 16.200 | 16.200 | 1.189 |  |
| pool.shard-max | ms | warm | 1004 | 0.100 | 0.300 | 0.400 | 1.800 | 0.138 | 0 of 1 |
| pool.shard-max | ms | cold | 100 | 0.100 | 0.600 | 2.400 | 7.500 | 0.245 | 0 of 1 |
| pool.shard-max [pose-only] | ms | warm | 461 | 0.100 | 0.300 | 0.400 | 0.600 | 0.131 |  |
| pool.shard-max [pose-only] | ms | cold | 45 | 0.100 | 0.400 | 2.400 | 2.400 | 0.171 |  |
| pool.shard-max [static-install] | ms | warm | 543 | 0.100 | 0.300 | 0.400 | 1.800 | 0.144 |  |
| pool.shard-max [static-install] | ms | cold | 55 | 0.100 | 0.800 | 7.500 | 7.500 | 0.305 |  |
| pool.shard-total | ms | warm | 1004 | 0.200 | 0.500 | 0.700 | 2.500 | 0.223 | 0 of 1 |
| pool.shard-total | ms | cold | 100 | 0.200 | 0.600 | 3.900 | 9.600 | 0.372 | 0 of 1 |
| pool.shard-total [pose-only] | ms | warm | 461 | 0.200 | 0.400 | 0.700 | 1.000 | 0.215 |  |
| pool.shard-total [pose-only] | ms | cold | 45 | 0.200 | 0.600 | 3.900 | 3.900 | 0.273 |  |
| pool.shard-total [static-install] | ms | warm | 543 | 0.200 | 0.500 | 0.700 | 2.500 | 0.230 |  |
| pool.shard-total [static-install] | ms | cold | 55 | 0.200 | 1.400 | 9.600 | 9.600 | 0.453 |  |
| queue.client | ms | warm | 1004 | 0.200 | 0.400 | 0.800 | 3.700 | 0.240 | 0 of 1 |
| queue.client | ms | cold | 100 | 0.200 | 0.500 | 2.800 | 5.600 | 0.293 | 0 of 1 |
| queue.rate-limit | ms | warm | 1004 | 83.133 | 83.233 | 83.233 | 83.333 | 83.025 | 0 of 1 |
| queue.rate-limit | ms | cold | 100 | 83.133 | 83.233 | 83.233 | 83.233 | 82.127 | 0 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 461 | 83.133 | 83.233 | 83.233 | 83.333 | 83.056 |  |
| queue.rate-limit [pose-only] | ms | cold | 45 | 83.133 | 83.233 | 83.233 | 83.233 | 82.962 |  |
| queue.rate-limit [static-install] | ms | warm | 543 | 83.133 | 83.233 | 83.233 | 83.233 | 82.999 |  |
| queue.rate-limit [static-install] | ms | cold | 55 | 83.033 | 83.233 | 83.233 | 83.233 | 81.444 |  |
| queue.timer-lateness | ms | warm | 1004 | 8.767 | 11.167 | 12.867 | 15.467 | 6.974 | 0 of 1 |
| queue.timer-lateness | ms | cold | 100 | 8.967 | 11.767 | 15.167 | 16.267 | 7.128 | 0 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 461 | 8.667 | 11.067 | 12.867 | 15.467 | 6.771 |  |
| queue.timer-lateness [pose-only] | ms | cold | 45 | 8.767 | 11.767 | 15.167 | 15.167 | 7.073 |  |
| queue.timer-lateness [static-install] | ms | warm | 543 | 8.867 | 11.167 | 13.167 | 15.367 | 7.145 |  |
| queue.timer-lateness [static-install] | ms | cold | 55 | 8.967 | 12.467 | 16.267 | 16.267 | 7.173 |  |
| queue.wait | ms | warm | 1004 | 92.000 | 94.400 | 96.200 | 98.800 | 90.241 | 0 of 1 |
| queue.wait | ms | cold | 100 | 92.200 | 95.000 | 98.500 | 99.600 | 89.554 | 0 of 1 |
| queue.wait [pose-only] | ms | warm | 461 | 92.000 | 94.300 | 96.200 | 98.800 | 90.071 |  |
| queue.wait [pose-only] | ms | cold | 45 | 92.100 | 95.000 | 98.500 | 98.500 | 90.362 |  |
| queue.wait [static-install] | ms | warm | 543 | 92.100 | 94.400 | 96.500 | 98.700 | 90.386 |  |
| queue.wait [static-install] | ms | cold | 55 | 92.200 | 95.600 | 99.600 | 99.600 | 88.893 |  |
| shard.compute | ms | warm | 2008 | 0.100 | 0.300 | 0.400 | 1.800 | 0.112 | 0 of 1 |
| shard.compute | ms | cold | 200 | 0.100 | 0.400 | 2.100 | 7.500 | 0.186 | 0 of 1 |
| shard.compute [pose-only] | ms | warm | 922 | 0.100 | 0.200 | 0.300 | 0.600 | 0.108 |  |
| shard.compute [pose-only] | ms | cold | 90 | 0.100 | 0.300 | 2.400 | 2.400 | 0.137 |  |
| shard.compute [static-install] | ms | warm | 1086 | 0.100 | 0.300 | 0.400 | 1.800 | 0.115 |  |
| shard.compute [static-install] | ms | cold | 110 | 0.100 | 0.600 | 2.100 | 7.500 | 0.226 |  |
| shard.post | ms | warm | 2008 | 0.000 | 0.100 | 0.200 | 1.400 | 0.025 | 0 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.700 | 0.024 | 0 of 1 |
| shard.post [pose-only] | ms | warm | 922 | 0.000 | 0.100 | 0.200 | 0.400 | 0.038 |  |
| shard.post [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.700 | 0.700 | 0.044 |  |
| shard.post [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.100 | 1.400 | 0.013 |  |
| shard.post [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.100 | 0.008 |  |
| shard.reply-post | ms | warm | 2008 | 0.000 | 0.100 | 0.200 | 0.400 | 0.039 | 0 of 1 |
| shard.reply-post | ms | cold | 200 | 0.000 | 0.100 | 0.400 | 0.600 | 0.042 | 0 of 1 |
| shard.reply-post [pose-only] | ms | warm | 922 | 0.000 | 0.100 | 0.200 | 0.400 | 0.047 |  |
| shard.reply-post [pose-only] | ms | cold | 90 | 0.000 | 0.200 | 0.600 | 0.600 | 0.054 |  |
| shard.reply-post [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.200 | 0.300 | 0.033 |  |
| shard.reply-post [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.400 | 0.500 | 0.032 |  |
| shard.roundtrip | ms | warm | 2008 | 0.300 | 0.600 | 1.200 | 6.800 | 0.381 | 0 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.300 | 0.900 | 6.000 | 14.900 | 0.545 | 0 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 922 | 0.300 | 0.600 | 1.300 | 3.200 | 0.376 |  |
| shard.roundtrip [pose-only] | ms | cold | 90 | 0.300 | 0.700 | 6.000 | 6.000 | 0.426 |  |
| shard.roundtrip [static-install] | ms | warm | 1086 | 0.300 | 0.700 | 1.100 | 6.800 | 0.385 |  |
| shard.roundtrip [static-install] | ms | cold | 110 | 0.300 | 1.200 | 9.200 | 14.900 | 0.643 |  |
| shard.transport | ms | warm | 2008 | 0.200 | 0.400 | 0.700 | 5.100 | 0.205 | 0 of 1 |
| shard.transport | ms | cold | 200 | 0.200 | 0.400 | 4.400 | 7.400 | 0.293 | 0 of 1 |
| shard.transport [pose-only] | ms | warm | 922 | 0.200 | 0.400 | 0.700 | 2.200 | 0.186 |  |
| shard.transport [pose-only] | ms | cold | 90 | 0.200 | 0.400 | 2.600 | 2.600 | 0.198 |  |
| shard.transport [static-install] | ms | warm | 1086 | 0.200 | 0.400 | 0.700 | 5.100 | 0.222 |  |
| shard.transport [static-install] | ms | cold | 110 | 0.200 | 0.800 | 7.100 | 7.400 | 0.371 |  |
| shard.worker-deserialize | ms | warm | 2008 | 0.000 | 0.100 | 0.100 | 0.400 | 0.025 | 0 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.400 | 0.024 | 0 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 922 | 0.000 | 0.100 | 0.100 | 0.200 | 0.035 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.400 | 0.400 | 0.037 |  |
| shard.worker-deserialize [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.100 | 0.400 | 0.016 |  |
| shard.worker-deserialize [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.200 | 0.014 |  |

## TS-W TC02_STATIC_EDIT_TAPE pass=traced boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=144 coalesced=0 dispatched=144 completed=144 accepted=144 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.decide | ms | warm | 44 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 1 of 1 |
| accept.decide | ms | cold | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 1 of 1 |
| accept.decide [pose-only] | ms | warm | 21 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| accept.decide [pose-only] | ms | cold | 45 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| accept.decide [static-install] | ms | warm | 23 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| accept.decide [static-install] | ms | cold | 55 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| dispatch.prepare | ms | warm | 44 | 0.100 | 0.200 | 0.200 | 0.200 | 0.084 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.100 | 0.200 | 0.300 | 1.400 | 0.109 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 21 | 0.100 | 0.100 | 0.100 | 0.100 | 0.062 |  |
| dispatch.prepare [pose-only] | ms | cold | 45 | 0.100 | 0.200 | 0.200 | 0.200 | 0.076 |  |
| dispatch.prepare [static-install] | ms | warm | 23 | 0.100 | 0.200 | 0.200 | 0.200 | 0.104 |  |
| dispatch.prepare [static-install] | ms | cold | 55 | 0.100 | 0.300 | 1.400 | 1.400 | 0.136 |  |
| install.ack-roundtrip | ms | warm | 46 | 0.200 | 0.500 | 0.700 | 0.700 | 0.224 | 1 of 1 |
| install.ack-roundtrip | ms | cold | 110 | 0.200 | 0.700 | 9.300 | 10.800 | 0.434 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | warm | 46 | 0.200 | 0.500 | 0.700 | 0.700 | 0.224 |  |
| install.ack-roundtrip [static-install] | ms | cold | 110 | 0.200 | 0.700 | 9.300 | 10.800 | 0.434 |  |
| install.post | ms | warm | 46 | 0.000 | 0.100 | 0.200 | 0.200 | 0.026 | 1 of 1 |
| install.post | ms | cold | 110 | 0.000 | 0.100 | 0.200 | 0.200 | 0.037 | 1 of 1 |
| install.post [static-install] | ms | warm | 46 | 0.000 | 0.100 | 0.200 | 0.200 | 0.026 |  |
| install.post [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.200 | 0.200 | 0.037 |  |
| install.worker-deserialize | ms | warm | 46 | 0.000 | 0.100 | 0.100 | 0.100 | 0.022 | 1 of 1 |
| install.worker-deserialize | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.200 | 0.029 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | warm | 46 | 0.000 | 0.100 | 0.100 | 0.100 | 0.022 |  |
| install.worker-deserialize [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.200 | 0.029 |  |
| job.phase-residual | ms | warm | 35 | 0.000 | 0.100 | 0.200 | 0.200 | 0.009 | 1 of 1 |
| job.phase-residual | ms | cold | 90 | 0.000 | 0.100 | 0.100 | 0.100 | 0.010 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 16 | 0.000 | 0.000 | 0.000 | 0.000 | -0.006 |  |
| job.phase-residual [pose-only] | ms | cold | 38 | 0.000 | 0.100 | 0.100 | 0.100 | 0.003 |  |
| job.phase-residual [static-install] | ms | warm | 19 | 0.000 | 0.200 | 0.200 | 0.200 | 0.021 |  |
| job.phase-residual [static-install] | ms | cold | 52 | 0.000 | 0.100 | 0.100 | 0.100 | 0.015 |  |
| job.submit-to-accepted | ms | warm | 44 | 83.900 | 84.900 | 85.000 | 85.000 | 83.820 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 84.200 | 85.300 | 85.600 | 86.100 | 83.662 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 21 | 83.900 | 84.900 | 84.900 | 84.900 | 83.848 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 45 | 84.200 | 85.400 | 85.600 | 85.600 | 84.249 |  |
| job.submit-to-accepted [static-install] | ms | warm | 23 | 83.900 | 84.800 | 85.000 | 85.000 | 83.796 |  |
| job.submit-to-accepted [static-install] | ms | cold | 55 | 84.300 | 85.300 | 86.100 | 86.100 | 83.182 |  |
| merge.assemble | ms | warm | 35 | 0.000 | 0.100 | 0.100 | 0.100 | 0.006 | 1 of 1 |
| merge.assemble | ms | cold | 90 | 0.000 | 0.100 | 0.200 | 0.200 | 0.009 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 16 | 0.000 | 0.100 | 0.100 | 0.100 | 0.006 |  |
| merge.assemble [pose-only] | ms | cold | 38 | 0.000 | 0.100 | 0.100 | 0.100 | 0.005 |  |
| merge.assemble [static-install] | ms | warm | 19 | 0.000 | 0.100 | 0.100 | 0.100 | 0.005 |  |
| merge.assemble [static-install] | ms | cold | 52 | 0.000 | 0.100 | 0.200 | 0.200 | 0.012 |  |
| merge.reply-deserialize | ms | warm | 88 | 0.000 | 0.100 | 0.100 | 0.100 | 0.014 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.200 | 0.014 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 42 | 0.000 | 0.100 | 0.100 | 0.100 | 0.012 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.200 | 0.200 | 0.014 |  |
| merge.reply-deserialize [static-install] | ms | warm | 46 | 0.000 | 0.100 | 0.100 | 0.100 | 0.015 |  |
| merge.reply-deserialize [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.200 | 0.014 |  |
| merge.validate | ms | warm | 88 | 0.100 | 0.200 | 0.200 | 0.200 | 0.067 | 1 of 1 |
| merge.validate | ms | cold | 200 | 0.100 | 0.300 | 0.400 | 2.700 | 0.098 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 42 | 0.000 | 0.200 | 0.200 | 0.200 | 0.057 |  |
| merge.validate [pose-only] | ms | cold | 90 | 0.100 | 0.200 | 0.400 | 0.400 | 0.080 |  |
| merge.validate [static-install] | ms | warm | 46 | 0.100 | 0.200 | 0.200 | 0.200 | 0.076 |  |
| merge.validate [static-install] | ms | cold | 110 | 0.100 | 0.300 | 0.400 | 2.700 | 0.112 |  |
| pool.compute-metric | ms | warm | 44 | 0.500 | 1.000 | 1.600 | 1.600 | 0.568 | 1 of 1 |
| pool.compute-metric | ms | cold | 100 | 0.500 | 1.700 | 2.200 | 21.400 | 0.892 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 21 | 0.400 | 0.800 | 0.900 | 0.900 | 0.481 |  |
| pool.compute-metric [pose-only] | ms | cold | 45 | 0.400 | 1.600 | 1.800 | 1.800 | 0.624 |  |
| pool.compute-metric [static-install] | ms | warm | 23 | 0.600 | 1.100 | 1.600 | 1.600 | 0.648 |  |
| pool.compute-metric [static-install] | ms | cold | 55 | 0.600 | 2.100 | 21.400 | 21.400 | 1.111 |  |
| pool.shard-max | ms | warm | 44 | 0.100 | 0.200 | 0.400 | 0.400 | 0.109 | 1 of 1 |
| pool.shard-max | ms | cold | 100 | 0.100 | 0.500 | 0.800 | 8.800 | 0.224 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 21 | 0.100 | 0.200 | 0.400 | 0.400 | 0.110 |  |
| pool.shard-max [pose-only] | ms | cold | 45 | 0.100 | 0.400 | 0.800 | 0.800 | 0.136 |  |
| pool.shard-max [static-install] | ms | warm | 23 | 0.100 | 0.200 | 0.300 | 0.300 | 0.109 |  |
| pool.shard-max [static-install] | ms | cold | 55 | 0.100 | 0.500 | 8.800 | 8.800 | 0.296 |  |
| pool.shard-total | ms | warm | 44 | 0.100 | 0.400 | 0.500 | 0.500 | 0.155 | 1 of 1 |
| pool.shard-total | ms | cold | 100 | 0.100 | 0.800 | 1.000 | 11.700 | 0.315 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 21 | 0.200 | 0.300 | 0.500 | 0.500 | 0.162 |  |
| pool.shard-total [pose-only] | ms | cold | 45 | 0.200 | 0.700 | 1.000 | 1.000 | 0.209 |  |
| pool.shard-total [static-install] | ms | warm | 23 | 0.100 | 0.400 | 0.400 | 0.400 | 0.148 |  |
| pool.shard-total [static-install] | ms | cold | 55 | 0.100 | 0.800 | 11.700 | 11.700 | 0.402 |  |
| queue.client | ms | warm | 44 | 0.300 | 0.600 | 0.700 | 0.700 | 0.318 | 1 of 1 |
| queue.client | ms | cold | 100 | 0.200 | 0.900 | 5.500 | 17.600 | 0.533 | 1 of 1 |
| queue.rate-limit | ms | warm | 44 | 82.933 | 83.133 | 83.133 | 83.133 | 82.847 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 83.033 | 83.133 | 83.133 | 83.133 | 81.881 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 21 | 82.933 | 83.133 | 83.133 | 83.133 | 82.943 |  |
| queue.rate-limit [pose-only] | ms | cold | 45 | 83.033 | 83.133 | 83.133 | 83.133 | 82.947 |  |
| queue.rate-limit [static-install] | ms | warm | 23 | 82.933 | 83.133 | 83.133 | 83.133 | 82.759 |  |
| queue.rate-limit [static-install] | ms | cold | 55 | 83.033 | 83.133 | 83.133 | 83.133 | 81.009 |  |
| queue.timer-lateness | ms | warm | 44 | 0.067 | 1.067 | 1.167 | 1.167 | 0.053 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.267 | 1.167 | 1.167 | 1.167 | 0.314 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 21 | 0.067 | 1.067 | 1.167 | 1.167 | 0.071 |  |
| queue.timer-lateness [pose-only] | ms | cold | 45 | 0.267 | 1.067 | 1.167 | 1.167 | 0.333 |  |
| queue.timer-lateness [static-install] | ms | warm | 23 | 0.067 | 0.667 | 1.167 | 1.167 | 0.036 |  |
| queue.timer-lateness [static-install] | ms | cold | 55 | 0.267 | 1.167 | 1.167 | 1.167 | 0.298 |  |
| queue.wait | ms | warm | 44 | 83.300 | 84.400 | 84.500 | 84.500 | 83.227 | 1 of 1 |
| queue.wait | ms | cold | 100 | 83.600 | 84.400 | 84.400 | 84.500 | 82.737 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 21 | 83.400 | 84.400 | 84.500 | 84.500 | 83.343 |  |
| queue.wait [pose-only] | ms | cold | 45 | 83.600 | 84.400 | 84.400 | 84.400 | 83.593 |  |
| queue.wait [static-install] | ms | warm | 23 | 83.300 | 84.000 | 84.500 | 84.500 | 83.122 |  |
| queue.wait [static-install] | ms | cold | 55 | 83.600 | 84.400 | 84.500 | 84.500 | 82.036 |  |
| shard.compute | ms | warm | 88 | 0.100 | 0.200 | 0.400 | 0.400 | 0.077 | 1 of 1 |
| shard.compute | ms | cold | 200 | 0.100 | 0.400 | 0.800 | 8.800 | 0.158 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 42 | 0.100 | 0.200 | 0.400 | 0.400 | 0.081 |  |
| shard.compute [pose-only] | ms | cold | 90 | 0.100 | 0.300 | 0.800 | 0.800 | 0.104 |  |
| shard.compute [static-install] | ms | warm | 46 | 0.100 | 0.200 | 0.300 | 0.300 | 0.074 |  |
| shard.compute [static-install] | ms | cold | 110 | 0.100 | 0.400 | 2.900 | 8.800 | 0.201 |  |
| shard.post | ms | warm | 88 | 0.000 | 0.100 | 0.100 | 0.100 | 0.011 | 1 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.100 | 0.014 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 42 | 0.000 | 0.100 | 0.100 | 0.100 | 0.021 |  |
| shard.post [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.100 | 0.100 | 0.026 |  |
| shard.post [static-install] | ms | warm | 46 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| shard.post [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.100 | 0.005 |  |
| shard.reply-post | ms | warm | 88 | 0.000 | 0.100 | 0.200 | 0.200 | 0.031 | 1 of 1 |
| shard.reply-post | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.200 | 0.025 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 42 | 0.000 | 0.100 | 0.200 | 0.200 | 0.033 |  |
| shard.reply-post [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.200 | 0.200 | 0.030 |  |
| shard.reply-post [static-install] | ms | warm | 46 | 0.000 | 0.100 | 0.200 | 0.200 | 0.028 |  |
| shard.reply-post [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.100 | 0.022 |  |
| shard.roundtrip | ms | warm | 88 | 0.300 | 0.700 | 1.100 | 1.100 | 0.333 | 1 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.300 | 1.000 | 1.400 | 19.700 | 0.542 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 42 | 0.300 | 0.600 | 0.700 | 0.700 | 0.307 |  |
| shard.roundtrip [pose-only] | ms | cold | 90 | 0.300 | 1.100 | 1.300 | 1.300 | 0.381 |  |
| shard.roundtrip [static-install] | ms | warm | 46 | 0.300 | 0.700 | 1.100 | 1.100 | 0.357 |  |
| shard.roundtrip [static-install] | ms | cold | 110 | 0.300 | 1.000 | 12.300 | 19.700 | 0.673 |  |
| shard.transport | ms | warm | 88 | 0.200 | 0.500 | 0.700 | 0.700 | 0.211 | 1 of 1 |
| shard.transport | ms | cold | 200 | 0.200 | 0.600 | 1.100 | 10.800 | 0.345 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 42 | 0.200 | 0.300 | 0.500 | 0.500 | 0.171 |  |
| shard.transport [pose-only] | ms | cold | 90 | 0.200 | 0.600 | 0.900 | 0.900 | 0.224 |  |
| shard.transport [static-install] | ms | warm | 46 | 0.200 | 0.500 | 0.700 | 0.700 | 0.248 |  |
| shard.transport [static-install] | ms | cold | 110 | 0.200 | 0.700 | 9.200 | 10.800 | 0.444 |  |
| shard.worker-deserialize | ms | warm | 88 | 0.000 | 0.100 | 0.100 | 0.100 | 0.014 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.200 | 0.013 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 42 | 0.000 | 0.100 | 0.100 | 0.100 | 0.021 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.200 | 0.200 | 0.022 |  |
| shard.worker-deserialize [static-install] | ms | warm | 46 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 |  |
| shard.worker-deserialize [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.100 | 0.006 |  |

## TS-W TH01_LISTENER_TAPE_SEEDED pass=alloc boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=192 coalesced=0 dispatched=192 completed=192 accepted=192 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 92 | 0.100 | 0.200 | 0.500 | 0.500 | 0.064 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.100 | 0.200 | 0.300 | 0.700 | 0.068 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 92 | 0.100 | 0.200 | 0.500 | 0.500 | 0.064 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.100 | 0.200 | 0.700 | 0.700 | 0.066 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 0.300 | 0.300 | 0.300 | 0.300 | 0.300 |  |
| display.derive | ms | warm | 92 | 0.000 | 0.100 | 0.200 | 0.200 | 0.048 | 1 of 1 |
| display.derive | ms | cold | 100 | 0.100 | 0.400 | 1.200 | 2.400 | 0.156 | 1 of 1 |
| display.derive [pose-only] | ms | warm | 92 | 0.000 | 0.100 | 0.200 | 0.200 | 0.048 |  |
| display.derive [pose-only] | ms | cold | 99 | 0.100 | 0.400 | 2.400 | 2.400 | 0.145 |  |
| display.derive [static-install] | ms | cold | 1 | 1.200 | 1.200 | 1.200 | 1.200 | 1.200 |  |
| input.project | ms | warm | 92 | 0.300 | 0.600 | 1.600 | 1.600 | 0.297 | 1 of 1 |
| input.project | ms | cold | 100 | 0.300 | 1.000 | 7.700 | 8.100 | 0.518 | 1 of 1 |
| install.ack-roundtrip | ms | cold | 2 | 6.000 | 7.200 | 7.200 | 7.200 | 6.600 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 2 | 6.000 | 7.200 | 7.200 | 7.200 | 6.600 |  |
| install.post | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 | 1 of 1 |
| install.post [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |
| install.worker-deserialize | ms | cold | 2 | 0.200 | 0.200 | 0.200 | 0.200 | 0.200 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 2 | 0.200 | 0.200 | 0.200 | 0.200 | 0.200 |  |
| job.phase-residual | ms | warm | 91 | 0.000 | 0.000 | 0.100 | 0.100 | -0.002 | 1 of 1 |
| job.phase-residual | ms | cold | 99 | 0.000 | 0.100 | 0.100 | 0.100 | -0.003 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 91 | 0.000 | 0.000 | 0.100 | 0.100 | -0.002 |  |
| job.phase-residual [pose-only] | ms | cold | 98 | 0.000 | 0.100 | 0.100 | 0.100 | -0.002 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.100 | -0.100 | -0.100 | -0.100 | -0.100 |  |
| job.submit-to-accepted | ms | warm | 92 | 92.900 | 94.800 | 95.800 | 95.800 | 92.968 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 92.500 | 95.500 | 98.300 | 101.600 | 92.142 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 92 | 92.900 | 94.800 | 95.800 | 95.800 | 92.968 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 99 | 92.500 | 95.800 | 101.600 | 101.600 | 92.886 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 18.500 | 18.500 | 18.500 | 18.500 | 18.500 |  |
| merge.assemble | ms | warm | 91 | 0.000 | 0.100 | 0.100 | 0.100 | 0.008 | 1 of 1 |
| merge.assemble | ms | cold | 99 | 0.000 | 0.100 | 0.200 | 0.200 | 0.015 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 91 | 0.000 | 0.100 | 0.100 | 0.100 | 0.008 |  |
| merge.assemble [pose-only] | ms | cold | 98 | 0.000 | 0.100 | 0.200 | 0.200 | 0.014 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| merge.reply-deserialize | ms | warm | 184 | 0.000 | 0.100 | 0.100 | 0.200 | 0.022 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.500 | 0.024 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 0.100 | 0.200 | 0.022 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.200 | 0.500 | 0.024 |  |
| merge.reply-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| merge.validate | ms | warm | 184 | 0.100 | 0.200 | 0.400 | 0.400 | 0.105 | 1 of 1 |
| merge.validate | ms | cold | 200 | 0.100 | 0.400 | 1.500 | 2.500 | 0.171 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 184 | 0.100 | 0.200 | 0.400 | 0.400 | 0.105 |  |
| merge.validate [pose-only] | ms | cold | 198 | 0.100 | 0.400 | 1.700 | 2.500 | 0.166 |  |
| merge.validate [static-install] | ms | cold | 2 | 0.500 | 0.800 | 0.800 | 0.800 | 0.650 |  |
| pool.compute-metric | ms | warm | 92 | 0.800 | 1.500 | 1.900 | 1.900 | 0.915 | 1 of 1 |
| pool.compute-metric | ms | cold | 100 | 1.000 | 2.600 | 10.000 | 15.800 | 1.392 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 92 | 0.800 | 1.500 | 1.900 | 1.900 | 0.915 |  |
| pool.compute-metric [pose-only] | ms | cold | 99 | 1.000 | 2.600 | 15.800 | 15.800 | 1.305 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 10.000 | 10.000 | 10.000 | 10.000 | 10.000 |  |
| pool.shard-max | ms | warm | 92 | 0.300 | 0.900 | 1.200 | 1.200 | 0.399 | 1 of 1 |
| pool.shard-max | ms | cold | 100 | 0.500 | 1.600 | 5.000 | 9.600 | 0.741 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 92 | 0.300 | 0.900 | 1.200 | 1.200 | 0.399 |  |
| pool.shard-max [pose-only] | ms | cold | 99 | 0.500 | 1.600 | 9.600 | 9.600 | 0.717 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 3.100 | 3.100 | 3.100 | 3.100 | 3.100 |  |
| pool.shard-total | ms | warm | 92 | 0.600 | 1.200 | 1.500 | 1.500 | 0.607 | 1 of 1 |
| pool.shard-total | ms | cold | 100 | 0.800 | 2.100 | 6.400 | 15.700 | 1.087 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 92 | 0.600 | 1.200 | 1.500 | 1.500 | 0.607 |  |
| pool.shard-total [pose-only] | ms | cold | 99 | 0.800 | 2.100 | 15.700 | 15.700 | 1.055 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 4.300 | 4.300 | 4.300 | 4.300 | 4.300 |  |
| queue.rate-limit | ms | warm | 92 | 82.933 | 83.133 | 83.133 | 83.133 | 82.919 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 82.933 | 83.033 | 83.133 | 83.133 | 81.789 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 92 | 82.933 | 83.133 | 83.133 | 83.133 | 82.919 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 82.933 | 83.033 | 83.133 | 83.133 | 82.615 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 92 | 8.667 | 10.567 | 11.867 | 11.867 | 8.808 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 8.367 | 10.667 | 11.767 | 14.467 | 8.400 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 92 | 8.667 | 10.567 | 11.867 | 11.867 | 8.808 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 8.367 | 11.167 | 14.467 | 14.467 | 8.481 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 0.400 | 0.400 | 0.400 | 0.400 | 0.400 |  |
| queue.wait | ms | warm | 92 | 91.700 | 93.600 | 94.900 | 94.900 | 91.730 | 1 of 1 |
| queue.wait | ms | cold | 100 | 91.200 | 93.600 | 94.500 | 95.800 | 90.193 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 92 | 91.700 | 93.600 | 94.900 | 94.900 | 91.730 |  |
| queue.wait [pose-only] | ms | cold | 99 | 91.200 | 94.200 | 95.800 | 95.800 | 91.099 |  |
| queue.wait [static-install] | ms | cold | 1 | 0.500 | 0.500 | 0.500 | 0.500 | 0.500 |  |
| shard.compute | ms | warm | 184 | 0.200 | 0.800 | 1.100 | 1.200 | 0.303 | 1 of 1 |
| shard.compute | ms | cold | 200 | 0.300 | 1.200 | 5.000 | 9.600 | 0.543 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 184 | 0.200 | 0.800 | 1.100 | 1.200 | 0.303 |  |
| shard.compute [pose-only] | ms | cold | 198 | 0.300 | 1.200 | 6.100 | 9.600 | 0.527 |  |
| shard.compute [static-install] | ms | cold | 2 | 1.200 | 3.100 | 3.100 | 3.100 | 2.150 |  |
| shard.post | ms | warm | 184 | 0.000 | 0.100 | 0.100 | 0.100 | 0.035 | 1 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.300 | 0.028 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 0.100 | 0.100 | 0.035 |  |
| shard.post [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.300 | 0.300 | 0.027 |  |
| shard.post [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |
| shard.reply-post | ms | warm | 184 | 0.100 | 0.100 | 0.200 | 0.300 | 0.058 | 1 of 1 |
| shard.reply-post | ms | cold | 200 | 0.000 | 0.200 | 0.300 | 0.400 | 0.056 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 184 | 0.100 | 0.100 | 0.200 | 0.300 | 0.058 |  |
| shard.reply-post [pose-only] | ms | cold | 198 | 0.000 | 0.200 | 0.400 | 0.400 | 0.057 |  |
| shard.reply-post [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.roundtrip | ms | warm | 184 | 0.500 | 1.100 | 1.400 | 1.500 | 0.588 | 1 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.600 | 1.600 | 9.300 | 12.700 | 0.909 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 184 | 0.500 | 1.100 | 1.400 | 1.500 | 0.588 |  |
| shard.roundtrip [pose-only] | ms | cold | 198 | 0.600 | 1.400 | 10.000 | 12.700 | 0.828 |  |
| shard.roundtrip [static-install] | ms | cold | 2 | 8.400 | 9.300 | 9.300 | 9.300 | 8.850 |  |
| shard.transport | ms | warm | 184 | 0.200 | 0.500 | 0.700 | 0.800 | 0.196 | 1 of 1 |
| shard.transport | ms | cold | 200 | 0.200 | 0.500 | 3.200 | 7.200 | 0.283 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 184 | 0.200 | 0.500 | 0.700 | 0.800 | 0.196 |  |
| shard.transport [pose-only] | ms | cold | 198 | 0.200 | 0.500 | 2.400 | 3.200 | 0.218 |  |
| shard.transport [static-install] | ms | cold | 2 | 6.200 | 7.200 | 7.200 | 7.200 | 6.700 |  |
| shard.worker-deserialize | ms | warm | 184 | 0.000 | 0.100 | 0.100 | 0.200 | 0.030 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.300 | 0.026 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 0.100 | 0.200 | 0.030 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.300 | 0.300 | 0.027 |  |
| shard.worker-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |

## TS-W TH01_LISTENER_TAPE_SEEDED pass=bare boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1152 coalesced=0 dispatched=not-applicable completed=1152 accepted=1152 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| job.submit-to-accepted | ms | warm | 1052 | 93.200 | 94.800 | 96.300 | 108.800 | 93.217 | 0 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 93.000 | 95.200 | 96.700 | 101.900 | 92.503 | 0 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 1052 | 93.200 | 94.800 | 96.300 | 108.800 | 93.217 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 99 | 93.100 | 95.400 | 101.900 | 101.900 | 93.127 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 30.700 | 30.700 | 30.700 | 30.700 | 30.700 |  |
| pool.compute-metric | ms | warm | 1052 | 0.700 | 1.300 | 2.400 | 12.000 | 0.814 | 0 of 1 |
| pool.compute-metric | ms | cold | 100 | 1.000 | 3.300 | 11.400 | 16.800 | 1.492 | 0 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 1052 | 0.700 | 1.300 | 2.400 | 12.000 | 0.814 |  |
| pool.compute-metric [pose-only] | ms | cold | 99 | 1.000 | 3.300 | 11.400 | 11.400 | 1.337 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 16.800 | 16.800 | 16.800 | 16.800 | 16.800 |  |

## TS-W TH01_LISTENER_TAPE_SEEDED pass=clean boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1152 coalesced=0 dispatched=1152 completed=1152 accepted=1152 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 1052 | 0.000 | 0.100 | 0.200 | 1.200 | 0.045 | 0 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 1.400 | 0.059 | 0 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 1052 | 0.000 | 0.100 | 0.200 | 1.200 | 0.045 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.100 | 0.100 | 0.045 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 1.400 | 1.400 | 1.400 | 1.400 | 1.400 |  |
| display.derive | ms | warm | 1052 | 0.000 | 0.100 | 0.300 | 1.600 | 0.053 | 0 of 1 |
| display.derive | ms | cold | 100 | 0.100 | 0.200 | 0.500 | 3.600 | 0.112 | 0 of 1 |
| display.derive [pose-only] | ms | warm | 1052 | 0.000 | 0.100 | 0.300 | 1.600 | 0.053 |  |
| display.derive [pose-only] | ms | cold | 99 | 0.100 | 0.200 | 0.500 | 0.500 | 0.077 |  |
| display.derive [static-install] | ms | cold | 1 | 3.600 | 3.600 | 3.600 | 3.600 | 3.600 |  |
| input.project | ms | warm | 1052 | 0.200 | 0.400 | 1.300 | 5.300 | 0.255 | 0 of 1 |
| input.project | ms | cold | 100 | 0.200 | 0.600 | 2.700 | 30.000 | 0.625 | 0 of 1 |
| install.ack-roundtrip | ms | cold | 2 | 21.200 | 24.700 | 24.700 | 24.700 | 22.950 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 2 | 21.200 | 24.700 | 24.700 | 24.700 | 22.950 |  |
| install.post | ms | cold | 2 | 0.100 | 0.300 | 0.300 | 0.300 | 0.200 | 1 of 1 |
| install.post [static-install] | ms | cold | 2 | 0.100 | 0.300 | 0.300 | 0.300 | 0.200 |  |
| install.worker-deserialize | ms | cold | 2 | 0.400 | 0.400 | 0.400 | 0.400 | 0.400 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 2 | 0.400 | 0.400 | 0.400 | 0.400 | 0.400 |  |
| job.phase-residual | ms | warm | 989 | 0.000 | 0.000 | 0.000 | 0.300 | -0.004 | 0 of 1 |
| job.phase-residual | ms | cold | 97 | 0.000 | 0.000 | 0.100 | 0.100 | -0.007 | 0 of 1 |
| job.phase-residual [pose-only] | ms | warm | 989 | 0.000 | 0.000 | 0.000 | 0.300 | -0.004 |  |
| job.phase-residual [pose-only] | ms | cold | 96 | 0.000 | 0.000 | 0.100 | 0.100 | -0.005 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.200 | -0.200 | -0.200 | -0.200 | -0.200 |  |
| job.submit-to-accepted | ms | warm | 1052 | 93.300 | 95.100 | 96.200 | 109.000 | 93.336 | 0 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 93.200 | 95.200 | 96.100 | 96.100 | 92.993 | 0 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 1052 | 93.300 | 95.100 | 96.200 | 109.000 | 93.336 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 99 | 93.200 | 95.200 | 96.100 | 96.100 | 93.262 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 66.400 | 66.400 | 66.400 | 66.400 | 66.400 |  |
| merge.assemble | ms | warm | 989 | 0.000 | 0.100 | 0.100 | 0.200 | 0.007 | 0 of 1 |
| merge.assemble | ms | cold | 97 | 0.000 | 0.100 | 0.300 | 0.300 | 0.018 | 0 of 1 |
| merge.assemble [pose-only] | ms | warm | 989 | 0.000 | 0.100 | 0.100 | 0.200 | 0.007 |  |
| merge.assemble [pose-only] | ms | cold | 96 | 0.000 | 0.100 | 0.100 | 0.100 | 0.015 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.300 | 0.300 | 0.300 | 0.300 | 0.300 |  |
| merge.reply-deserialize | ms | warm | 2104 | 0.000 | 0.100 | 0.200 | 0.800 | 0.025 | 0 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.200 | 0.020 | 0 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 2104 | 0.000 | 0.100 | 0.200 | 0.800 | 0.025 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.100 | 0.200 | 0.020 |  |
| merge.reply-deserialize [static-install] | ms | cold | 2 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| merge.validate | ms | warm | 2104 | 0.100 | 0.200 | 0.400 | 3.200 | 0.092 | 0 of 1 |
| merge.validate | ms | cold | 200 | 0.100 | 0.200 | 0.600 | 2.400 | 0.119 | 0 of 1 |
| merge.validate [pose-only] | ms | warm | 2104 | 0.100 | 0.200 | 0.400 | 3.200 | 0.092 |  |
| merge.validate [pose-only] | ms | cold | 198 | 0.100 | 0.200 | 0.500 | 0.600 | 0.099 |  |
| merge.validate [static-install] | ms | cold | 2 | 1.800 | 2.400 | 2.400 | 2.400 | 2.100 |  |
| pool.compute-metric | ms | warm | 1052 | 0.600 | 1.300 | 2.800 | 11.100 | 0.782 | 0 of 1 |
| pool.compute-metric | ms | cold | 100 | 0.800 | 2.000 | 3.300 | 34.100 | 1.235 | 0 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 1052 | 0.600 | 1.300 | 2.800 | 11.100 | 0.782 |  |
| pool.compute-metric [pose-only] | ms | cold | 99 | 0.800 | 2.000 | 3.300 | 3.300 | 0.903 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 34.100 | 34.100 | 34.100 | 34.100 | 34.100 |  |
| pool.shard-max | ms | warm | 1052 | 0.200 | 0.800 | 1.300 | 3.500 | 0.329 | 0 of 1 |
| pool.shard-max | ms | cold | 100 | 0.300 | 1.200 | 2.300 | 9.900 | 0.562 | 0 of 1 |
| pool.shard-max [pose-only] | ms | warm | 1052 | 0.200 | 0.800 | 1.300 | 3.500 | 0.329 |  |
| pool.shard-max [pose-only] | ms | cold | 99 | 0.300 | 1.200 | 2.300 | 2.300 | 0.468 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 9.900 | 9.900 | 9.900 | 9.900 | 9.900 |  |
| pool.shard-total | ms | warm | 1052 | 0.400 | 1.000 | 1.700 | 4.600 | 0.468 | 0 of 1 |
| pool.shard-total | ms | cold | 100 | 0.500 | 1.500 | 2.900 | 13.200 | 0.753 | 0 of 1 |
| pool.shard-total [pose-only] | ms | warm | 1052 | 0.400 | 1.000 | 1.700 | 4.600 | 0.468 |  |
| pool.shard-total [pose-only] | ms | cold | 99 | 0.500 | 1.500 | 2.900 | 2.900 | 0.627 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 13.200 | 13.200 | 13.200 | 13.200 | 13.200 |  |
| queue.rate-limit | ms | warm | 1052 | 83.033 | 83.133 | 83.233 | 83.233 | 82.972 | 0 of 1 |
| queue.rate-limit | ms | cold | 100 | 82.933 | 83.133 | 83.133 | 83.233 | 81.975 | 0 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 1052 | 83.033 | 83.133 | 83.233 | 83.233 | 82.972 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 82.933 | 83.133 | 83.233 | 83.233 | 82.803 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 1052 | 9.267 | 10.967 | 11.967 | 15.167 | 9.301 | 0 of 1 |
| queue.timer-lateness | ms | cold | 100 | 9.167 | 10.967 | 11.967 | 12.267 | 9.106 | 0 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 1052 | 9.267 | 10.967 | 11.967 | 15.167 | 9.301 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 9.167 | 10.967 | 12.267 | 12.267 | 9.188 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |  |
| queue.wait | ms | warm | 1052 | 92.300 | 94.000 | 94.800 | 95.600 | 92.274 | 0 of 1 |
| queue.wait | ms | cold | 100 | 92.100 | 93.800 | 94.900 | 95.400 | 91.089 | 0 of 1 |
| queue.wait [pose-only] | ms | warm | 1052 | 92.300 | 94.000 | 94.800 | 95.600 | 92.274 |  |
| queue.wait [pose-only] | ms | cold | 99 | 92.100 | 93.900 | 95.400 | 95.400 | 91.995 |  |
| queue.wait [static-install] | ms | cold | 1 | 1.400 | 1.400 | 1.400 | 1.400 | 1.400 |  |
| shard.compute | ms | warm | 2104 | 0.200 | 0.700 | 1.000 | 3.500 | 0.234 | 0 of 1 |
| shard.compute | ms | cold | 200 | 0.200 | 0.900 | 2.300 | 9.900 | 0.376 | 0 of 1 |
| shard.compute [pose-only] | ms | warm | 2104 | 0.200 | 0.700 | 1.000 | 3.500 | 0.234 |  |
| shard.compute [pose-only] | ms | cold | 198 | 0.200 | 0.900 | 2.100 | 2.300 | 0.314 |  |
| shard.compute [static-install] | ms | cold | 2 | 3.300 | 9.900 | 9.900 | 9.900 | 6.600 |  |
| shard.post | ms | warm | 2104 | 0.000 | 0.100 | 0.200 | 1.200 | 0.034 | 0 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.200 | 0.028 | 0 of 1 |
| shard.post [pose-only] | ms | warm | 2104 | 0.000 | 0.100 | 0.200 | 1.200 | 0.034 |  |
| shard.post [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.200 | 0.200 | 0.028 |  |
| shard.post [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.reply-post | ms | warm | 2104 | 0.100 | 0.200 | 0.200 | 1.100 | 0.059 | 0 of 1 |
| shard.reply-post | ms | cold | 200 | 0.100 | 0.100 | 0.200 | 0.300 | 0.057 | 0 of 1 |
| shard.reply-post [pose-only] | ms | warm | 2104 | 0.100 | 0.200 | 0.200 | 1.100 | 0.059 |  |
| shard.reply-post [pose-only] | ms | cold | 198 | 0.100 | 0.200 | 0.200 | 0.300 | 0.056 |  |
| shard.reply-post [static-install] | ms | cold | 2 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| shard.roundtrip | ms | warm | 2104 | 0.400 | 0.900 | 1.600 | 8.600 | 0.493 | 0 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.500 | 1.200 | 2.600 | 31.100 | 0.852 | 0 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 2104 | 0.400 | 0.900 | 1.600 | 8.600 | 0.493 |  |
| shard.roundtrip [pose-only] | ms | cold | 198 | 0.500 | 1.200 | 2.400 | 2.600 | 0.562 |  |
| shard.roundtrip [static-install] | ms | cold | 2 | 28.100 | 31.100 | 31.100 | 31.100 | 29.600 |  |
| shard.transport | ms | warm | 2104 | 0.100 | 0.400 | 0.600 | 5.800 | 0.172 | 0 of 1 |
| shard.transport | ms | cold | 200 | 0.200 | 0.400 | 0.500 | 24.700 | 0.398 | 0 of 1 |
| shard.transport [pose-only] | ms | warm | 2104 | 0.100 | 0.400 | 0.600 | 5.800 | 0.172 |  |
| shard.transport [pose-only] | ms | cold | 198 | 0.200 | 0.300 | 0.500 | 0.500 | 0.171 |  |
| shard.transport [static-install] | ms | cold | 2 | 21.000 | 24.700 | 24.700 | 24.700 | 22.850 |  |
| shard.worker-deserialize | ms | warm | 2104 | 0.000 | 0.100 | 0.200 | 0.600 | 0.028 | 0 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.100 | 0.021 | 0 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 2104 | 0.000 | 0.100 | 0.200 | 0.600 | 0.028 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.100 | 0.100 | 0.021 |  |
| shard.worker-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |

## TS-W TH01_LISTENER_TAPE_SEEDED pass=traced boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=192 coalesced=0 dispatched=192 completed=192 accepted=192 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 92 | 0.000 | 0.100 | 0.200 | 0.200 | 0.049 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.000 | 0.200 | 0.200 | 0.500 | 0.054 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 92 | 0.000 | 0.100 | 0.200 | 0.200 | 0.049 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.000 | 0.200 | 0.200 | 0.200 | 0.049 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 0.500 | 0.500 | 0.500 | 0.500 | 0.500 |  |
| display.derive | ms | warm | 92 | 0.100 | 0.400 | 0.600 | 0.600 | 0.092 | 1 of 1 |
| display.derive | ms | cold | 100 | 0.100 | 0.400 | 1.400 | 1.900 | 0.159 | 1 of 1 |
| display.derive [pose-only] | ms | warm | 92 | 0.100 | 0.400 | 0.600 | 0.600 | 0.092 |  |
| display.derive [pose-only] | ms | cold | 99 | 0.100 | 0.400 | 1.900 | 1.900 | 0.146 |  |
| display.derive [static-install] | ms | cold | 1 | 1.400 | 1.400 | 1.400 | 1.400 | 1.400 |  |
| input.project | ms | warm | 92 | 0.300 | 1.400 | 3.400 | 3.400 | 0.441 | 1 of 1 |
| input.project | ms | cold | 100 | 0.300 | 1.900 | 2.400 | 7.400 | 0.557 | 1 of 1 |
| install.ack-roundtrip | ms | cold | 2 | 7.700 | 8.100 | 8.100 | 8.100 | 7.900 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 2 | 7.700 | 8.100 | 8.100 | 8.100 | 7.900 |  |
| install.post | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 | 1 of 1 |
| install.post [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |
| install.worker-deserialize | ms | cold | 2 | 0.000 | 0.200 | 0.200 | 0.200 | 0.100 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.200 | 0.200 | 0.200 | 0.100 |  |
| job.phase-residual | ms | warm | 90 | 0.000 | 0.100 | 0.700 | 0.700 | 0.032 | 1 of 1 |
| job.phase-residual | ms | cold | 96 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 90 | 0.000 | 0.100 | 0.700 | 0.700 | 0.032 |  |
| job.phase-residual [pose-only] | ms | cold | 95 | 0.000 | 0.100 | 0.100 | 0.100 | 0.012 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.200 | -0.200 | -0.200 | -0.200 | -0.200 |  |
| job.submit-to-accepted | ms | warm | 92 | 84.000 | 87.700 | 89.000 | 89.000 | 84.309 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 84.100 | 85.800 | 86.900 | 87.200 | 83.639 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 92 | 84.000 | 87.700 | 89.000 | 89.000 | 84.309 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 99 | 84.100 | 86.200 | 87.200 | 87.200 | 84.248 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 23.300 | 23.300 | 23.300 | 23.300 | 23.300 |  |
| merge.assemble | ms | warm | 90 | 0.000 | 0.100 | 0.100 | 0.100 | 0.010 | 1 of 1 |
| merge.assemble | ms | cold | 96 | 0.000 | 0.100 | 0.100 | 0.100 | 0.011 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 90 | 0.000 | 0.100 | 0.100 | 0.100 | 0.010 |  |
| merge.assemble [pose-only] | ms | cold | 95 | 0.000 | 0.100 | 0.100 | 0.100 | 0.011 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| merge.reply-deserialize | ms | warm | 184 | 0.000 | 0.100 | 0.200 | 0.200 | 0.028 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.400 | 0.029 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 0.200 | 0.200 | 0.028 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.300 | 0.400 | 0.028 |  |
| merge.reply-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.100 | 0.100 | 0.100 | 0.050 |  |
| merge.validate | ms | warm | 184 | 0.100 | 0.500 | 1.100 | 1.200 | 0.157 | 1 of 1 |
| merge.validate | ms | cold | 200 | 0.100 | 0.500 | 1.200 | 1.400 | 0.169 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 184 | 0.100 | 0.500 | 1.100 | 1.200 | 0.157 |  |
| merge.validate [pose-only] | ms | cold | 198 | 0.100 | 0.500 | 1.400 | 1.400 | 0.163 |  |
| merge.validate [static-install] | ms | cold | 2 | 0.700 | 1.000 | 1.000 | 1.000 | 0.850 |  |
| pool.compute-metric | ms | warm | 92 | 0.600 | 3.800 | 5.100 | 5.100 | 1.008 | 1 of 1 |
| pool.compute-metric | ms | cold | 100 | 0.800 | 3.600 | 5.700 | 11.300 | 1.191 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 92 | 0.600 | 3.800 | 5.100 | 5.100 | 1.008 |  |
| pool.compute-metric [pose-only] | ms | cold | 99 | 0.800 | 3.600 | 5.700 | 5.700 | 1.089 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 11.300 | 11.300 | 11.300 | 11.300 | 11.300 |  |
| pool.shard-max | ms | warm | 92 | 0.200 | 1.400 | 3.600 | 3.600 | 0.322 | 1 of 1 |
| pool.shard-max | ms | cold | 100 | 0.200 | 1.900 | 2.800 | 3.000 | 0.465 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 92 | 0.200 | 1.400 | 3.600 | 3.600 | 0.322 |  |
| pool.shard-max [pose-only] | ms | cold | 99 | 0.200 | 1.900 | 3.000 | 3.000 | 0.441 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 2.800 | 2.800 | 2.800 | 2.800 | 2.800 |  |
| pool.shard-total | ms | warm | 92 | 0.200 | 1.700 | 4.200 | 4.200 | 0.429 | 1 of 1 |
| pool.shard-total | ms | cold | 100 | 0.400 | 2.300 | 3.900 | 3.900 | 0.648 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 92 | 0.200 | 1.700 | 4.200 | 4.200 | 0.429 |  |
| pool.shard-total [pose-only] | ms | cold | 99 | 0.400 | 2.300 | 3.900 | 3.900 | 0.615 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 3.900 | 3.900 | 3.900 | 3.900 | 3.900 |  |
| queue.rate-limit | ms | warm | 92 | 82.933 | 83.133 | 83.133 | 83.133 | 82.604 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 82.833 | 83.033 | 83.033 | 83.033 | 81.728 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 92 | 82.933 | 83.133 | 83.133 | 83.133 | 82.604 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 82.833 | 83.033 | 83.033 | 83.033 | 82.554 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 92 | 0.167 | 1.167 | 2.667 | 2.667 | 0.212 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.067 | 1.067 | 1.467 | 4.000 | 0.115 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 92 | 0.167 | 1.167 | 2.667 | 2.667 | 0.212 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 0.067 | 1.067 | 1.467 | 1.467 | 0.076 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 4.000 | 4.000 | 4.000 | 4.000 | 4.000 |  |
| queue.wait | ms | warm | 92 | 83.000 | 84.200 | 85.200 | 85.200 | 82.825 | 1 of 1 |
| queue.wait | ms | cold | 100 | 82.700 | 84.000 | 84.300 | 84.500 | 81.849 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 92 | 83.000 | 84.200 | 85.200 | 85.200 | 82.825 |  |
| queue.wait [pose-only] | ms | cold | 99 | 82.700 | 84.100 | 84.500 | 84.500 | 82.634 |  |
| queue.wait [static-install] | ms | cold | 1 | 4.100 | 4.100 | 4.100 | 4.100 | 4.100 |  |
| shard.compute | ms | warm | 184 | 0.100 | 0.600 | 2.400 | 3.600 | 0.215 | 1 of 1 |
| shard.compute | ms | cold | 200 | 0.200 | 1.200 | 2.100 | 3.000 | 0.324 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 184 | 0.100 | 0.600 | 2.400 | 3.600 | 0.215 |  |
| shard.compute [pose-only] | ms | cold | 198 | 0.200 | 1.200 | 2.100 | 3.000 | 0.308 |  |
| shard.compute [static-install] | ms | cold | 2 | 1.100 | 2.800 | 2.800 | 2.800 | 1.950 |  |
| shard.post | ms | warm | 184 | 0.000 | 0.100 | 0.300 | 0.500 | 0.028 | 1 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.200 | 0.020 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 0.300 | 0.500 | 0.028 |  |
| shard.post [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.200 | 0.200 | 0.021 |  |
| shard.post [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.reply-post | ms | warm | 184 | 0.000 | 0.200 | 0.500 | 0.600 | 0.061 | 1 of 1 |
| shard.reply-post | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.300 | 0.037 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 184 | 0.000 | 0.200 | 0.500 | 0.600 | 0.061 |  |
| shard.reply-post [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.300 | 0.300 | 0.037 |  |
| shard.reply-post [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.roundtrip | ms | warm | 184 | 0.300 | 1.800 | 4.100 | 4.300 | 0.576 | 1 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.400 | 2.200 | 4.300 | 10.400 | 0.713 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 184 | 0.300 | 1.800 | 4.100 | 4.300 | 0.576 |  |
| shard.roundtrip [pose-only] | ms | cold | 198 | 0.400 | 2.100 | 3.400 | 4.300 | 0.621 |  |
| shard.roundtrip [static-install] | ms | cold | 2 | 9.200 | 10.400 | 10.400 | 10.400 | 9.800 |  |
| shard.transport | ms | warm | 184 | 0.200 | 0.800 | 1.500 | 3.300 | 0.284 | 1 of 1 |
| shard.transport | ms | cold | 200 | 0.200 | 0.700 | 1.200 | 8.100 | 0.337 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 184 | 0.200 | 0.800 | 1.500 | 3.300 | 0.284 |  |
| shard.transport [pose-only] | ms | cold | 198 | 0.200 | 0.700 | 1.100 | 1.200 | 0.261 |  |
| shard.transport [static-install] | ms | cold | 2 | 7.600 | 8.100 | 8.100 | 8.100 | 7.850 |  |
| shard.worker-deserialize | ms | warm | 184 | 0.000 | 0.100 | 0.100 | 0.200 | 0.016 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.300 | 0.016 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 184 | 0.000 | 0.100 | 0.100 | 0.200 | 0.016 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.300 | 0.300 | 0.016 |  |
| shard.worker-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |

## TS-W TH02_STATIC_EDIT_TAPE pass=clean boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1104 coalesced=0 dispatched=1104 completed=1104 accepted=1104 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 1004 | 0.000 | 0.100 | 0.300 | 2.500 | 0.044 | 0 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.100 | 0.200 | 0.300 | 0.500 | 0.071 | 0 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 461 | 0.000 | 0.100 | 0.300 | 0.800 | 0.041 |  |
| dispatch.prepare [pose-only] | ms | cold | 45 | 0.000 | 0.100 | 0.300 | 0.300 | 0.044 |  |
| dispatch.prepare [static-install] | ms | warm | 543 | 0.000 | 0.100 | 0.300 | 2.500 | 0.047 |  |
| dispatch.prepare [static-install] | ms | cold | 55 | 0.100 | 0.300 | 0.500 | 0.500 | 0.093 |  |
| display.derive | ms | warm | 1004 | 0.000 | 0.200 | 0.400 | 2.300 | 0.057 | 0 of 1 |
| display.derive | ms | cold | 100 | 0.100 | 0.600 | 1.200 | 2.700 | 0.169 | 0 of 1 |
| display.derive [pose-only] | ms | warm | 461 | 0.000 | 0.200 | 0.500 | 1.300 | 0.052 |  |
| display.derive [pose-only] | ms | cold | 45 | 0.100 | 0.300 | 1.200 | 1.200 | 0.131 |  |
| display.derive [static-install] | ms | warm | 543 | 0.000 | 0.200 | 0.400 | 2.300 | 0.062 |  |
| display.derive [static-install] | ms | cold | 55 | 0.100 | 0.700 | 2.700 | 2.700 | 0.200 |  |
| input.project | ms | warm | 1004 | 0.400 | 0.900 | 5.300 | 11.300 | 0.476 | 0 of 1 |
| input.project | ms | cold | 100 | 0.500 | 3.500 | 11.000 | 14.400 | 1.111 | 0 of 1 |
| install.ack-roundtrip | ms | warm | 1086 | 0.700 | 2.200 | 8.200 | 12.700 | 0.925 | 0 of 1 |
| install.ack-roundtrip | ms | cold | 110 | 0.700 | 3.900 | 10.100 | 11.700 | 1.132 | 0 of 1 |
| install.ack-roundtrip [static-install] | ms | warm | 1086 | 0.700 | 2.200 | 8.200 | 12.700 | 0.925 |  |
| install.ack-roundtrip [static-install] | ms | cold | 110 | 0.700 | 3.900 | 10.100 | 11.700 | 1.132 |  |
| install.post | ms | warm | 1086 | 0.100 | 0.400 | 2.400 | 4.100 | 0.201 | 0 of 1 |
| install.post | ms | cold | 110 | 0.200 | 0.700 | 1.900 | 2.200 | 0.307 | 0 of 1 |
| install.post [static-install] | ms | warm | 1086 | 0.100 | 0.400 | 2.400 | 4.100 | 0.201 |  |
| install.post [static-install] | ms | cold | 110 | 0.200 | 0.700 | 1.900 | 2.200 | 0.307 |  |
| install.worker-deserialize | ms | warm | 1086 | 0.200 | 0.700 | 3.200 | 8.600 | 0.343 | 0 of 1 |
| install.worker-deserialize | ms | cold | 110 | 0.300 | 1.400 | 3.400 | 3.800 | 0.456 | 0 of 1 |
| install.worker-deserialize [static-install] | ms | warm | 1086 | 0.200 | 0.700 | 3.200 | 8.600 | 0.343 |  |
| install.worker-deserialize [static-install] | ms | cold | 110 | 0.300 | 1.400 | 3.400 | 3.800 | 0.456 |  |
| job.phase-residual | ms | warm | 954 | 0.000 | 0.000 | 0.100 | 0.200 | -0.000 | 0 of 1 |
| job.phase-residual | ms | cold | 98 | 0.000 | 0.000 | 0.100 | 0.100 | -0.005 | 0 of 1 |
| job.phase-residual [pose-only] | ms | warm | 438 | 0.000 | 0.000 | 0.100 | 0.200 | -0.003 |  |
| job.phase-residual [pose-only] | ms | cold | 45 | 0.000 | 0.000 | 0.100 | 0.100 | -0.002 |  |
| job.phase-residual [static-install] | ms | warm | 516 | 0.000 | 0.000 | 0.100 | 0.200 | 0.002 |  |
| job.phase-residual [static-install] | ms | cold | 53 | 0.000 | 0.000 | 0.100 | 0.100 | -0.008 |  |
| job.submit-to-accepted | ms | warm | 1004 | 93.200 | 96.400 | 100.300 | 131.900 | 93.349 | 0 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 93.000 | 96.700 | 112.900 | 117.300 | 92.876 | 0 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 461 | 92.500 | 95.600 | 99.500 | 105.900 | 92.621 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 45 | 92.200 | 95.500 | 112.900 | 112.900 | 92.571 |  |
| job.submit-to-accepted [static-install] | ms | warm | 543 | 93.800 | 96.800 | 101.400 | 131.900 | 93.967 |  |
| job.submit-to-accepted [static-install] | ms | cold | 55 | 93.500 | 98.000 | 117.300 | 117.300 | 93.125 |  |
| merge.assemble | ms | warm | 954 | 0.000 | 0.100 | 0.100 | 0.600 | 0.007 | 0 of 1 |
| merge.assemble | ms | cold | 98 | 0.000 | 0.100 | 0.200 | 0.200 | 0.016 | 0 of 1 |
| merge.assemble [pose-only] | ms | warm | 438 | 0.000 | 0.100 | 0.100 | 0.200 | 0.006 |  |
| merge.assemble [pose-only] | ms | cold | 45 | 0.000 | 0.100 | 0.200 | 0.200 | 0.018 |  |
| merge.assemble [static-install] | ms | warm | 516 | 0.000 | 0.100 | 0.100 | 0.600 | 0.008 |  |
| merge.assemble [static-install] | ms | cold | 53 | 0.000 | 0.100 | 0.200 | 0.200 | 0.015 |  |
| merge.reply-deserialize | ms | warm | 2008 | 0.000 | 0.100 | 0.300 | 1.600 | 0.024 | 0 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.500 | 0.600 | 0.038 | 0 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 922 | 0.000 | 0.100 | 0.300 | 1.600 | 0.025 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.600 | 0.600 | 0.042 |  |
| merge.reply-deserialize [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.200 | 0.900 | 0.023 |  |
| merge.reply-deserialize [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.400 | 0.500 | 0.034 |  |
| merge.validate | ms | warm | 2008 | 0.100 | 0.200 | 0.700 | 3.600 | 0.089 | 0 of 1 |
| merge.validate | ms | cold | 200 | 0.100 | 0.600 | 5.100 | 13.100 | 0.303 | 0 of 1 |
| merge.validate [pose-only] | ms | warm | 922 | 0.100 | 0.200 | 1.000 | 3.000 | 0.098 |  |
| merge.validate [pose-only] | ms | cold | 90 | 0.100 | 0.600 | 13.100 | 13.100 | 0.342 |  |
| merge.validate [static-install] | ms | warm | 1086 | 0.100 | 0.200 | 0.500 | 3.600 | 0.082 |  |
| merge.validate [static-install] | ms | cold | 110 | 0.100 | 0.700 | 4.000 | 6.500 | 0.271 |  |
| pool.compute-metric | ms | warm | 1004 | 1.200 | 3.700 | 9.300 | 37.200 | 1.669 | 0 of 1 |
| pool.compute-metric | ms | cold | 100 | 1.600 | 6.000 | 23.800 | 28.400 | 2.587 | 0 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 461 | 0.800 | 2.500 | 9.500 | 20.400 | 1.198 |  |
| pool.compute-metric [pose-only] | ms | cold | 45 | 1.200 | 3.200 | 28.400 | 28.400 | 1.973 |  |
| pool.compute-metric [static-install] | ms | warm | 543 | 1.600 | 4.200 | 8.600 | 37.200 | 2.069 |  |
| pool.compute-metric [static-install] | ms | cold | 55 | 2.100 | 11.000 | 23.800 | 23.800 | 3.089 |  |
| pool.shard-max | ms | warm | 1004 | 0.400 | 1.600 | 3.000 | 18.500 | 0.602 | 0 of 1 |
| pool.shard-max | ms | cold | 100 | 0.800 | 2.500 | 4.600 | 5.200 | 1.018 | 0 of 1 |
| pool.shard-max [pose-only] | ms | warm | 461 | 0.300 | 1.400 | 3.000 | 13.800 | 0.528 |  |
| pool.shard-max [pose-only] | ms | cold | 45 | 0.600 | 2.500 | 4.600 | 4.600 | 0.896 |  |
| pool.shard-max [static-install] | ms | warm | 543 | 0.500 | 1.800 | 3.200 | 18.500 | 0.664 |  |
| pool.shard-max [static-install] | ms | cold | 55 | 0.900 | 3.500 | 5.200 | 5.200 | 1.118 |  |
| pool.shard-total | ms | warm | 1004 | 0.600 | 2.600 | 5.600 | 31.400 | 0.996 | 0 of 1 |
| pool.shard-total | ms | cold | 100 | 1.200 | 4.400 | 8.800 | 10.000 | 1.732 | 0 of 1 |
| pool.shard-total [pose-only] | ms | warm | 461 | 0.500 | 2.100 | 5.300 | 26.900 | 0.840 |  |
| pool.shard-total [pose-only] | ms | cold | 45 | 0.800 | 4.000 | 8.800 | 8.800 | 1.451 |  |
| pool.shard-total [static-install] | ms | warm | 543 | 0.800 | 2.700 | 6.200 | 31.400 | 1.127 |  |
| pool.shard-total [static-install] | ms | cold | 55 | 1.600 | 6.500 | 10.000 | 10.000 | 1.962 |  |
| queue.rate-limit | ms | warm | 1004 | 82.933 | 83.133 | 83.133 | 83.233 | 82.723 | 0 of 1 |
| queue.rate-limit | ms | cold | 100 | 82.533 | 83.033 | 83.133 | 83.133 | 81.210 | 0 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 461 | 83.033 | 83.133 | 83.233 | 83.233 | 82.885 |  |
| queue.rate-limit [pose-only] | ms | cold | 45 | 82.833 | 83.033 | 83.133 | 83.133 | 82.336 |  |
| queue.rate-limit [static-install] | ms | warm | 543 | 82.833 | 82.933 | 83.033 | 83.033 | 82.587 |  |
| queue.rate-limit [static-install] | ms | cold | 55 | 82.333 | 82.833 | 82.933 | 82.933 | 80.289 |  |
| queue.timer-lateness | ms | warm | 1004 | 8.567 | 10.867 | 11.967 | 14.967 | 8.450 | 0 of 1 |
| queue.timer-lateness | ms | cold | 100 | 7.967 | 10.367 | 10.667 | 12.167 | 7.916 | 0 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 461 | 8.367 | 10.467 | 11.767 | 14.967 | 8.169 |  |
| queue.timer-lateness [pose-only] | ms | cold | 45 | 7.867 | 10.367 | 12.167 | 12.167 | 7.460 |  |
| queue.timer-lateness [static-install] | ms | warm | 543 | 8.767 | 10.967 | 12.267 | 14.667 | 8.688 |  |
| queue.timer-lateness [static-install] | ms | cold | 55 | 8.467 | 10.467 | 10.667 | 10.667 | 8.289 |  |
| queue.wait | ms | warm | 1004 | 91.400 | 93.600 | 94.700 | 98.100 | 91.176 | 0 of 1 |
| queue.wait | ms | cold | 100 | 90.700 | 92.800 | 93.400 | 93.500 | 89.130 | 0 of 1 |
| queue.wait [pose-only] | ms | warm | 461 | 91.300 | 93.500 | 94.700 | 98.100 | 91.057 |  |
| queue.wait [pose-only] | ms | cold | 45 | 90.800 | 93.200 | 93.400 | 93.400 | 89.800 |  |
| queue.wait [static-install] | ms | warm | 543 | 91.500 | 93.700 | 94.700 | 95.500 | 91.277 |  |
| queue.wait [static-install] | ms | cold | 55 | 90.600 | 92.800 | 93.500 | 93.500 | 88.582 |  |
| shard.compute | ms | warm | 2008 | 0.300 | 1.400 | 3.000 | 18.500 | 0.498 | 0 of 1 |
| shard.compute | ms | cold | 200 | 0.600 | 2.400 | 4.600 | 5.200 | 0.866 | 0 of 1 |
| shard.compute [pose-only] | ms | warm | 922 | 0.200 | 1.200 | 2.700 | 13.800 | 0.420 |  |
| shard.compute [pose-only] | ms | cold | 90 | 0.300 | 2.400 | 4.600 | 4.600 | 0.726 |  |
| shard.compute [static-install] | ms | warm | 1086 | 0.400 | 1.500 | 3.000 | 18.500 | 0.564 |  |
| shard.compute [static-install] | ms | cold | 110 | 0.800 | 3.000 | 4.800 | 5.200 | 0.981 |  |
| shard.post | ms | warm | 2008 | 0.000 | 0.100 | 0.200 | 0.900 | 0.019 | 0 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.600 | 0.030 | 0 of 1 |
| shard.post [pose-only] | ms | warm | 922 | 0.000 | 0.100 | 0.300 | 0.900 | 0.033 |  |
| shard.post [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.600 | 0.600 | 0.048 |  |
| shard.post [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.100 | 0.300 | 0.007 |  |
| shard.post [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.200 | 0.015 |  |
| shard.reply-post | ms | warm | 2008 | 0.000 | 0.100 | 0.600 | 4.400 | 0.051 | 0 of 1 |
| shard.reply-post | ms | cold | 200 | 0.000 | 0.200 | 0.900 | 1.900 | 0.073 | 0 of 1 |
| shard.reply-post [pose-only] | ms | warm | 922 | 0.000 | 0.200 | 0.800 | 4.400 | 0.069 |  |
| shard.reply-post [pose-only] | ms | cold | 90 | 0.100 | 0.200 | 1.900 | 1.900 | 0.087 |  |
| shard.reply-post [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.400 | 1.200 | 0.035 |  |
| shard.reply-post [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.400 | 1.400 | 0.061 |  |
| shard.roundtrip | ms | warm | 2008 | 0.800 | 2.700 | 5.800 | 29.800 | 1.128 | 0 of 1 |
| shard.roundtrip | ms | cold | 200 | 1.100 | 4.400 | 15.500 | 22.600 | 1.656 | 0 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 922 | 0.600 | 2.100 | 5.800 | 19.000 | 0.858 |  |
| shard.roundtrip [pose-only] | ms | cold | 90 | 0.800 | 2.800 | 22.600 | 22.600 | 1.270 |  |
| shard.roundtrip [static-install] | ms | warm | 1086 | 1.000 | 3.100 | 8.200 | 29.800 | 1.357 |  |
| shard.roundtrip [static-install] | ms | cold | 110 | 1.300 | 4.700 | 15.500 | 17.000 | 1.972 |  |
| shard.transport | ms | warm | 2008 | 0.400 | 1.600 | 4.200 | 11.700 | 0.563 | 0 of 1 |
| shard.transport | ms | cold | 200 | 0.300 | 1.400 | 10.000 | 15.300 | 0.689 | 0 of 1 |
| shard.transport [pose-only] | ms | warm | 922 | 0.200 | 1.000 | 3.100 | 4.400 | 0.345 |  |
| shard.transport [pose-only] | ms | cold | 90 | 0.200 | 0.700 | 15.300 | 15.300 | 0.419 |  |
| shard.transport [static-install] | ms | warm | 1086 | 0.500 | 1.900 | 6.000 | 11.700 | 0.748 |  |
| shard.transport [static-install] | ms | cold | 110 | 0.500 | 3.000 | 10.000 | 11.700 | 0.910 |  |
| shard.worker-deserialize | ms | warm | 2008 | 0.000 | 0.100 | 0.200 | 0.600 | 0.016 | 0 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.800 | 0.028 | 0 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 922 | 0.000 | 0.100 | 0.200 | 0.600 | 0.024 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.800 | 0.800 | 0.039 |  |
| shard.worker-deserialize [static-install] | ms | warm | 1086 | 0.000 | 0.100 | 0.100 | 0.200 | 0.010 |  |
| shard.worker-deserialize [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.200 | 0.020 |  |

## TS-W TH02_STATIC_EDIT_TAPE pass=traced boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=144 coalesced=0 dispatched=144 completed=144 accepted=144 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 44 | 0.000 | 0.100 | 0.100 | 0.100 | 0.045 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 0.600 | 0.047 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 21 | 0.100 | 0.100 | 0.100 | 0.100 | 0.057 |  |
| dispatch.prepare [pose-only] | ms | cold | 45 | 0.000 | 0.100 | 0.100 | 0.100 | 0.038 |  |
| dispatch.prepare [static-install] | ms | warm | 23 | 0.000 | 0.100 | 0.100 | 0.100 | 0.035 |  |
| dispatch.prepare [static-install] | ms | cold | 55 | 0.000 | 0.100 | 0.600 | 0.600 | 0.055 |  |
| display.derive | ms | warm | 44 | 0.100 | 0.100 | 0.300 | 0.300 | 0.068 | 1 of 1 |
| display.derive | ms | cold | 100 | 0.100 | 0.400 | 0.700 | 2.200 | 0.145 | 1 of 1 |
| display.derive [pose-only] | ms | warm | 21 | 0.000 | 0.200 | 0.300 | 0.300 | 0.062 |  |
| display.derive [pose-only] | ms | cold | 45 | 0.100 | 0.300 | 0.400 | 0.400 | 0.111 |  |
| display.derive [static-install] | ms | warm | 23 | 0.100 | 0.100 | 0.100 | 0.100 | 0.074 |  |
| display.derive [static-install] | ms | cold | 55 | 0.100 | 0.600 | 2.200 | 2.200 | 0.173 |  |
| input.project | ms | warm | 44 | 0.400 | 0.700 | 0.800 | 0.800 | 0.443 | 1 of 1 |
| input.project | ms | cold | 100 | 0.500 | 2.000 | 3.200 | 12.900 | 0.809 | 1 of 1 |
| install.ack-roundtrip | ms | warm | 46 | 0.400 | 0.600 | 0.600 | 0.600 | 0.446 | 1 of 1 |
| install.ack-roundtrip | ms | cold | 110 | 0.500 | 1.600 | 9.700 | 9.700 | 0.736 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | warm | 46 | 0.400 | 0.600 | 0.600 | 0.600 | 0.446 |  |
| install.ack-roundtrip [static-install] | ms | cold | 110 | 0.500 | 1.600 | 9.700 | 9.700 | 0.736 |  |
| install.post | ms | warm | 46 | 0.100 | 0.200 | 0.200 | 0.200 | 0.117 | 1 of 1 |
| install.post | ms | cold | 110 | 0.100 | 0.300 | 0.400 | 0.500 | 0.128 | 1 of 1 |
| install.post [static-install] | ms | warm | 46 | 0.100 | 0.200 | 0.200 | 0.200 | 0.117 |  |
| install.post [static-install] | ms | cold | 110 | 0.100 | 0.300 | 0.400 | 0.500 | 0.128 |  |
| install.worker-deserialize | ms | warm | 46 | 0.200 | 0.300 | 0.300 | 0.300 | 0.176 | 1 of 1 |
| install.worker-deserialize | ms | cold | 110 | 0.200 | 0.400 | 0.600 | 0.600 | 0.213 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | warm | 46 | 0.200 | 0.300 | 0.300 | 0.300 | 0.176 |  |
| install.worker-deserialize [static-install] | ms | cold | 110 | 0.200 | 0.400 | 0.600 | 0.600 | 0.213 |  |
| job.phase-residual | ms | warm | 43 | 0.000 | 0.100 | 0.100 | 0.100 | 0.012 | 1 of 1 |
| job.phase-residual | ms | cold | 97 | 0.000 | 0.100 | 0.100 | 0.100 | 0.014 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 21 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| job.phase-residual [pose-only] | ms | cold | 45 | 0.000 | 0.100 | 0.100 | 0.100 | 0.011 |  |
| job.phase-residual [static-install] | ms | warm | 22 | 0.000 | 0.100 | 0.100 | 0.100 | 0.023 |  |
| job.phase-residual [static-install] | ms | cold | 52 | 0.000 | 0.100 | 0.100 | 0.100 | 0.017 |  |
| job.submit-to-accepted | ms | warm | 44 | 84.000 | 85.100 | 85.400 | 85.400 | 84.064 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 100 | 84.300 | 86.800 | 89.500 | 91.100 | 84.141 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 21 | 83.800 | 85.000 | 85.100 | 85.100 | 83.833 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 45 | 84.100 | 86.100 | 89.500 | 89.500 | 84.356 |  |
| job.submit-to-accepted [static-install] | ms | warm | 23 | 84.300 | 85.100 | 85.400 | 85.400 | 84.274 |  |
| job.submit-to-accepted [static-install] | ms | cold | 55 | 84.600 | 87.100 | 91.100 | 91.100 | 83.965 |  |
| merge.assemble | ms | warm | 43 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 | 1 of 1 |
| merge.assemble | ms | cold | 97 | 0.000 | 0.000 | 0.100 | 0.100 | 0.004 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 21 | 0.000 | 0.100 | 0.100 | 0.100 | 0.014 |  |
| merge.assemble [pose-only] | ms | cold | 45 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| merge.assemble [static-install] | ms | warm | 22 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| merge.assemble [static-install] | ms | cold | 52 | 0.000 | 0.100 | 0.100 | 0.100 | 0.006 |  |
| merge.reply-deserialize | ms | warm | 88 | 0.000 | 0.100 | 0.100 | 0.100 | 0.012 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.400 | 0.020 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 42 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.200 | 0.200 | 0.026 |  |
| merge.reply-deserialize [static-install] | ms | warm | 46 | 0.000 | 0.100 | 0.100 | 0.100 | 0.017 |  |
| merge.reply-deserialize [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.400 | 0.015 |  |
| merge.validate | ms | warm | 88 | 0.100 | 0.200 | 0.400 | 0.400 | 0.099 | 1 of 1 |
| merge.validate | ms | cold | 200 | 0.100 | 0.300 | 0.700 | 1.500 | 0.134 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 42 | 0.100 | 0.200 | 0.400 | 0.400 | 0.112 |  |
| merge.validate [pose-only] | ms | cold | 90 | 0.100 | 0.300 | 1.100 | 1.100 | 0.146 |  |
| merge.validate [static-install] | ms | warm | 46 | 0.100 | 0.200 | 0.300 | 0.300 | 0.087 |  |
| merge.validate [static-install] | ms | cold | 110 | 0.100 | 0.400 | 0.700 | 1.500 | 0.125 |  |
| pool.compute-metric | ms | warm | 44 | 0.900 | 1.500 | 1.700 | 1.700 | 0.930 | 1 of 1 |
| pool.compute-metric | ms | cold | 100 | 1.100 | 4.000 | 7.200 | 17.600 | 1.632 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 21 | 0.700 | 0.900 | 1.000 | 1.000 | 0.700 |  |
| pool.compute-metric [pose-only] | ms | cold | 45 | 0.900 | 3.300 | 6.200 | 6.200 | 1.191 |  |
| pool.compute-metric [static-install] | ms | warm | 23 | 1.100 | 1.600 | 1.700 | 1.700 | 1.139 |  |
| pool.compute-metric [static-install] | ms | cold | 55 | 1.300 | 6.400 | 17.600 | 17.600 | 1.993 |  |
| pool.shard-max | ms | warm | 44 | 0.300 | 0.900 | 0.900 | 0.900 | 0.357 | 1 of 1 |
| pool.shard-max | ms | cold | 100 | 0.400 | 2.400 | 4.300 | 5.800 | 0.700 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 21 | 0.200 | 0.600 | 0.700 | 0.700 | 0.286 |  |
| pool.shard-max [pose-only] | ms | cold | 45 | 0.400 | 2.300 | 3.800 | 3.800 | 0.580 |  |
| pool.shard-max [static-install] | ms | warm | 23 | 0.400 | 0.900 | 0.900 | 0.900 | 0.422 |  |
| pool.shard-max [static-install] | ms | cold | 55 | 0.500 | 3.100 | 5.800 | 5.800 | 0.798 |  |
| pool.shard-total | ms | warm | 44 | 0.500 | 1.300 | 1.400 | 1.400 | 0.570 | 1 of 1 |
| pool.shard-total | ms | cold | 100 | 0.700 | 4.300 | 8.500 | 11.400 | 1.178 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 21 | 0.300 | 1.100 | 1.100 | 1.100 | 0.457 |  |
| pool.shard-total [pose-only] | ms | cold | 45 | 0.500 | 4.300 | 5.900 | 5.900 | 0.909 |  |
| pool.shard-total [static-install] | ms | warm | 23 | 0.700 | 1.400 | 1.400 | 1.400 | 0.674 |  |
| pool.shard-total [static-install] | ms | cold | 55 | 0.900 | 5.900 | 11.400 | 11.400 | 1.398 |  |
| queue.rate-limit | ms | warm | 44 | 82.833 | 83.033 | 83.033 | 83.033 | 82.740 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 82.633 | 82.933 | 83.033 | 83.033 | 81.541 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 21 | 82.833 | 83.033 | 83.033 | 83.033 | 82.881 |  |
| queue.rate-limit [pose-only] | ms | cold | 45 | 82.833 | 82.933 | 83.033 | 83.033 | 82.636 |  |
| queue.rate-limit [static-install] | ms | warm | 23 | 82.633 | 82.833 | 82.933 | 82.933 | 82.612 |  |
| queue.rate-limit [static-install] | ms | cold | 55 | 82.533 | 82.833 | 82.833 | 82.833 | 80.645 |  |
| queue.timer-lateness | ms | warm | 44 | -0.133 | 0.667 | 1.067 | 1.067 | -0.079 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.167 | 0.967 | 1.067 | 4.200 | 0.128 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 21 | -0.133 | 0.767 | 1.067 | 1.067 | -0.119 |  |
| queue.timer-lateness [pose-only] | ms | cold | 45 | 0.067 | 0.767 | 1.067 | 1.067 | 0.049 |  |
| queue.timer-lateness [static-install] | ms | warm | 23 | -0.033 | 0.567 | 0.667 | 0.667 | -0.042 |  |
| queue.timer-lateness [static-install] | ms | cold | 55 | 0.167 | 0.967 | 4.200 | 4.200 | 0.193 |  |
| queue.wait | ms | warm | 44 | 82.600 | 83.300 | 84.100 | 84.100 | 82.666 | 1 of 1 |
| queue.wait | ms | cold | 100 | 82.500 | 83.300 | 83.800 | 83.900 | 81.671 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 21 | 82.700 | 83.800 | 84.100 | 84.100 | 82.767 |  |
| queue.wait [pose-only] | ms | cold | 45 | 82.900 | 83.500 | 83.900 | 83.900 | 82.687 |  |
| queue.wait [static-install] | ms | warm | 23 | 82.600 | 83.200 | 83.300 | 83.300 | 82.574 |  |
| queue.wait [static-install] | ms | cold | 55 | 82.300 | 83.300 | 83.500 | 83.500 | 80.840 |  |
| shard.compute | ms | warm | 88 | 0.200 | 0.800 | 0.900 | 0.900 | 0.285 | 1 of 1 |
| shard.compute | ms | cold | 200 | 0.400 | 2.200 | 4.300 | 5.800 | 0.589 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 42 | 0.100 | 0.600 | 0.700 | 0.700 | 0.229 |  |
| shard.compute [pose-only] | ms | cold | 90 | 0.200 | 2.100 | 3.800 | 3.800 | 0.454 |  |
| shard.compute [static-install] | ms | warm | 46 | 0.300 | 0.900 | 0.900 | 0.900 | 0.337 |  |
| shard.compute [static-install] | ms | cold | 110 | 0.400 | 2.800 | 5.600 | 5.800 | 0.699 |  |
| shard.post | ms | warm | 88 | 0.000 | 0.100 | 0.100 | 0.100 | 0.015 | 1 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.200 | 0.014 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 42 | 0.000 | 0.100 | 0.100 | 0.100 | 0.021 |  |
| shard.post [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.100 | 0.100 | 0.016 |  |
| shard.post [static-install] | ms | warm | 46 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| shard.post [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.200 | 0.013 |  |
| shard.reply-post | ms | warm | 88 | 0.000 | 0.100 | 0.200 | 0.200 | 0.024 | 1 of 1 |
| shard.reply-post | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.300 | 0.034 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 42 | 0.000 | 0.100 | 0.200 | 0.200 | 0.031 |  |
| shard.reply-post [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.200 | 0.200 | 0.037 |  |
| shard.reply-post [static-install] | ms | warm | 46 | 0.000 | 0.100 | 0.100 | 0.100 | 0.017 |  |
| shard.reply-post [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.200 | 0.300 | 0.032 |  |
| shard.roundtrip | ms | warm | 88 | 0.500 | 1.100 | 1.400 | 1.400 | 0.582 | 1 of 1 |
| shard.roundtrip | ms | cold | 200 | 0.700 | 2.800 | 6.100 | 16.800 | 1.132 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 42 | 0.400 | 0.800 | 0.800 | 0.800 | 0.460 |  |
| shard.roundtrip [pose-only] | ms | cold | 90 | 0.500 | 2.600 | 6.000 | 6.000 | 0.786 |  |
| shard.roundtrip [static-install] | ms | warm | 46 | 0.700 | 1.200 | 1.400 | 1.400 | 0.693 |  |
| shard.roundtrip [static-install] | ms | cold | 110 | 0.800 | 4.500 | 15.400 | 16.800 | 1.415 |  |
| shard.transport | ms | warm | 88 | 0.300 | 0.500 | 0.700 | 0.700 | 0.266 | 1 of 1 |
| shard.transport | ms | cold | 200 | 0.400 | 1.100 | 3.200 | 11.000 | 0.502 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 42 | 0.200 | 0.400 | 0.600 | 0.600 | 0.190 |  |
| shard.transport [pose-only] | ms | cold | 90 | 0.200 | 0.700 | 2.200 | 2.200 | 0.286 |  |
| shard.transport [static-install] | ms | warm | 46 | 0.300 | 0.500 | 0.700 | 0.700 | 0.335 |  |
| shard.transport [static-install] | ms | cold | 110 | 0.400 | 1.600 | 9.700 | 11.000 | 0.679 |  |
| shard.worker-deserialize | ms | warm | 88 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 42 | 0.000 | 0.100 | 0.100 | 0.100 | 0.010 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| shard.worker-deserialize [static-install] | ms | warm | 46 | 0.000 | 0.000 | 0.100 | 0.100 | 0.004 |  |
| shard.worker-deserialize [static-install] | ms | cold | 110 | 0.000 | 0.100 | 0.100 | 0.100 | 0.005 |  |

## TS-W W01_H100_POSE_60HZ_60S pass=alloc boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1201 coalesced=970 dispatched=231 completed=231 accepted=231 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 131 | 0.000 | 0.100 | 0.200 | 0.200 | 0.049 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 0.700 | 0.041 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 131 | 0.000 | 0.100 | 0.200 | 0.200 | 0.049 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.200 | 0.200 | 0.034 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 0.700 | 0.700 | 0.700 | 0.700 | 0.700 |  |
| display.derive | ms | warm | 174 | 0.500 | 1.500 | 3.600 | 6.600 | 0.610 | 1 of 1 |
| display.derive | ms | cold | 57 | 0.700 | 2.100 | 8.300 | 8.300 | 0.967 | 1 of 1 |
| display.derive [pose-only] | ms | warm | 174 | 0.500 | 1.500 | 3.600 | 6.600 | 0.610 |  |
| display.derive [pose-only] | ms | cold | 56 | 0.700 | 1.900 | 3.300 | 3.300 | 0.836 |  |
| display.derive [static-install] | ms | cold | 1 | 8.300 | 8.300 | 8.300 | 8.300 | 8.300 |  |
| input.lateness | ms | warm | 900 | 0.300 | 1.400 | 1.867 | 3.233 | 0.322 | 0 of 1 |
| input.lateness | ms | cold | 301 | 0.300 | 1.600 | 2.067 | 26.433 | 0.543 | 0 of 1 |
| input.project | ms | warm | 900 | 2.200 | 3.800 | 6.400 | 8.600 | 2.336 | 0 of 1 |
| input.project | ms | cold | 301 | 2.300 | 4.200 | 4.700 | 21.800 | 2.482 | 0 of 1 |
| install.ack-roundtrip | ms | cold | 4 | 20.800 | 22.900 | 22.900 | 22.900 | 20.950 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 4 | 20.800 | 22.900 | 22.900 | 22.900 | 20.950 |  |
| install.post | ms | cold | 4 | 1.600 | 2.200 | 2.200 | 2.200 | 1.775 | 1 of 1 |
| install.post [static-install] | ms | cold | 4 | 1.600 | 2.200 | 2.200 | 2.200 | 1.775 |  |
| install.worker-deserialize | ms | cold | 4 | 2.500 | 4.100 | 4.100 | 4.100 | 2.925 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 4 | 2.500 | 4.100 | 4.100 | 4.100 | 2.925 |  |
| job.phase-residual | ms | warm | 114 | 0.000 | 0.000 | 0.100 | 0.100 | -0.002 | 1 of 1 |
| job.phase-residual | ms | cold | 91 | 0.000 | 0.000 | 0.100 | 0.100 | -0.002 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 114 | 0.000 | 0.000 | 0.100 | 0.100 | -0.002 |  |
| job.phase-residual [pose-only] | ms | cold | 90 | 0.000 | 0.000 | 0.100 | 0.100 | -0.002 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.000 | -0.000 | -0.000 | -0.000 | -0.000 |  |
| job.submit-to-accepted | ms | warm | 174 | 13.100 | 19.600 | 24.500 | 69.800 | 13.820 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 57 | 13.500 | 22.700 | 60.000 | 60.000 | 14.605 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 174 | 13.100 | 19.600 | 24.500 | 69.800 | 13.820 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 56 | 13.400 | 21.400 | 23.100 | 23.100 | 13.795 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 60.000 | 60.000 | 60.000 | 60.000 | 60.000 |  |
| merge.assemble | ms | warm | 114 | 0.000 | 0.000 | 0.100 | 0.100 | 0.004 | 1 of 1 |
| merge.assemble | ms | cold | 91 | 0.000 | 0.100 | 0.200 | 0.200 | 0.010 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 114 | 0.000 | 0.000 | 0.100 | 0.100 | 0.004 |  |
| merge.assemble [pose-only] | ms | cold | 90 | 0.000 | 0.100 | 0.100 | 0.100 | 0.008 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.200 | 0.200 | 0.200 | 0.200 | 0.200 |  |
| merge.reply-deserialize | ms | warm | 524 | 0.000 | 0.100 | 0.100 | 0.200 | 0.015 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 524 | 0.000 | 0.100 | 0.100 | 0.200 | 0.015 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.100 | 0.200 | 0.017 |  |
| merge.reply-deserialize [static-install] | ms | cold | 4 | 0.000 | 0.100 | 0.100 | 0.100 | 0.025 |  |
| merge.validate | ms | warm | 524 | 0.100 | 0.300 | 0.700 | 1.900 | 0.110 | 1 of 1 |
| merge.validate | ms | cold | 400 | 0.100 | 0.500 | 1.100 | 2.200 | 0.147 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 524 | 0.100 | 0.300 | 0.700 | 1.900 | 0.110 |  |
| merge.validate [pose-only] | ms | cold | 396 | 0.100 | 0.500 | 0.900 | 2.200 | 0.142 |  |
| merge.validate [static-install] | ms | cold | 4 | 0.400 | 1.200 | 1.200 | 1.200 | 0.700 |  |
| pool.compute-metric | ms | warm | 174 | 1.900 | 4.600 | 8.800 | 9.600 | 2.247 | 1 of 1 |
| pool.compute-metric | ms | cold | 57 | 2.200 | 6.800 | 37.400 | 37.400 | 3.288 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 174 | 1.900 | 4.600 | 8.800 | 9.600 | 2.247 |  |
| pool.compute-metric [pose-only] | ms | cold | 56 | 2.200 | 6.000 | 7.300 | 7.300 | 2.679 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 37.400 | 37.400 | 37.400 | 37.400 | 37.400 |  |
| pool.shard-max | ms | warm | 174 | 1.400 | 2.200 | 3.500 | 3.600 | 1.495 | 1 of 1 |
| pool.shard-max | ms | cold | 57 | 1.700 | 2.800 | 10.800 | 10.800 | 1.810 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 174 | 1.400 | 2.200 | 3.500 | 3.600 | 1.495 |  |
| pool.shard-max [pose-only] | ms | cold | 56 | 1.700 | 2.600 | 3.100 | 3.100 | 1.650 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 10.800 | 10.800 | 10.800 | 10.800 | 10.800 |  |
| pool.shard-total | ms | warm | 174 | 4.500 | 7.000 | 12.900 | 13.500 | 4.721 | 1 of 1 |
| pool.shard-total | ms | cold | 57 | 5.200 | 7.900 | 37.700 | 37.700 | 5.872 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 174 | 4.500 | 7.000 | 12.900 | 13.500 | 4.721 |  |
| pool.shard-total [pose-only] | ms | cold | 56 | 5.100 | 7.900 | 11.000 | 11.000 | 5.304 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 37.700 | 37.700 | 37.700 | 37.700 | 37.700 |  |
| pose.age-at-accept | ms | warm | 174 | 0.000 | 16.700 | 18.000 | 18.200 | 3.432 | 1 of 1 |
| pose.age-at-accept | ms | cold | 57 | 0.000 | 17.200 | 53.800 | 53.800 | 4.970 | 1 of 1 |
| pose.age-at-accept [pose-only] | ms | warm | 174 | 0.000 | 16.700 | 18.000 | 18.200 | 3.432 |  |
| pose.age-at-accept [pose-only] | ms | cold | 56 | 0.000 | 17.000 | 17.600 | 17.600 | 4.098 |  |
| pose.age-at-accept [static-install] | ms | cold | 1 | 53.800 | 53.800 | 53.800 | 53.800 | 53.800 |  |
| pose.latest-wait | ms | warm | 900 | 47.700 | 86.600 | 93.600 | 98.700 | 48.709 | 0 of 1 |
| pose.latest-wait | ms | cold | 301 | 48.900 | 91.900 | 98.900 | 121.700 | 50.355 | 0 of 1 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 900 | 47.700 | 86.600 | 93.600 | 98.700 | 48.709 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 301 | 48.900 | 91.900 | 98.900 | 121.700 | 50.355 |  |
| queue.rate-limit | ms | warm | 131 | 8.533 | 13.133 | 13.733 | 64.333 | 7.990 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 8.233 | 13.133 | 14.533 | 14.833 | 7.496 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 131 | 8.533 | 13.133 | 13.733 | 64.333 | 7.990 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 8.233 | 13.633 | 14.833 | 14.833 | 7.571 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 131 | 0.267 | 4.667 | 5.300 | 5.500 | 1.023 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.567 | 4.900 | 5.900 | 6.100 | 1.220 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 131 | 0.267 | 4.667 | 5.300 | 5.500 | 1.023 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 0.667 | 4.900 | 6.100 | 6.100 | 1.232 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| queue.wait | ms | warm | 131 | 8.700 | 13.300 | 15.000 | 65.900 | 9.026 | 1 of 1 |
| queue.wait | ms | cold | 100 | 8.400 | 13.600 | 14.800 | 15.500 | 8.733 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 131 | 8.700 | 13.300 | 15.000 | 65.900 | 9.026 |  |
| queue.wait [pose-only] | ms | cold | 99 | 8.400 | 13.900 | 15.500 | 15.500 | 8.819 |  |
| queue.wait [static-install] | ms | cold | 1 | 0.200 | 0.200 | 0.200 | 0.200 | 0.200 |  |
| shard.compute | ms | warm | 524 | 1.100 | 2.100 | 3.200 | 3.600 | 1.207 | 1 of 1 |
| shard.compute | ms | cold | 400 | 1.200 | 2.300 | 3.100 | 10.800 | 1.309 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 524 | 1.100 | 2.100 | 3.200 | 3.600 | 1.207 |  |
| shard.compute [pose-only] | ms | cold | 396 | 1.200 | 2.200 | 2.700 | 3.100 | 1.228 |  |
| shard.compute [static-install] | ms | cold | 4 | 9.000 | 10.800 | 10.800 | 10.800 | 9.425 |  |
| shard.post | ms | warm | 524 | 0.000 | 0.100 | 0.100 | 0.100 | 0.024 | 1 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.025 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 524 | 0.000 | 0.100 | 0.100 | 0.100 | 0.024 |  |
| shard.post [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.100 | 0.200 | 0.025 |  |
| shard.post [static-install] | ms | cold | 4 | 0.000 | 0.100 | 0.100 | 0.100 | 0.025 |  |
| shard.reply-post | ms | warm | 524 | 0.000 | 0.100 | 0.200 | 0.200 | 0.040 | 1 of 1 |
| shard.reply-post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.038 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 524 | 0.000 | 0.100 | 0.200 | 0.200 | 0.040 |  |
| shard.reply-post [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.200 | 0.300 | 0.039 |  |
| shard.reply-post [static-install] | ms | cold | 4 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.roundtrip | ms | warm | 524 | 1.400 | 3.300 | 8.100 | 9.000 | 1.681 | 1 of 1 |
| shard.roundtrip | ms | cold | 400 | 1.500 | 5.100 | 7.100 | 33.300 | 2.162 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 524 | 1.400 | 3.300 | 8.100 | 9.000 | 1.681 |  |
| shard.roundtrip [pose-only] | ms | cold | 396 | 1.500 | 4.900 | 5.900 | 7.100 | 1.873 |  |
| shard.roundtrip [static-install] | ms | cold | 4 | 30.300 | 33.300 | 33.300 | 33.300 | 30.775 |  |
| shard.transport | ms | warm | 524 | 0.100 | 1.800 | 4.800 | 5.500 | 0.409 | 1 of 1 |
| shard.transport | ms | cold | 400 | 0.200 | 3.500 | 4.600 | 22.900 | 0.788 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 524 | 0.100 | 1.800 | 4.800 | 5.500 | 0.409 |  |
| shard.transport [pose-only] | ms | cold | 396 | 0.200 | 3.300 | 4.100 | 4.600 | 0.581 |  |
| shard.transport [static-install] | ms | cold | 4 | 21.300 | 22.900 | 22.900 | 22.900 | 21.325 |  |
| shard.worker-deserialize | ms | warm | 524 | 0.000 | 0.100 | 0.100 | 0.100 | 0.026 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.100 | 0.026 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 524 | 0.000 | 0.100 | 0.100 | 0.100 | 0.026 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.100 | 0.100 | 0.026 |  |
| shard.worker-deserialize [static-install] | ms | cold | 4 | 0.000 | 0.100 | 0.100 | 0.100 | 0.025 |  |

## TS-W W01_H100_POSE_60HZ_60S pass=bare boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=3600 coalesced=2911 dispatched=not-applicable completed=689 accepted=689 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| job.submit-to-accepted | ms | warm | 631 | 13.600 | 20.700 | 26.200 | 88.600 | 14.224 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 58 | 12.400 | 19.100 | 43.500 | 43.500 | 12.881 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 631 | 13.600 | 20.700 | 26.200 | 88.600 | 14.224 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 57 | 12.400 | 18.900 | 19.500 | 19.500 | 12.344 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 43.500 | 43.500 | 43.500 | 43.500 | 43.500 |  |
| pool.compute-metric | ms | warm | 631 | 1.900 | 4.900 | 12.000 | 45.500 | 2.488 | 1 of 1 |
| pool.compute-metric | ms | cold | 58 | 1.700 | 3.700 | 27.400 | 27.400 | 2.322 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 631 | 1.900 | 4.900 | 12.000 | 45.500 | 2.488 |  |
| pool.compute-metric [pose-only] | ms | cold | 57 | 1.700 | 3.600 | 3.800 | 3.800 | 1.882 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 27.400 | 27.400 | 27.400 | 27.400 | 27.400 |  |

## TS-W W01_H100_POSE_60HZ_60S pass=clean boundary=browser-pool workers=1 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=3600 coalesced=2953 dispatched=647 completed=647 accepted=647 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 547 | 0.100 | 0.200 | 0.300 | 0.500 | 0.058 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 0.400 | 0.048 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 547 | 0.100 | 0.200 | 0.300 | 0.500 | 0.058 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.200 | 0.200 | 0.044 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 0.400 | 0.400 | 0.400 | 0.400 | 0.400 |  |
| display.derive | ms | warm | 591 | 0.400 | 1.800 | 3.800 | 14.600 | 0.645 | 1 of 1 |
| display.derive | ms | cold | 56 | 0.500 | 1.500 | 4.400 | 4.400 | 0.620 | 1 of 1 |
| display.derive [pose-only] | ms | warm | 591 | 0.400 | 1.800 | 3.800 | 14.600 | 0.645 |  |
| display.derive [pose-only] | ms | cold | 55 | 0.500 | 1.400 | 1.700 | 1.700 | 0.551 |  |
| display.derive [static-install] | ms | cold | 1 | 4.400 | 4.400 | 4.400 | 4.400 | 4.400 |  |
| input.lateness | ms | warm | 3299 | 0.333 | 19.000 | 106.200 | 125.333 | 3.993 | 0 of 1 |
| input.lateness | ms | cold | 301 | 0.233 | 1.333 | 1.800 | 7.733 | 0.349 | 0 of 1 |
| input.project | ms | warm | 3299 | 3.400 | 6.300 | 25.700 | 44.500 | 3.599 | 0 of 1 |
| input.project | ms | cold | 301 | 2.100 | 4.000 | 4.200 | 15.100 | 2.479 | 0 of 1 |
| install.ack-roundtrip | ms | cold | 1 | 8.600 | 8.600 | 8.600 | 8.600 | 8.600 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 1 | 8.600 | 8.600 | 8.600 | 8.600 | 8.600 |  |
| install.post | ms | cold | 1 | 1.300 | 1.300 | 1.300 | 1.300 | 1.300 | 1 of 1 |
| install.post [static-install] | ms | cold | 1 | 1.300 | 1.300 | 1.300 | 1.300 | 1.300 |  |
| install.worker-deserialize | ms | cold | 1 | 1.700 | 1.700 | 1.700 | 1.700 | 1.700 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 1 | 1.700 | 1.700 | 1.700 | 1.700 | 1.700 |  |
| job.phase-residual | ms | warm | 547 | 0.000 | 0.000 | 0.000 | 0.000 | -0.007 | 1 of 1 |
| job.phase-residual | ms | cold | 100 | 0.000 | 0.000 | 0.000 | 0.000 | -0.006 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 547 | 0.000 | 0.000 | 0.000 | 0.000 | -0.007 |  |
| job.phase-residual [pose-only] | ms | cold | 99 | 0.000 | 0.000 | 0.000 | 0.000 | -0.005 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.100 | -0.100 | -0.100 | -0.100 | -0.100 |  |
| job.submit-to-accepted | ms | warm | 591 | 16.600 | 24.500 | 113.400 | 128.300 | 19.232 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 56 | 15.800 | 24.400 | 33.400 | 33.400 | 16.705 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 591 | 16.600 | 24.500 | 113.400 | 128.300 | 19.232 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 55 | 15.800 | 24.400 | 24.700 | 24.700 | 16.402 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 33.400 | 33.400 | 33.400 | 33.400 | 33.400 |  |
| merge.assemble | ms | warm | 547 | 0.000 | 0.100 | 0.100 | 0.200 | 0.013 | 1 of 1 |
| merge.assemble | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.100 | 0.012 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 547 | 0.000 | 0.100 | 0.100 | 0.200 | 0.013 |  |
| merge.assemble [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.100 | 0.100 | 0.011 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| merge.reply-deserialize | ms | warm | 547 | 0.100 | 0.200 | 0.900 | 1.400 | 0.080 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 0.200 | 0.048 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 547 | 0.100 | 0.200 | 0.900 | 1.400 | 0.080 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.200 | 0.200 | 0.047 |  |
| merge.reply-deserialize [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| merge.validate | ms | warm | 547 | 0.400 | 1.600 | 8.100 | 19.800 | 0.684 | 1 of 1 |
| merge.validate | ms | cold | 100 | 0.300 | 1.500 | 1.800 | 2.200 | 0.463 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 547 | 0.400 | 1.600 | 8.100 | 19.800 | 0.684 |  |
| merge.validate [pose-only] | ms | cold | 99 | 0.300 | 1.500 | 2.200 | 2.200 | 0.452 |  |
| merge.validate [static-install] | ms | cold | 1 | 1.600 | 1.600 | 1.600 | 1.600 | 1.600 |  |
| pool.compute-metric | ms | warm | 591 | 6.100 | 12.600 | 87.200 | 98.300 | 7.444 | 1 of 1 |
| pool.compute-metric | ms | cold | 56 | 6.000 | 7.900 | 17.700 | 17.700 | 5.246 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 591 | 6.100 | 12.600 | 87.200 | 98.300 | 7.444 |  |
| pool.compute-metric [pose-only] | ms | cold | 55 | 6.000 | 7.700 | 9.800 | 9.800 | 5.020 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 17.700 | 17.700 | 17.700 | 17.700 | 17.700 |  |
| pool.shard-max | ms | warm | 591 | 4.900 | 9.000 | 53.900 | 70.500 | 5.668 | 1 of 1 |
| pool.shard-max | ms | cold | 56 | 4.700 | 6.800 | 7.300 | 7.300 | 4.214 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 591 | 4.900 | 9.000 | 53.900 | 70.500 | 5.668 |  |
| pool.shard-max [pose-only] | ms | cold | 55 | 4.700 | 6.700 | 6.900 | 6.900 | 4.158 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 7.300 | 7.300 | 7.300 | 7.300 | 7.300 |  |
| pool.shard-total | ms | warm | 591 | 4.900 | 9.000 | 53.900 | 70.500 | 5.668 | 1 of 1 |
| pool.shard-total | ms | cold | 56 | 4.700 | 6.800 | 7.300 | 7.300 | 4.214 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 591 | 4.900 | 9.000 | 53.900 | 70.500 | 5.668 |  |
| pool.shard-total [pose-only] | ms | cold | 55 | 4.700 | 6.700 | 6.900 | 6.900 | 4.158 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 7.300 | 7.300 | 7.300 | 7.300 | 7.300 |  |
| pose.age-at-accept | ms | warm | 591 | 0.000 | 17.800 | 74.000 | 86.400 | 8.766 | 1 of 1 |
| pose.age-at-accept | ms | cold | 56 | 0.000 | 17.900 | 26.800 | 26.800 | 6.779 | 1 of 1 |
| pose.age-at-accept [pose-only] | ms | warm | 591 | 0.000 | 17.800 | 74.000 | 86.400 | 8.766 |  |
| pose.age-at-accept [pose-only] | ms | cold | 55 | 0.000 | 17.900 | 17.900 | 17.900 | 6.415 |  |
| pose.age-at-accept [static-install] | ms | cold | 1 | 26.800 | 26.800 | 26.800 | 26.800 | 26.800 |  |
| pose.latest-wait | ms | warm | 3299 | 55.000 | 98.000 | 163.600 | 237.400 | 57.152 | 0 of 1 |
| pose.latest-wait | ms | cold | 301 | 53.900 | 96.200 | 99.600 | 104.400 | 53.424 | 0 of 1 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 3299 | 55.000 | 98.000 | 163.600 | 237.400 | 57.152 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 301 | 53.900 | 96.200 | 99.600 | 104.400 | 53.424 |  |
| queue.rate-limit | ms | warm | 547 | 5.733 | 13.033 | 14.633 | 57.533 | 6.047 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 7.933 | 13.633 | 15.233 | 15.833 | 6.748 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 547 | 5.733 | 13.033 | 14.633 | 57.533 | 6.047 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 8.033 | 14.133 | 15.833 | 15.833 | 6.816 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 547 | 1.167 | 5.200 | 6.100 | 14.300 | 1.899 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.867 | 4.700 | 5.200 | 5.367 | 1.484 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 547 | 1.167 | 5.200 | 6.100 | 14.300 | 1.899 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 0.867 | 4.900 | 5.367 | 5.367 | 1.498 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| queue.wait | ms | warm | 547 | 6.200 | 13.500 | 15.100 | 59.700 | 7.964 | 1 of 1 |
| queue.wait | ms | cold | 100 | 8.000 | 13.900 | 15.600 | 16.500 | 8.245 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 547 | 6.200 | 13.500 | 15.100 | 59.700 | 7.964 |  |
| queue.wait [pose-only] | ms | cold | 99 | 8.100 | 14.300 | 16.500 | 16.500 | 8.326 |  |
| queue.wait [static-install] | ms | cold | 1 | 0.200 | 0.200 | 0.200 | 0.200 | 0.200 |  |
| shard.compute | ms | warm | 547 | 4.900 | 9.500 | 53.900 | 70.500 | 5.712 | 1 of 1 |
| shard.compute | ms | cold | 100 | 5.000 | 6.600 | 6.900 | 7.300 | 4.612 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 547 | 4.900 | 9.500 | 53.900 | 70.500 | 5.712 |  |
| shard.compute [pose-only] | ms | cold | 99 | 5.000 | 6.600 | 6.900 | 6.900 | 4.585 |  |
| shard.compute [static-install] | ms | cold | 1 | 7.300 | 7.300 | 7.300 | 7.300 | 7.300 |  |
| shard.post | ms | warm | 547 | 0.000 | 0.200 | 0.400 | 0.500 | 0.059 | 1 of 1 |
| shard.post | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 0.200 | 0.038 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 547 | 0.000 | 0.200 | 0.400 | 0.500 | 0.059 |  |
| shard.post [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.200 | 0.200 | 0.038 |  |
| shard.post [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.reply-post | ms | warm | 547 | 0.100 | 0.200 | 0.900 | 2.100 | 0.127 | 1 of 1 |
| shard.reply-post | ms | cold | 100 | 0.100 | 0.200 | 0.200 | 0.200 | 0.096 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 547 | 0.100 | 0.200 | 0.900 | 2.100 | 0.127 |  |
| shard.reply-post [pose-only] | ms | cold | 99 | 0.100 | 0.200 | 0.200 | 0.200 | 0.097 |  |
| shard.reply-post [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.roundtrip | ms | warm | 547 | 5.500 | 11.100 | 74.400 | 86.500 | 6.732 | 1 of 1 |
| shard.roundtrip | ms | cold | 100 | 5.700 | 7.300 | 10.000 | 14.700 | 5.300 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 547 | 5.500 | 11.100 | 74.400 | 86.500 | 6.732 |  |
| shard.roundtrip [pose-only] | ms | cold | 99 | 5.700 | 7.300 | 10.000 | 10.000 | 5.205 |  |
| shard.roundtrip [static-install] | ms | cold | 1 | 14.700 | 14.700 | 14.700 | 14.700 | 14.700 |  |
| shard.transport | ms | warm | 547 | 0.200 | 3.100 | 11.600 | 31.600 | 0.856 | 1 of 1 |
| shard.transport | ms | cold | 100 | 0.200 | 2.400 | 3.800 | 7.400 | 0.565 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 547 | 0.200 | 3.100 | 11.600 | 31.600 | 0.856 |  |
| shard.transport [pose-only] | ms | cold | 99 | 0.200 | 2.400 | 3.800 | 3.800 | 0.496 |  |
| shard.transport [static-install] | ms | cold | 1 | 7.400 | 7.400 | 7.400 | 7.400 | 7.400 |  |
| shard.worker-deserialize | ms | warm | 547 | 0.000 | 0.100 | 0.200 | 0.400 | 0.036 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.100 | 0.027 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 547 | 0.000 | 0.100 | 0.200 | 0.400 | 0.036 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.100 | 0.100 | 0.027 |  |
| shard.worker-deserialize [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |

## TS-W W01_H100_POSE_60HZ_60S pass=clean boundary=browser-pool workers=2 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=3600 coalesced=2932 dispatched=668 completed=668 accepted=668 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 568 | 0.000 | 0.100 | 0.200 | 0.400 | 0.049 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.100 | 0.200 | 0.400 | 0.400 | 0.067 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 568 | 0.000 | 0.100 | 0.200 | 0.400 | 0.049 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.100 | 0.200 | 0.400 | 0.400 | 0.065 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 0.300 | 0.300 | 0.300 | 0.300 | 0.300 |  |
| display.derive | ms | warm | 611 | 0.400 | 2.000 | 3.600 | 8.400 | 0.658 | 1 of 1 |
| display.derive | ms | cold | 57 | 0.600 | 1.900 | 6.300 | 6.300 | 0.840 | 1 of 1 |
| display.derive [pose-only] | ms | warm | 611 | 0.400 | 2.000 | 3.600 | 8.400 | 0.658 |  |
| display.derive [pose-only] | ms | cold | 56 | 0.600 | 1.800 | 2.300 | 2.300 | 0.743 |  |
| display.derive [static-install] | ms | cold | 1 | 6.300 | 6.300 | 6.300 | 6.300 | 6.300 |  |
| input.lateness | ms | warm | 3299 | 0.300 | 1.633 | 60.300 | 113.933 | 1.635 | 0 of 1 |
| input.lateness | ms | cold | 301 | 0.200 | 1.433 | 1.967 | 2.067 | 0.254 | 0 of 1 |
| input.project | ms | warm | 3299 | 3.500 | 5.900 | 12.100 | 42.300 | 3.544 | 0 of 1 |
| input.project | ms | cold | 301 | 3.100 | 4.100 | 4.800 | 11.700 | 2.623 | 0 of 1 |
| install.ack-roundtrip | ms | cold | 2 | 6.500 | 7.200 | 7.200 | 7.200 | 6.850 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 2 | 6.500 | 7.200 | 7.200 | 7.200 | 6.850 |  |
| install.post | ms | cold | 2 | 0.800 | 1.000 | 1.000 | 1.000 | 0.900 | 1 of 1 |
| install.post [static-install] | ms | cold | 2 | 0.800 | 1.000 | 1.000 | 1.000 | 0.900 |  |
| install.worker-deserialize | ms | cold | 2 | 1.300 | 1.500 | 1.500 | 1.500 | 1.400 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 2 | 1.300 | 1.500 | 1.500 | 1.500 | 1.400 |  |
| job.phase-residual | ms | warm | 564 | 0.000 | 0.000 | 0.100 | 0.100 | -0.004 | 1 of 1 |
| job.phase-residual | ms | cold | 100 | 0.000 | 0.000 | 0.000 | 0.000 | -0.007 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 564 | 0.000 | 0.000 | 0.100 | 0.100 | -0.004 |  |
| job.phase-residual [pose-only] | ms | cold | 99 | 0.000 | 0.000 | 0.000 | 0.000 | -0.007 |  |
| job.phase-residual [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| job.submit-to-accepted | ms | warm | 611 | 15.100 | 23.500 | 38.200 | 92.300 | 16.714 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 57 | 14.400 | 22.000 | 27.900 | 27.900 | 15.211 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 611 | 15.100 | 23.500 | 38.200 | 92.300 | 16.714 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 56 | 14.300 | 21.800 | 22.200 | 22.200 | 14.984 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 27.900 | 27.900 | 27.900 | 27.900 | 27.900 |  |
| merge.assemble | ms | warm | 564 | 0.000 | 0.100 | 0.100 | 0.200 | 0.016 | 1 of 1 |
| merge.assemble | ms | cold | 100 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 564 | 0.000 | 0.100 | 0.100 | 0.200 | 0.016 |  |
| merge.assemble [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 0.200 | 0.200 | 0.017 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| merge.reply-deserialize | ms | warm | 1136 | 0.000 | 0.100 | 0.200 | 0.600 | 0.042 | 0 of 1 |
| merge.reply-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.300 | 0.500 | 0.045 | 0 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 1136 | 0.000 | 0.100 | 0.200 | 0.600 | 0.042 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.400 | 0.500 | 0.044 |  |
| merge.reply-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.200 | 0.200 | 0.200 | 0.100 |  |
| merge.validate | ms | warm | 1136 | 0.200 | 0.900 | 1.500 | 5.900 | 0.312 | 0 of 1 |
| merge.validate | ms | cold | 200 | 0.200 | 0.900 | 1.500 | 3.600 | 0.311 | 0 of 1 |
| merge.validate [pose-only] | ms | warm | 1136 | 0.200 | 0.900 | 1.500 | 5.900 | 0.312 |  |
| merge.validate [pose-only] | ms | cold | 198 | 0.200 | 0.900 | 3.400 | 3.600 | 0.305 |  |
| merge.validate [static-install] | ms | cold | 2 | 0.400 | 1.500 | 1.500 | 1.500 | 0.950 |  |
| pool.compute-metric | ms | warm | 611 | 3.700 | 10.200 | 19.700 | 51.900 | 4.833 | 1 of 1 |
| pool.compute-metric | ms | cold | 57 | 3.800 | 8.300 | 15.800 | 15.800 | 4.204 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 611 | 3.700 | 10.200 | 19.700 | 51.900 | 4.833 |  |
| pool.compute-metric [pose-only] | ms | cold | 56 | 3.700 | 7.600 | 9.900 | 9.900 | 3.996 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 15.800 | 15.800 | 15.800 | 15.800 | 15.800 |  |
| pool.shard-max | ms | warm | 611 | 2.900 | 5.000 | 12.500 | 38.600 | 3.187 | 1 of 1 |
| pool.shard-max | ms | cold | 57 | 3.100 | 3.800 | 6.800 | 6.800 | 2.828 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 611 | 2.900 | 5.000 | 12.500 | 38.600 | 3.187 |  |
| pool.shard-max [pose-only] | ms | cold | 56 | 3.100 | 3.800 | 4.300 | 4.300 | 2.757 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 6.800 | 6.800 | 6.800 | 6.800 | 6.800 |  |
| pool.shard-total | ms | warm | 611 | 5.300 | 9.500 | 24.300 | 73.500 | 5.865 | 1 of 1 |
| pool.shard-total | ms | cold | 57 | 5.500 | 7.500 | 13.100 | 13.100 | 5.260 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 611 | 5.300 | 9.500 | 24.300 | 73.500 | 5.865 |  |
| pool.shard-total [pose-only] | ms | cold | 56 | 5.400 | 7.400 | 7.800 | 7.800 | 5.120 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 13.100 | 13.100 | 13.100 | 13.100 | 13.100 |  |
| pose.age-at-accept | ms | warm | 611 | 0.000 | 17.700 | 19.000 | 48.000 | 6.389 | 1 of 1 |
| pose.age-at-accept | ms | cold | 57 | 0.000 | 17.100 | 17.500 | 17.500 | 5.411 | 1 of 1 |
| pose.age-at-accept [pose-only] | ms | warm | 611 | 0.000 | 17.700 | 19.000 | 48.000 | 6.389 |  |
| pose.age-at-accept [pose-only] | ms | cold | 56 | 0.000 | 17.100 | 17.500 | 17.500 | 5.220 |  |
| pose.age-at-accept [static-install] | ms | cold | 1 | 16.100 | 16.100 | 16.100 | 16.100 | 16.100 |  |
| pose.latest-wait | ms | warm | 3299 | 53.300 | 94.700 | 106.700 | 163.300 | 53.275 | 0 of 1 |
| pose.latest-wait | ms | cold | 301 | 49.900 | 93.200 | 96.500 | 97.800 | 51.378 | 0 of 1 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 3299 | 53.300 | 94.700 | 106.700 | 163.300 | 53.275 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 301 | 49.900 | 93.200 | 96.500 | 97.800 | 51.378 |  |
| queue.rate-limit | ms | warm | 568 | 7.633 | 12.833 | 13.633 | 46.233 | 6.420 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 7.533 | 12.833 | 13.833 | 15.633 | 6.328 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 568 | 7.633 | 12.833 | 13.633 | 46.233 | 6.420 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 7.733 | 12.833 | 15.633 | 15.633 | 6.392 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 568 | 0.767 | 5.000 | 5.800 | 11.367 | 1.604 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.767 | 4.800 | 5.700 | 6.100 | 1.644 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 568 | 0.767 | 5.000 | 5.800 | 11.367 | 1.604 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 0.767 | 5.000 | 6.100 | 6.100 | 1.660 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| queue.wait | ms | warm | 568 | 7.600 | 13.100 | 14.400 | 57.600 | 8.040 | 1 of 1 |
| queue.wait | ms | cold | 100 | 8.200 | 13.200 | 13.500 | 15.700 | 7.998 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 568 | 7.600 | 13.100 | 14.400 | 57.600 | 8.040 |  |
| queue.wait [pose-only] | ms | cold | 99 | 8.200 | 13.200 | 15.700 | 15.700 | 8.078 |  |
| queue.wait [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| shard.compute | ms | warm | 1136 | 2.700 | 4.400 | 9.500 | 38.600 | 2.850 | 0 of 1 |
| shard.compute | ms | cold | 200 | 2.800 | 6.300 | 16.200 | 33.700 | 3.229 | 0 of 1 |
| shard.compute [pose-only] | ms | warm | 1136 | 2.700 | 4.400 | 9.500 | 38.600 | 2.850 |  |
| shard.compute [pose-only] | ms | cold | 198 | 2.800 | 5.000 | 30.700 | 33.700 | 3.196 |  |
| shard.compute [static-install] | ms | cold | 2 | 6.300 | 6.800 | 6.800 | 6.800 | 6.550 |  |
| shard.post | ms | warm | 1136 | 0.000 | 0.100 | 0.200 | 0.800 | 0.043 | 0 of 1 |
| shard.post | ms | cold | 200 | 0.000 | 0.100 | 0.200 | 0.400 | 0.044 | 0 of 1 |
| shard.post [pose-only] | ms | warm | 1136 | 0.000 | 0.100 | 0.200 | 0.800 | 0.043 |  |
| shard.post [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.300 | 0.400 | 0.045 |  |
| shard.post [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.reply-post | ms | warm | 1136 | 0.100 | 0.200 | 0.400 | 2.000 | 0.080 | 0 of 1 |
| shard.reply-post | ms | cold | 200 | 0.100 | 0.200 | 0.500 | 0.800 | 0.085 | 0 of 1 |
| shard.reply-post [pose-only] | ms | warm | 1136 | 0.100 | 0.200 | 0.400 | 2.000 | 0.080 |  |
| shard.reply-post [pose-only] | ms | cold | 198 | 0.100 | 0.200 | 0.500 | 0.800 | 0.084 |  |
| shard.reply-post [static-install] | ms | cold | 2 | 0.000 | 0.200 | 0.200 | 0.200 | 0.100 |  |
| shard.roundtrip | ms | warm | 1136 | 3.300 | 7.600 | 14.500 | 45.500 | 3.953 | 0 of 1 |
| shard.roundtrip | ms | cold | 200 | 3.400 | 9.600 | 19.500 | 38.500 | 4.240 | 0 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 1136 | 3.300 | 7.600 | 14.500 | 45.500 | 3.953 |  |
| shard.roundtrip [pose-only] | ms | cold | 198 | 3.400 | 9.400 | 34.600 | 38.500 | 4.151 |  |
| shard.roundtrip [static-install] | ms | cold | 2 | 12.600 | 13.600 | 13.600 | 13.600 | 13.100 |  |
| shard.transport | ms | warm | 1136 | 0.300 | 3.700 | 6.600 | 15.700 | 0.991 | 0 of 1 |
| shard.transport | ms | cold | 200 | 0.200 | 3.800 | 5.600 | 6.800 | 0.894 | 0 of 1 |
| shard.transport [pose-only] | ms | warm | 1136 | 0.300 | 3.700 | 6.600 | 15.700 | 0.991 |  |
| shard.transport [pose-only] | ms | cold | 198 | 0.200 | 3.700 | 5.500 | 5.600 | 0.838 |  |
| shard.transport [static-install] | ms | cold | 2 | 6.100 | 6.800 | 6.800 | 6.800 | 6.450 |  |
| shard.worker-deserialize | ms | warm | 1136 | 0.000 | 0.100 | 0.200 | 0.500 | 0.031 | 0 of 1 |
| shard.worker-deserialize | ms | cold | 200 | 0.000 | 0.100 | 0.100 | 0.200 | 0.032 | 0 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 1136 | 0.000 | 0.100 | 0.200 | 0.500 | 0.031 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 198 | 0.000 | 0.100 | 0.200 | 0.200 | 0.032 |  |
| shard.worker-deserialize [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |

## TS-W W01_H100_POSE_60HZ_60S pass=clean boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 3
Denominators: submitted=10800 coalesced=8758 dispatched=2042 completed=2042 accepted=2042 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 1742 | 0.000 | 0.100 | 0.200 | 0.700 | 0.048 | 3 of 3 |
| dispatch.prepare | ms | cold | 300 | 0.000 | 0.100 | 0.400 | 0.800 | 0.059 | 3 of 3 |
| dispatch.prepare [pose-only] | ms | warm | 1742 | 0.000 | 0.100 | 0.200 | 0.700 | 0.048 |  |
| dispatch.prepare [pose-only] | ms | cold | 297 | 0.000 | 0.100 | 0.300 | 0.700 | 0.054 |  |
| dispatch.prepare [static-install] | ms | cold | 3 | 0.600 | 0.800 | 0.800 | 0.800 | 0.600 |  |
| display.derive | ms | warm | 1871 | 0.300 | 1.600 | 3.800 | 17.400 | 0.571 | 3 of 3 |
| display.derive | ms | cold | 171 | 0.400 | 2.700 | 6.200 | 6.600 | 0.813 | 3 of 3 |
| display.derive [pose-only] | ms | warm | 1871 | 0.300 | 1.600 | 3.800 | 17.400 | 0.571 |  |
| display.derive [pose-only] | ms | cold | 168 | 0.400 | 2.000 | 4.700 | 6.200 | 0.733 |  |
| display.derive [static-install] | ms | cold | 3 | 5.100 | 6.600 | 6.600 | 6.600 | 5.300 |  |
| input.lateness | ms | warm | 9898 | 0.267 | 1.833 | 90.000 | 154.167 | 2.567 | 0 of 3 |
| input.lateness | ms | cold | 902 | 0.200 | 2.000 | 67.733 | 93.900 | 2.158 | 0 of 3 |
| input.project | ms | warm | 9898 | 2.900 | 5.200 | 11.800 | 42.800 | 2.995 | 0 of 3 |
| input.project | ms | cold | 902 | 1.900 | 5.900 | 17.500 | 34.300 | 2.676 | 0 of 3 |
| install.ack-roundtrip | ms | cold | 12 | 11.300 | 18.200 | 18.200 | 18.200 | 12.650 | 3 of 3 |
| install.ack-roundtrip [static-install] | ms | cold | 12 | 11.300 | 18.200 | 18.200 | 18.200 | 12.650 |  |
| install.post | ms | cold | 12 | 1.200 | 1.600 | 1.600 | 1.600 | 1.183 | 3 of 3 |
| install.post [static-install] | ms | cold | 12 | 1.200 | 1.600 | 1.600 | 1.600 | 1.183 |  |
| install.worker-deserialize | ms | cold | 12 | 2.100 | 2.900 | 2.900 | 2.900 | 1.967 | 3 of 3 |
| install.worker-deserialize [static-install] | ms | cold | 12 | 2.100 | 2.900 | 2.900 | 2.900 | 1.967 |  |
| job.phase-residual | ms | warm | 1591 | 0.000 | 0.000 | 0.100 | 0.200 | -0.002 | 3 of 3 |
| job.phase-residual | ms | cold | 262 | 0.000 | 0.100 | 0.100 | 0.100 | 0.001 | 3 of 3 |
| job.phase-residual [pose-only] | ms | warm | 1591 | 0.000 | 0.000 | 0.100 | 0.200 | -0.002 |  |
| job.phase-residual [pose-only] | ms | cold | 260 | 0.000 | 0.100 | 0.100 | 0.100 | 0.001 |  |
| job.phase-residual [static-install] | ms | cold | 2 | -0.100 | -0.000 | -0.000 | -0.000 | -0.050 |  |
| job.submit-to-accepted | ms | warm | 1871 | 13.900 | 22.200 | 67.000 | 97.800 | 15.183 | 3 of 3 |
| job.submit-to-accepted | ms | cold | 171 | 13.600 | 24.600 | 76.900 | 79.800 | 15.002 | 3 of 3 |
| job.submit-to-accepted [pose-only] | ms | warm | 1871 | 13.900 | 22.200 | 67.000 | 97.800 | 15.183 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 168 | 13.600 | 22.000 | 76.900 | 79.800 | 14.559 |  |
| job.submit-to-accepted [static-install] | ms | cold | 3 | 41.400 | 49.100 | 49.100 | 49.100 | 39.833 |  |
| merge.assemble | ms | warm | 1591 | 0.000 | 0.100 | 0.100 | 1.400 | 0.013 | 3 of 3 |
| merge.assemble | ms | cold | 262 | 0.000 | 0.100 | 0.100 | 0.200 | 0.011 | 3 of 3 |
| merge.assemble [pose-only] | ms | warm | 1591 | 0.000 | 0.100 | 0.100 | 1.400 | 0.013 |  |
| merge.assemble [pose-only] | ms | cold | 260 | 0.000 | 0.100 | 0.100 | 0.100 | 0.010 |  |
| merge.assemble [static-install] | ms | cold | 2 | 0.100 | 0.200 | 0.200 | 0.200 | 0.150 |  |
| merge.reply-deserialize | ms | warm | 6968 | 0.000 | 0.100 | 0.200 | 1.200 | 0.024 | 0 of 3 |
| merge.reply-deserialize | ms | cold | 1200 | 0.000 | 0.100 | 0.200 | 0.300 | 0.020 | 0 of 3 |
| merge.reply-deserialize [pose-only] | ms | warm | 6968 | 0.000 | 0.100 | 0.200 | 1.200 | 0.024 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 1188 | 0.000 | 0.100 | 0.200 | 0.300 | 0.020 |  |
| merge.reply-deserialize [static-install] | ms | cold | 12 | 0.000 | 0.200 | 0.200 | 0.200 | 0.033 |  |
| merge.validate | ms | warm | 6968 | 0.100 | 0.500 | 1.300 | 7.200 | 0.159 | 0 of 3 |
| merge.validate | ms | cold | 1200 | 0.100 | 0.500 | 1.000 | 7.000 | 0.142 | 0 of 3 |
| merge.validate [pose-only] | ms | warm | 6968 | 0.100 | 0.500 | 1.300 | 7.200 | 0.159 |  |
| merge.validate [pose-only] | ms | cold | 1188 | 0.100 | 0.500 | 0.900 | 2.500 | 0.132 |  |
| merge.validate [static-install] | ms | cold | 12 | 0.200 | 7.000 | 7.000 | 7.000 | 1.108 |  |
| pool.compute-metric | ms | warm | 1871 | 2.300 | 6.500 | 35.400 | 60.200 | 3.277 | 3 of 3 |
| pool.compute-metric | ms | cold | 171 | 2.300 | 7.500 | 37.800 | 41.000 | 3.495 | 3 of 3 |
| pool.compute-metric [pose-only] | ms | warm | 1871 | 2.300 | 6.500 | 35.400 | 60.200 | 3.277 |  |
| pool.compute-metric [pose-only] | ms | cold | 168 | 2.300 | 7.300 | 37.800 | 41.000 | 3.148 |  |
| pool.compute-metric [static-install] | ms | cold | 3 | 23.400 | 28.500 | 28.500 | 28.500 | 22.900 |  |
| pool.shard-max | ms | warm | 1871 | 1.600 | 2.600 | 10.700 | 22.700 | 1.712 | 3 of 3 |
| pool.shard-max | ms | cold | 171 | 1.700 | 4.500 | 18.400 | 19.400 | 1.910 | 3 of 3 |
| pool.shard-max [pose-only] | ms | warm | 1871 | 1.600 | 2.600 | 10.700 | 22.700 | 1.712 |  |
| pool.shard-max [pose-only] | ms | cold | 168 | 1.600 | 3.600 | 18.400 | 19.400 | 1.822 |  |
| pool.shard-max [static-install] | ms | cold | 3 | 7.900 | 8.000 | 8.000 | 8.000 | 6.833 |  |
| pool.shard-total | ms | warm | 1871 | 4.900 | 8.300 | 34.600 | 81.200 | 5.426 | 3 of 3 |
| pool.shard-total | ms | cold | 171 | 4.600 | 15.500 | 46.000 | 64.500 | 5.965 | 3 of 3 |
| pool.shard-total [pose-only] | ms | warm | 1871 | 4.900 | 8.300 | 34.600 | 81.200 | 5.426 |  |
| pool.shard-total [pose-only] | ms | cold | 168 | 4.500 | 10.500 | 46.000 | 64.500 | 5.620 |  |
| pool.shard-total [static-install] | ms | cold | 3 | 29.000 | 29.900 | 29.900 | 29.900 | 25.333 |  |
| pose.age-at-accept | ms | warm | 1871 | 0.000 | 17.300 | 22.600 | 43.000 | 4.666 | 3 of 3 |
| pose.age-at-accept | ms | cold | 171 | 0.000 | 17.000 | 40.700 | 41.000 | 4.589 | 3 of 3 |
| pose.age-at-accept [pose-only] | ms | warm | 1871 | 0.000 | 17.300 | 22.600 | 43.000 | 4.666 |  |
| pose.age-at-accept [pose-only] | ms | cold | 168 | 0.000 | 16.900 | 40.700 | 41.000 | 4.146 |  |
| pose.age-at-accept [static-install] | ms | cold | 3 | 33.100 | 39.100 | 39.100 | 39.100 | 29.433 |  |
| pose.latest-wait | ms | warm | 9898 | 48.900 | 91.900 | 102.500 | 185.400 | 50.754 | 0 of 3 |
| pose.latest-wait | ms | cold | 902 | 48.600 | 91.100 | 106.800 | 169.900 | 50.443 | 0 of 3 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 9898 | 48.900 | 91.900 | 102.500 | 185.400 | 50.754 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 902 | 48.600 | 91.100 | 106.800 | 169.900 | 50.443 |  |
| queue.rate-limit | ms | warm | 1742 | 8.133 | 13.433 | 14.733 | 72.633 | 7.296 | 3 of 3 |
| queue.rate-limit | ms | cold | 300 | 8.133 | 13.533 | 15.033 | 15.933 | 7.435 | 3 of 3 |
| queue.rate-limit [pose-only] | ms | warm | 1742 | 8.133 | 13.433 | 14.733 | 72.633 | 7.296 |  |
| queue.rate-limit [pose-only] | ms | cold | 297 | 8.133 | 13.833 | 15.033 | 15.933 | 7.510 |  |
| queue.rate-limit [static-install] | ms | cold | 3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 1742 | 0.567 | 5.000 | 5.800 | 8.567 | 1.353 | 3 of 3 |
| queue.timer-lateness | ms | cold | 300 | 0.367 | 4.700 | 6.100 | 6.500 | 1.117 | 3 of 3 |
| queue.timer-lateness [pose-only] | ms | warm | 1742 | 0.567 | 5.000 | 5.800 | 8.567 | 1.353 |  |
| queue.timer-lateness [pose-only] | ms | cold | 297 | 0.367 | 4.700 | 6.100 | 6.500 | 1.128 |  |
| queue.timer-lateness [static-install] | ms | cold | 3 | 0.000 | 0.100 | 0.100 | 0.100 | 0.033 |  |
| queue.wait | ms | warm | 1742 | 8.500 | 13.900 | 15.400 | 73.200 | 8.661 | 3 of 3 |
| queue.wait | ms | cold | 300 | 8.200 | 13.900 | 15.200 | 16.000 | 8.568 | 3 of 3 |
| queue.wait [pose-only] | ms | warm | 1742 | 8.500 | 13.900 | 15.400 | 73.200 | 8.661 |  |
| queue.wait [pose-only] | ms | cold | 297 | 8.300 | 14.000 | 15.600 | 16.000 | 8.654 |  |
| queue.wait [static-install] | ms | cold | 3 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| shard.compute | ms | warm | 6968 | 1.300 | 2.200 | 8.500 | 22.700 | 1.374 | 0 of 3 |
| shard.compute | ms | cold | 1200 | 1.100 | 2.300 | 7.100 | 19.400 | 1.330 | 0 of 3 |
| shard.compute [pose-only] | ms | warm | 6968 | 1.300 | 2.200 | 8.500 | 22.700 | 1.374 |  |
| shard.compute [pose-only] | ms | cold | 1188 | 1.100 | 2.200 | 4.700 | 19.400 | 1.280 |  |
| shard.compute [static-install] | ms | cold | 12 | 7.100 | 8.000 | 8.000 | 8.000 | 6.333 |  |
| shard.post | ms | warm | 6968 | 0.000 | 0.100 | 0.200 | 1.000 | 0.032 | 0 of 3 |
| shard.post | ms | cold | 1200 | 0.000 | 0.100 | 0.200 | 0.600 | 0.030 | 0 of 3 |
| shard.post [pose-only] | ms | warm | 6968 | 0.000 | 0.100 | 0.200 | 1.000 | 0.032 |  |
| shard.post [pose-only] | ms | cold | 1188 | 0.000 | 0.100 | 0.200 | 0.600 | 0.030 |  |
| shard.post [static-install] | ms | cold | 12 | 0.000 | 0.100 | 0.100 | 0.100 | 0.008 |  |
| shard.reply-post | ms | warm | 6968 | 0.000 | 0.200 | 0.400 | 3.800 | 0.058 | 0 of 3 |
| shard.reply-post | ms | cold | 1200 | 0.000 | 0.100 | 0.300 | 0.900 | 0.048 | 0 of 3 |
| shard.reply-post [pose-only] | ms | warm | 6968 | 0.000 | 0.200 | 0.400 | 3.800 | 0.058 |  |
| shard.reply-post [pose-only] | ms | cold | 1188 | 0.000 | 0.100 | 0.300 | 0.900 | 0.048 |  |
| shard.reply-post [static-install] | ms | cold | 12 | 0.000 | 0.100 | 0.100 | 0.100 | 0.033 |  |
| shard.roundtrip | ms | warm | 6968 | 1.700 | 5.500 | 29.700 | 57.000 | 2.538 | 0 of 3 |
| shard.roundtrip | ms | cold | 1200 | 1.700 | 5.400 | 19.800 | 39.000 | 2.328 | 0 of 3 |
| shard.roundtrip [pose-only] | ms | warm | 6968 | 1.700 | 5.500 | 29.700 | 57.000 | 2.538 |  |
| shard.roundtrip [pose-only] | ms | cold | 1188 | 1.700 | 5.000 | 13.400 | 39.000 | 2.164 |  |
| shard.roundtrip [static-install] | ms | cold | 12 | 18.900 | 24.500 | 24.500 | 24.500 | 18.533 |  |
| shard.transport | ms | warm | 6968 | 0.300 | 3.800 | 15.000 | 45.100 | 1.074 | 0 of 3 |
| shard.transport | ms | cold | 1200 | 0.300 | 3.500 | 12.600 | 27.900 | 0.923 | 0 of 3 |
| shard.transport [pose-only] | ms | warm | 6968 | 0.300 | 3.800 | 15.000 | 45.100 | 1.074 |  |
| shard.transport [pose-only] | ms | cold | 1188 | 0.200 | 3.200 | 8.500 | 27.900 | 0.810 |  |
| shard.transport [static-install] | ms | cold | 12 | 11.700 | 17.100 | 17.100 | 17.100 | 12.150 |  |
| shard.worker-deserialize | ms | warm | 6968 | 0.000 | 0.100 | 0.200 | 0.900 | 0.031 | 0 of 3 |
| shard.worker-deserialize | ms | cold | 1200 | 0.000 | 0.100 | 0.100 | 0.500 | 0.027 | 0 of 3 |
| shard.worker-deserialize [pose-only] | ms | warm | 6968 | 0.000 | 0.100 | 0.200 | 0.900 | 0.031 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 1188 | 0.000 | 0.100 | 0.200 | 0.500 | 0.027 |  |
| shard.worker-deserialize [static-install] | ms | cold | 12 | 0.000 | 0.100 | 0.100 | 0.100 | 0.017 |  |

## TS-W W01_H100_POSE_60HZ_60S pass=traced boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1201 coalesced=969 dispatched=232 completed=232 accepted=232 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 132 | 0.000 | 0.100 | 0.200 | 0.200 | 0.037 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.000 | 0.100 | 0.800 | 1.200 | 0.050 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 132 | 0.000 | 0.100 | 0.200 | 0.200 | 0.037 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.000 | 0.100 | 1.200 | 1.200 | 0.042 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 0.800 | 0.800 | 0.800 | 0.800 | 0.800 |  |
| display.derive | ms | warm | 173 | 0.300 | 1.200 | 3.700 | 6.700 | 0.483 | 1 of 1 |
| display.derive | ms | cold | 59 | 0.400 | 1.100 | 8.600 | 8.600 | 0.629 | 1 of 1 |
| display.derive [pose-only] | ms | warm | 173 | 0.300 | 1.200 | 3.700 | 6.700 | 0.483 |  |
| display.derive [pose-only] | ms | cold | 58 | 0.400 | 1.100 | 2.700 | 2.700 | 0.491 |  |
| display.derive [static-install] | ms | cold | 1 | 8.600 | 8.600 | 8.600 | 8.600 | 8.600 |  |
| input.lateness | ms | warm | 900 | 0.267 | 1.300 | 166.700 | 208.833 | 4.070 | 0 of 1 |
| input.lateness | ms | cold | 301 | 0.167 | 1.067 | 1.300 | 14.433 | 0.231 | 0 of 1 |
| input.project | ms | warm | 900 | 1.300 | 4.100 | 7.000 | 107.900 | 1.837 | 0 of 1 |
| input.project | ms | cold | 301 | 1.400 | 1.800 | 2.300 | 19.600 | 1.437 | 0 of 1 |
| install.ack-roundtrip | ms | cold | 4 | 14.200 | 16.600 | 16.600 | 16.600 | 14.900 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 4 | 14.200 | 16.600 | 16.600 | 16.600 | 14.900 |  |
| install.post | ms | cold | 4 | 1.300 | 1.400 | 1.400 | 1.400 | 1.300 | 1 of 1 |
| install.post [static-install] | ms | cold | 4 | 1.300 | 1.400 | 1.400 | 1.400 | 1.300 |  |
| install.worker-deserialize | ms | cold | 4 | 2.100 | 2.200 | 2.200 | 2.200 | 2.100 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 4 | 2.100 | 2.200 | 2.200 | 2.200 | 2.100 |  |
| job.phase-residual | ms | warm | 108 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 | 1 of 1 |
| job.phase-residual | ms | cold | 83 | 0.000 | 0.100 | 1.700 | 1.700 | 0.029 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 108 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| job.phase-residual [pose-only] | ms | cold | 82 | 0.000 | 0.100 | 1.700 | 1.700 | 0.030 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.100 | -0.100 | -0.100 | -0.100 | -0.100 |  |
| job.submit-to-accepted | ms | warm | 173 | 12.100 | 19.800 | 69.200 | 232.400 | 14.187 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 59 | 12.200 | 18.500 | 54.800 | 54.800 | 12.800 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 173 | 12.100 | 19.800 | 69.200 | 232.400 | 14.187 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 58 | 11.900 | 18.300 | 19.200 | 19.200 | 12.076 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 54.800 | 54.800 | 54.800 | 54.800 | 54.800 |  |
| merge.assemble | ms | warm | 108 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 | 1 of 1 |
| merge.assemble | ms | cold | 83 | 0.000 | 0.100 | 0.200 | 0.200 | 0.014 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 108 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 |  |
| merge.assemble [pose-only] | ms | cold | 82 | 0.000 | 0.100 | 0.100 | 0.100 | 0.012 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.200 | 0.200 | 0.200 | 0.200 | 0.200 |  |
| merge.reply-deserialize | ms | warm | 528 | 0.000 | 0.100 | 0.100 | 0.400 | 0.017 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.500 | 0.016 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 528 | 0.000 | 0.100 | 0.100 | 0.400 | 0.017 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.200 | 0.500 | 0.016 |  |
| merge.reply-deserialize [static-install] | ms | cold | 4 | 0.000 | 0.200 | 0.200 | 0.200 | 0.050 |  |
| merge.validate | ms | warm | 528 | 0.100 | 0.400 | 0.800 | 1.200 | 0.110 | 1 of 1 |
| merge.validate | ms | cold | 400 | 0.100 | 0.400 | 0.700 | 1.800 | 0.115 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 528 | 0.100 | 0.400 | 0.800 | 1.200 | 0.110 |  |
| merge.validate [pose-only] | ms | cold | 396 | 0.100 | 0.400 | 0.700 | 1.100 | 0.110 |  |
| merge.validate [static-install] | ms | cold | 4 | 0.200 | 1.800 | 1.800 | 1.800 | 0.625 |  |
| pool.compute-metric | ms | warm | 173 | 1.300 | 4.800 | 11.000 | 123.500 | 2.394 | 1 of 1 |
| pool.compute-metric | ms | cold | 59 | 1.400 | 3.100 | 29.700 | 29.700 | 2.002 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 173 | 1.300 | 4.800 | 11.000 | 123.500 | 2.394 |  |
| pool.compute-metric [pose-only] | ms | cold | 58 | 1.400 | 2.800 | 3.200 | 3.200 | 1.524 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 29.700 | 29.700 | 29.700 | 29.700 | 29.700 |  |
| pool.shard-max | ms | warm | 173 | 0.800 | 3.000 | 6.000 | 82.000 | 1.483 | 1 of 1 |
| pool.shard-max | ms | cold | 59 | 0.900 | 2.000 | 9.600 | 9.600 | 1.103 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 173 | 0.800 | 3.000 | 6.000 | 82.000 | 1.483 |  |
| pool.shard-max [pose-only] | ms | cold | 58 | 0.900 | 1.700 | 2.700 | 2.700 | 0.957 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 9.600 | 9.600 | 9.600 | 9.600 | 9.600 |  |
| pool.shard-total | ms | warm | 173 | 2.200 | 8.100 | 19.000 | 234.300 | 4.180 | 1 of 1 |
| pool.shard-total | ms | cold | 59 | 2.800 | 5.300 | 36.600 | 36.600 | 3.420 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 173 | 2.200 | 8.100 | 19.000 | 234.300 | 4.180 |  |
| pool.shard-total [pose-only] | ms | cold | 58 | 2.800 | 4.600 | 5.600 | 5.600 | 2.848 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 36.600 | 36.600 | 36.600 | 36.600 | 36.600 |  |
| pose.age-at-accept | ms | warm | 173 | 0.000 | 16.600 | 17.500 | 117.800 | 3.255 | 1 of 1 |
| pose.age-at-accept | ms | cold | 59 | 0.000 | 16.600 | 50.200 | 50.200 | 2.781 | 1 of 1 |
| pose.age-at-accept [pose-only] | ms | warm | 173 | 0.000 | 16.600 | 17.500 | 117.800 | 3.255 |  |
| pose.age-at-accept [pose-only] | ms | cold | 58 | 0.000 | 16.600 | 16.800 | 16.800 | 1.964 |  |
| pose.age-at-accept [static-install] | ms | cold | 1 | 50.200 | 50.200 | 50.200 | 50.200 | 50.200 |  |
| pose.latest-wait | ms | warm | 900 | 46.900 | 85.500 | 95.300 | 265.700 | 48.366 | 0 of 1 |
| pose.latest-wait | ms | cold | 301 | 46.700 | 84.600 | 91.300 | 111.400 | 47.074 | 0 of 1 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 900 | 46.900 | 85.500 | 95.300 | 265.700 | 48.366 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 301 | 46.700 | 84.600 | 91.300 | 111.400 | 47.074 |  |
| queue.rate-limit | ms | warm | 132 | 9.333 | 14.833 | 15.533 | 66.333 | 9.123 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 8.533 | 13.933 | 14.933 | 15.333 | 8.088 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 132 | 9.333 | 14.833 | 15.533 | 66.333 | 9.123 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 8.733 | 14.433 | 15.333 | 15.333 | 8.170 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 132 | 0.367 | 5.000 | 5.400 | 5.400 | 0.853 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.167 | 4.700 | 5.100 | 6.000 | 0.776 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 132 | 0.367 | 5.000 | 5.400 | 5.400 | 0.853 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 0.167 | 4.700 | 6.000 | 6.000 | 0.735 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 4.800 | 4.800 | 4.800 | 4.800 | 4.800 |  |
| queue.wait | ms | warm | 132 | 9.500 | 15.200 | 16.600 | 66.800 | 9.990 | 1 of 1 |
| queue.wait | ms | cold | 100 | 8.500 | 14.300 | 15.100 | 15.200 | 8.896 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 132 | 9.500 | 15.200 | 16.600 | 66.800 | 9.990 |  |
| queue.wait [pose-only] | ms | cold | 99 | 8.500 | 14.300 | 15.200 | 15.200 | 8.936 |  |
| queue.wait [static-install] | ms | cold | 1 | 4.900 | 4.900 | 4.900 | 4.900 | 4.900 |  |
| shard.compute | ms | warm | 528 | 0.500 | 2.000 | 3.500 | 6.000 | 0.750 | 1 of 1 |
| shard.compute | ms | cold | 400 | 0.600 | 1.500 | 9.600 | 82.000 | 1.323 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 528 | 0.500 | 2.000 | 3.500 | 6.000 | 0.750 |  |
| shard.compute [pose-only] | ms | cold | 396 | 0.600 | 1.400 | 38.200 | 82.000 | 1.243 |  |
| shard.compute [static-install] | ms | cold | 4 | 8.800 | 9.600 | 9.600 | 9.600 | 9.150 |  |
| shard.post | ms | warm | 528 | 0.000 | 0.100 | 0.100 | 0.200 | 0.015 | 1 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 1.400 | 0.021 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 528 | 0.000 | 0.100 | 0.100 | 0.200 | 0.015 |  |
| shard.post [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.200 | 1.400 | 0.021 |  |
| shard.post [static-install] | ms | cold | 4 | 0.000 | 0.200 | 0.200 | 0.200 | 0.050 |  |
| shard.reply-post | ms | warm | 528 | 0.000 | 0.100 | 0.200 | 0.400 | 0.039 | 1 of 1 |
| shard.reply-post | ms | cold | 400 | 0.000 | 0.100 | 0.300 | 2.200 | 0.043 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 528 | 0.000 | 0.100 | 0.200 | 0.400 | 0.039 |  |
| shard.reply-post [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.400 | 2.200 | 0.043 |  |
| shard.reply-post [static-install] | ms | cold | 4 | 0.000 | 0.100 | 0.100 | 0.100 | 0.025 |  |
| shard.roundtrip | ms | warm | 528 | 0.800 | 3.600 | 6.500 | 10.400 | 1.221 | 1 of 1 |
| shard.roundtrip | ms | cold | 400 | 0.900 | 2.600 | 26.000 | 118.900 | 2.464 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 528 | 0.800 | 3.600 | 6.500 | 10.400 | 1.221 |  |
| shard.roundtrip [pose-only] | ms | cold | 396 | 0.900 | 2.400 | 115.400 | 118.900 | 2.237 |  |
| shard.roundtrip [static-install] | ms | cold | 4 | 24.900 | 26.000 | 26.000 | 26.000 | 24.950 |  |
| shard.transport | ms | warm | 528 | 0.200 | 2.000 | 3.200 | 6.600 | 0.416 | 1 of 1 |
| shard.transport | ms | cold | 400 | 0.200 | 1.700 | 16.500 | 78.600 | 1.076 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 528 | 0.200 | 2.000 | 3.200 | 6.600 | 0.416 |  |
| shard.transport [pose-only] | ms | cold | 396 | 0.200 | 1.600 | 34.700 | 78.600 | 0.928 |  |
| shard.transport [static-install] | ms | cold | 4 | 15.300 | 16.500 | 16.500 | 16.500 | 15.775 |  |
| shard.worker-deserialize | ms | warm | 528 | 0.000 | 0.100 | 0.100 | 0.300 | 0.016 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 1.900 | 0.023 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 528 | 0.000 | 0.100 | 0.100 | 0.300 | 0.016 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.200 | 1.900 | 0.023 |  |
| shard.worker-deserialize [static-install] | ms | cold | 4 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |

## TS-W W02_H100_STATIC_5HZ_30S pass=clean boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 2
Denominators: submitted=3900 coalesced=3290 dispatched=610 completed=581 accepted=581 stale=29 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 410 | 0.000 | 0.100 | 0.200 | 0.200 | 0.048 | 2 of 2 |
| dispatch.prepare | ms | cold | 200 | 0.100 | 0.200 | 0.400 | 3.100 | 0.077 | 2 of 2 |
| dispatch.prepare [pose-only] | ms | warm | 211 | 0.000 | 0.100 | 0.200 | 0.200 | 0.045 |  |
| dispatch.prepare [pose-only] | ms | cold | 98 | 0.000 | 0.100 | 0.400 | 0.400 | 0.046 |  |
| dispatch.prepare [static-install] | ms | warm | 199 | 0.000 | 0.100 | 0.200 | 0.200 | 0.050 |  |
| dispatch.prepare [static-install] | ms | cold | 102 | 0.100 | 0.200 | 0.500 | 3.100 | 0.108 |  |
| display.derive | ms | warm | 481 | 0.300 | 1.500 | 2.400 | 3.400 | 0.457 | 2 of 2 |
| display.derive | ms | cold | 100 | 0.500 | 1.600 | 4.300 | 4.400 | 0.680 | 2 of 2 |
| display.derive [pose-only] | ms | warm | 231 | 0.400 | 1.600 | 2.400 | 3.200 | 0.516 |  |
| display.derive [pose-only] | ms | cold | 51 | 0.400 | 1.600 | 3.100 | 3.100 | 0.624 |  |
| display.derive [static-install] | ms | warm | 250 | 0.300 | 1.300 | 2.200 | 3.400 | 0.402 |  |
| display.derive [static-install] | ms | cold | 49 | 0.500 | 3.600 | 4.400 | 4.400 | 0.739 |  |
| input.lateness | ms | warm | 3247 | 0.467 | 20.667 | 145.800 | 274.367 | 5.759 | 0 of 2 |
| input.lateness | ms | cold | 653 | 0.500 | 138.033 | 263.300 | 316.633 | 15.411 | 0 of 2 |
| input.project | ms | warm | 3247 | 3.100 | 9.400 | 11.700 | 114.300 | 3.368 | 0 of 2 |
| input.project | ms | cold | 653 | 1.900 | 6.400 | 13.800 | 274.000 | 3.133 | 0 of 2 |
| install.ack-roundtrip | ms | warm | 796 | 9.900 | 16.800 | 21.400 | 38.600 | 10.410 | 2 of 2 |
| install.ack-roundtrip | ms | cold | 408 | 8.300 | 18.000 | 90.000 | 162.100 | 10.715 | 2 of 2 |
| install.ack-roundtrip [static-install] | ms | warm | 796 | 9.900 | 16.800 | 21.400 | 38.600 | 10.410 |  |
| install.ack-roundtrip [static-install] | ms | cold | 408 | 8.300 | 18.000 | 90.000 | 162.100 | 10.715 |  |
| install.post | ms | warm | 796 | 3.000 | 3.700 | 5.600 | 9.100 | 2.822 | 2 of 2 |
| install.post | ms | cold | 408 | 2.200 | 4.500 | 29.400 | 32.800 | 2.702 | 2 of 2 |
| install.post [static-install] | ms | warm | 796 | 3.000 | 3.700 | 5.600 | 9.100 | 2.822 |  |
| install.post [static-install] | ms | cold | 408 | 2.200 | 4.500 | 29.400 | 32.800 | 2.702 |  |
| install.worker-deserialize | ms | warm | 796 | 5.300 | 6.500 | 9.800 | 15.000 | 5.012 | 2 of 2 |
| install.worker-deserialize | ms | cold | 408 | 4.400 | 7.800 | 33.500 | 65.300 | 4.912 | 2 of 2 |
| install.worker-deserialize [static-install] | ms | warm | 796 | 5.300 | 6.500 | 9.800 | 15.000 | 5.012 |  |
| install.worker-deserialize [static-install] | ms | cold | 408 | 4.400 | 7.800 | 33.500 | 65.300 | 4.912 |  |
| job.phase-residual | ms | warm | 361 | 0.000 | 0.100 | 0.200 | 0.300 | 0.012 | 2 of 2 |
| job.phase-residual | ms | cold | 179 | 0.000 | 0.100 | 0.200 | 0.500 | 0.017 | 2 of 2 |
| job.phase-residual [pose-only] | ms | warm | 162 | 0.000 | 0.000 | 0.100 | 0.100 | -0.001 |  |
| job.phase-residual [pose-only] | ms | cold | 79 | 0.000 | 0.000 | 0.100 | 0.100 | -0.001 |  |
| job.phase-residual [static-install] | ms | warm | 199 | 0.000 | 0.100 | 0.200 | 0.300 | 0.022 |  |
| job.phase-residual [static-install] | ms | cold | 100 | 0.000 | 0.200 | 0.200 | 0.500 | 0.031 |  |
| job.submit-to-accepted | ms | warm | 481 | 20.800 | 38.000 | 63.100 | 262.000 | 23.169 | 2 of 2 |
| job.submit-to-accepted | ms | cold | 100 | 15.100 | 32.100 | 36.500 | 218.000 | 19.316 | 2 of 2 |
| job.submit-to-accepted [pose-only] | ms | warm | 231 | 12.200 | 21.500 | 31.800 | 63.100 | 13.713 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 51 | 11.700 | 18.700 | 27.800 | 27.800 | 12.418 |  |
| job.submit-to-accepted [static-install] | ms | warm | 250 | 32.100 | 40.000 | 81.100 | 262.000 | 31.906 |  |
| job.submit-to-accepted [static-install] | ms | cold | 49 | 21.400 | 34.100 | 218.000 | 218.000 | 26.496 |  |
| merge.assemble | ms | warm | 377 | 0.000 | 0.100 | 0.100 | 0.100 | 0.016 | 2 of 2 |
| merge.assemble | ms | cold | 188 | 0.000 | 0.100 | 0.200 | 0.200 | 0.013 | 2 of 2 |
| merge.assemble [pose-only] | ms | warm | 178 | 0.000 | 0.100 | 0.100 | 0.100 | 0.017 |  |
| merge.assemble [pose-only] | ms | cold | 86 | 0.000 | 0.100 | 0.100 | 0.100 | 0.010 |  |
| merge.assemble [static-install] | ms | warm | 199 | 0.000 | 0.100 | 0.100 | 0.100 | 0.014 |  |
| merge.assemble [static-install] | ms | cold | 102 | 0.000 | 0.100 | 0.200 | 0.200 | 0.015 |  |
| merge.reply-deserialize | ms | warm | 1640 | 0.000 | 0.100 | 0.100 | 0.200 | 0.021 | 0 of 2 |
| merge.reply-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.700 | 0.027 | 0 of 2 |
| merge.reply-deserialize [pose-only] | ms | warm | 844 | 0.000 | 0.100 | 0.100 | 0.200 | 0.016 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 392 | 0.000 | 0.100 | 0.200 | 0.400 | 0.023 |  |
| merge.reply-deserialize [static-install] | ms | warm | 796 | 0.000 | 0.100 | 0.100 | 0.200 | 0.027 |  |
| merge.reply-deserialize [static-install] | ms | cold | 408 | 0.000 | 0.100 | 0.200 | 0.700 | 0.030 |  |
| merge.validate | ms | warm | 1640 | 0.100 | 0.500 | 0.700 | 1.200 | 0.150 | 0 of 2 |
| merge.validate | ms | cold | 800 | 0.100 | 0.500 | 1.300 | 9.500 | 0.188 | 0 of 2 |
| merge.validate [pose-only] | ms | warm | 844 | 0.100 | 0.400 | 0.700 | 1.200 | 0.128 |  |
| merge.validate [pose-only] | ms | cold | 392 | 0.100 | 0.600 | 1.300 | 2.100 | 0.156 |  |
| merge.validate [static-install] | ms | warm | 796 | 0.100 | 0.500 | 0.700 | 0.900 | 0.172 |  |
| merge.validate [static-install] | ms | cold | 408 | 0.100 | 0.400 | 1.300 | 9.500 | 0.218 |  |
| pool.compute-metric | ms | warm | 481 | 9.400 | 22.700 | 37.800 | 214.700 | 11.177 | 2 of 2 |
| pool.compute-metric | ms | cold | 100 | 5.000 | 20.800 | 21.700 | 103.500 | 8.159 | 2 of 2 |
| pool.compute-metric [pose-only] | ms | warm | 231 | 2.200 | 6.100 | 11.200 | 12.600 | 2.620 |  |
| pool.compute-metric [pose-only] | ms | cold | 51 | 2.300 | 3.800 | 14.200 | 14.200 | 2.396 |  |
| pool.compute-metric [static-install] | ms | warm | 250 | 18.900 | 24.000 | 51.200 | 214.700 | 19.084 |  |
| pool.compute-metric [static-install] | ms | cold | 49 | 11.500 | 21.300 | 103.500 | 103.500 | 14.157 |  |
| pool.shard-max | ms | warm | 481 | 1.600 | 2.300 | 3.900 | 9.800 | 1.613 | 2 of 2 |
| pool.shard-max | ms | cold | 100 | 1.500 | 2.600 | 4.700 | 4.800 | 1.616 | 2 of 2 |
| pool.shard-max [pose-only] | ms | warm | 231 | 1.700 | 2.300 | 3.600 | 4.300 | 1.623 |  |
| pool.shard-max [pose-only] | ms | cold | 51 | 1.500 | 2.500 | 4.800 | 4.800 | 1.571 |  |
| pool.shard-max [static-install] | ms | warm | 250 | 1.600 | 2.300 | 3.900 | 9.800 | 1.604 |  |
| pool.shard-max [static-install] | ms | cold | 49 | 1.600 | 3.200 | 4.700 | 4.700 | 1.663 |  |
| pool.shard-total | ms | warm | 481 | 5.000 | 7.600 | 13.600 | 31.700 | 5.123 | 2 of 2 |
| pool.shard-total | ms | cold | 100 | 4.700 | 8.000 | 16.200 | 17.400 | 4.859 | 2 of 2 |
| pool.shard-total [pose-only] | ms | warm | 231 | 5.400 | 8.000 | 12.900 | 14.400 | 5.336 |  |
| pool.shard-total [pose-only] | ms | cold | 51 | 4.700 | 8.000 | 16.200 | 16.200 | 4.822 |  |
| pool.shard-total [static-install] | ms | warm | 250 | 4.700 | 7.100 | 14.800 | 31.700 | 4.926 |  |
| pool.shard-total [static-install] | ms | cold | 49 | 4.900 | 8.300 | 17.400 | 17.400 | 4.898 |  |
| pose.age-at-accept | ms | warm | 481 | 16.600 | 32.800 | 53.200 | 232.000 | 14.898 | 2 of 2 |
| pose.age-at-accept | ms | cold | 100 | 0.000 | 24.700 | 29.200 | 208.900 | 11.128 | 2 of 2 |
| pose.age-at-accept [pose-only] | ms | warm | 231 | 0.000 | 17.100 | 17.800 | 20.900 | 3.221 |  |
| pose.age-at-accept [pose-only] | ms | cold | 51 | 0.000 | 16.500 | 18.400 | 18.400 | 2.733 |  |
| pose.age-at-accept [static-install] | ms | warm | 250 | 25.400 | 37.100 | 71.800 | 232.000 | 25.688 |  |
| pose.age-at-accept [static-install] | ms | cold | 49 | 17.200 | 28.600 | 208.900 | 208.900 | 19.865 |  |
| pose.latest-wait | ms | warm | 3247 | 65.100 | 122.900 | 193.300 | 349.400 | 67.952 | 0 of 2 |
| pose.latest-wait | ms | cold | 653 | 58.500 | 103.000 | 130.600 | 453.000 | 58.838 | 0 of 2 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 3247 | 65.100 | 122.900 | 193.300 | 349.400 | 67.952 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 653 | 58.500 | 103.000 | 130.600 | 453.000 | 58.838 |  |
| queue.rate-limit | ms | warm | 410 | 3.733 | 13.233 | 15.533 | 44.633 | 4.635 | 2 of 2 |
| queue.rate-limit | ms | cold | 200 | 3.133 | 13.533 | 15.633 | 16.333 | 4.435 | 2 of 2 |
| queue.rate-limit [pose-only] | ms | warm | 211 | 6.433 | 14.233 | 16.333 | 44.633 | 6.738 |  |
| queue.rate-limit [pose-only] | ms | cold | 98 | 5.533 | 13.933 | 16.333 | 16.333 | 5.995 |  |
| queue.rate-limit [static-install] | ms | warm | 199 | 0.000 | 11.333 | 13.433 | 14.633 | 2.404 |  |
| queue.rate-limit [static-install] | ms | cold | 102 | 0.000 | 12.533 | 14.033 | 14.233 | 2.935 |  |
| queue.timer-lateness | ms | warm | 410 | 1.567 | 5.400 | 6.000 | 12.667 | 2.307 | 2 of 2 |
| queue.timer-lateness | ms | cold | 200 | 1.467 | 5.400 | 6.400 | 7.600 | 2.354 | 2 of 2 |
| queue.timer-lateness [pose-only] | ms | warm | 211 | 0.467 | 4.867 | 5.367 | 12.667 | 1.286 |  |
| queue.timer-lateness [pose-only] | ms | cold | 98 | 0.667 | 5.167 | 7.600 | 7.600 | 1.567 |  |
| queue.timer-lateness [static-install] | ms | warm | 199 | 4.200 | 5.500 | 6.000 | 6.500 | 3.390 |  |
| queue.timer-lateness [static-install] | ms | cold | 102 | 4.200 | 5.500 | 5.900 | 6.400 | 3.111 |  |
| queue.wait | ms | warm | 410 | 5.300 | 13.700 | 15.200 | 57.300 | 6.954 | 2 of 2 |
| queue.wait | ms | cold | 200 | 5.400 | 14.000 | 15.000 | 17.800 | 6.808 | 2 of 2 |
| queue.wait [pose-only] | ms | warm | 211 | 6.500 | 14.200 | 16.700 | 57.300 | 8.033 |  |
| queue.wait [pose-only] | ms | cold | 98 | 6.100 | 14.200 | 17.800 | 17.800 | 7.580 |  |
| queue.wait [static-install] | ms | warm | 199 | 5.000 | 11.600 | 14.800 | 14.800 | 5.810 |  |
| queue.wait [static-install] | ms | cold | 102 | 5.100 | 12.900 | 14.500 | 14.900 | 6.068 |  |
| shard.compute | ms | warm | 1640 | 1.300 | 2.000 | 2.900 | 4.300 | 1.248 | 0 of 2 |
| shard.compute | ms | cold | 800 | 1.200 | 2.600 | 9.700 | 15.900 | 1.434 | 0 of 2 |
| shard.compute [pose-only] | ms | warm | 844 | 1.400 | 2.000 | 3.200 | 4.300 | 1.309 |  |
| shard.compute [pose-only] | ms | cold | 392 | 1.300 | 2.400 | 12.600 | 15.900 | 1.409 |  |
| shard.compute [static-install] | ms | warm | 796 | 1.200 | 1.900 | 2.400 | 3.700 | 1.184 |  |
| shard.compute [static-install] | ms | cold | 408 | 1.100 | 3.800 | 9.700 | 12.200 | 1.458 |  |
| shard.post | ms | warm | 1640 | 0.000 | 0.100 | 0.100 | 0.200 | 0.021 | 0 of 2 |
| shard.post | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.500 | 0.023 | 0 of 2 |
| shard.post [pose-only] | ms | warm | 844 | 0.000 | 0.100 | 0.200 | 0.200 | 0.025 |  |
| shard.post [pose-only] | ms | cold | 392 | 0.000 | 0.100 | 0.200 | 0.500 | 0.032 |  |
| shard.post [static-install] | ms | warm | 796 | 0.000 | 0.100 | 0.100 | 0.200 | 0.017 |  |
| shard.post [static-install] | ms | cold | 408 | 0.000 | 0.100 | 0.100 | 0.400 | 0.013 |  |
| shard.reply-post | ms | warm | 1640 | 0.000 | 0.100 | 0.200 | 2.800 | 0.046 | 0 of 2 |
| shard.reply-post | ms | cold | 800 | 0.000 | 0.100 | 0.300 | 1.700 | 0.049 | 0 of 2 |
| shard.reply-post [pose-only] | ms | warm | 844 | 0.000 | 0.100 | 0.200 | 2.800 | 0.051 |  |
| shard.reply-post [pose-only] | ms | cold | 392 | 0.000 | 0.100 | 0.400 | 1.700 | 0.056 |  |
| shard.reply-post [static-install] | ms | warm | 796 | 0.000 | 0.100 | 0.300 | 1.900 | 0.040 |  |
| shard.reply-post [static-install] | ms | cold | 408 | 0.000 | 0.200 | 0.300 | 1.300 | 0.042 |  |
| shard.roundtrip | ms | warm | 1640 | 4.400 | 12.100 | 14.700 | 31.300 | 5.329 | 0 of 2 |
| shard.roundtrip | ms | cold | 800 | 3.600 | 13.000 | 67.800 | 131.600 | 6.325 | 0 of 2 |
| shard.roundtrip [pose-only] | ms | warm | 844 | 1.800 | 8.800 | 11.400 | 12.300 | 2.550 |  |
| shard.roundtrip [pose-only] | ms | cold | 392 | 1.800 | 10.300 | 116.900 | 124.000 | 3.664 |  |
| shard.roundtrip [static-install] | ms | warm | 796 | 7.800 | 13.400 | 16.400 | 31.300 | 8.275 |  |
| shard.roundtrip [static-install] | ms | cold | 408 | 6.900 | 18.700 | 67.800 | 131.600 | 8.882 |  |
| shard.transport | ms | warm | 1640 | 3.500 | 10.900 | 13.700 | 28.200 | 4.016 | 0 of 2 |
| shard.transport | ms | cold | 800 | 2.500 | 11.600 | 55.500 | 123.200 | 4.818 | 0 of 2 |
| shard.transport [pose-only] | ms | warm | 844 | 0.300 | 7.300 | 10.000 | 10.500 | 1.166 |  |
| shard.transport [pose-only] | ms | cold | 392 | 0.300 | 7.900 | 102.400 | 107.200 | 2.168 |  |
| shard.transport [static-install] | ms | warm | 796 | 6.400 | 12.000 | 15.400 | 28.200 | 7.037 |  |
| shard.transport [static-install] | ms | cold | 408 | 5.600 | 14.400 | 55.500 | 123.200 | 7.363 |  |
| shard.worker-deserialize | ms | warm | 1640 | 0.000 | 0.100 | 0.100 | 0.200 | 0.020 | 0 of 2 |
| shard.worker-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.500 | 0.025 | 0 of 2 |
| shard.worker-deserialize [pose-only] | ms | warm | 844 | 0.000 | 0.100 | 0.100 | 0.200 | 0.025 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 392 | 0.000 | 0.100 | 0.200 | 0.500 | 0.031 |  |
| shard.worker-deserialize [static-install] | ms | warm | 796 | 0.000 | 0.100 | 0.100 | 0.200 | 0.014 |  |
| shard.worker-deserialize [static-install] | ms | cold | 408 | 0.000 | 0.100 | 0.100 | 0.500 | 0.019 |  |

## TS-W W02_H100_STATIC_5HZ_30S pass=traced boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1301 coalesced=1088 dispatched=213 completed=204 accepted=204 stale=9 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| dispatch.prepare | ms | warm | 113 | 0.000 | 0.200 | 0.300 | 6.600 | 0.106 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.000 | 0.100 | 0.200 | 0.800 | 0.053 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 58 | 0.000 | 0.200 | 0.300 | 0.300 | 0.045 |  |
| dispatch.prepare [pose-only] | ms | cold | 54 | 0.000 | 0.100 | 0.200 | 0.200 | 0.044 |  |
| dispatch.prepare [static-install] | ms | warm | 55 | 0.000 | 0.200 | 6.600 | 6.600 | 0.171 |  |
| dispatch.prepare [static-install] | ms | cold | 46 | 0.000 | 0.100 | 0.800 | 0.800 | 0.063 |  |
| display.derive | ms | warm | 153 | 0.400 | 1.700 | 2.600 | 5.200 | 0.525 | 1 of 1 |
| display.derive | ms | cold | 51 | 0.600 | 2.800 | 7.300 | 7.300 | 0.851 | 1 of 1 |
| display.derive [pose-only] | ms | warm | 78 | 0.400 | 1.900 | 2.600 | 2.600 | 0.514 |  |
| display.derive [pose-only] | ms | cold | 26 | 0.500 | 1.800 | 2.700 | 2.700 | 0.700 |  |
| display.derive [static-install] | ms | warm | 75 | 0.400 | 1.700 | 5.200 | 5.200 | 0.536 |  |
| display.derive [static-install] | ms | cold | 25 | 0.600 | 2.900 | 7.300 | 7.300 | 1.008 |  |
| input.lateness | ms | warm | 976 | 0.400 | 152.000 | 223.067 | 260.433 | 15.901 | 0 of 1 |
| input.lateness | ms | cold | 325 | 0.267 | 4.033 | 9.767 | 19.533 | 0.667 | 0 of 1 |
| input.project | ms | warm | 976 | 1.400 | 6.600 | 16.900 | 154.200 | 2.695 | 0 of 1 |
| input.project | ms | cold | 325 | 1.700 | 5.000 | 7.700 | 16.600 | 2.153 | 0 of 1 |
| install.ack-roundtrip | ms | warm | 220 | 4.600 | 22.200 | 46.900 | 116.200 | 7.719 | 1 of 1 |
| install.ack-roundtrip | ms | cold | 184 | 4.500 | 9.500 | 17.700 | 19.400 | 5.139 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | warm | 220 | 4.600 | 22.200 | 46.900 | 116.200 | 7.719 |  |
| install.ack-roundtrip [static-install] | ms | cold | 184 | 4.500 | 9.500 | 17.700 | 19.400 | 5.139 |  |
| install.post | ms | warm | 220 | 1.300 | 6.100 | 11.100 | 59.300 | 2.205 | 1 of 1 |
| install.post | ms | cold | 184 | 1.300 | 2.200 | 2.800 | 3.000 | 1.369 | 1 of 1 |
| install.post [static-install] | ms | warm | 220 | 1.300 | 6.100 | 11.100 | 59.300 | 2.205 |  |
| install.post [static-install] | ms | cold | 184 | 1.300 | 2.200 | 2.800 | 3.000 | 1.369 |  |
| install.worker-deserialize | ms | warm | 220 | 2.600 | 11.200 | 17.600 | 31.500 | 3.833 | 1 of 1 |
| install.worker-deserialize | ms | cold | 184 | 2.300 | 4.500 | 5.500 | 6.200 | 2.617 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | warm | 220 | 2.600 | 11.200 | 17.600 | 31.500 | 3.833 |  |
| install.worker-deserialize [static-install] | ms | cold | 184 | 2.300 | 4.500 | 5.500 | 6.200 | 2.617 |  |
| job.phase-residual | ms | warm | 95 | 0.000 | 0.200 | 2.400 | 2.400 | 0.099 | 1 of 1 |
| job.phase-residual | ms | cold | 89 | 0.000 | 0.200 | 0.500 | 0.500 | 0.035 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 40 | 0.000 | 0.100 | 2.400 | 2.400 | 0.075 |  |
| job.phase-residual [pose-only] | ms | cold | 45 | 0.000 | 0.100 | 0.200 | 0.200 | 0.009 |  |
| job.phase-residual [static-install] | ms | warm | 55 | 0.000 | 0.300 | 2.400 | 2.400 | 0.116 |  |
| job.phase-residual [static-install] | ms | cold | 44 | 0.000 | 0.200 | 0.500 | 0.500 | 0.061 |  |
| job.submit-to-accepted | ms | warm | 153 | 15.900 | 57.300 | 235.800 | 253.300 | 22.119 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 51 | 14.900 | 26.600 | 31.100 | 31.100 | 15.600 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 78 | 14.000 | 25.000 | 253.300 | 253.300 | 19.469 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 26 | 9.600 | 18.300 | 18.900 | 18.900 | 10.873 |  |
| job.submit-to-accepted [static-install] | ms | warm | 75 | 18.500 | 58.700 | 235.800 | 235.800 | 24.875 |  |
| job.submit-to-accepted [static-install] | ms | cold | 25 | 20.300 | 28.300 | 31.100 | 31.100 | 20.516 |  |
| merge.assemble | ms | warm | 100 | 0.000 | 0.100 | 0.100 | 0.300 | 0.018 | 1 of 1 |
| merge.assemble | ms | cold | 91 | 0.000 | 0.100 | 0.100 | 0.100 | 0.011 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 45 | 0.000 | 0.100 | 0.300 | 0.300 | 0.022 |  |
| merge.assemble [pose-only] | ms | cold | 46 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| merge.assemble [static-install] | ms | warm | 55 | 0.000 | 0.100 | 0.100 | 0.100 | 0.015 |  |
| merge.assemble [static-install] | ms | cold | 45 | 0.000 | 0.100 | 0.100 | 0.100 | 0.013 |  |
| merge.reply-deserialize | ms | warm | 452 | 0.000 | 0.100 | 0.300 | 0.600 | 0.026 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.019 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 232 | 0.000 | 0.100 | 0.300 | 0.600 | 0.029 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 216 | 0.000 | 0.100 | 0.100 | 0.200 | 0.023 |  |
| merge.reply-deserialize [static-install] | ms | warm | 220 | 0.000 | 0.100 | 0.100 | 0.200 | 0.023 |  |
| merge.reply-deserialize [static-install] | ms | cold | 184 | 0.000 | 0.100 | 0.100 | 0.100 | 0.016 |  |
| merge.validate | ms | warm | 452 | 0.100 | 0.700 | 1.800 | 3.400 | 0.195 | 1 of 1 |
| merge.validate | ms | cold | 400 | 0.100 | 0.400 | 0.800 | 3.000 | 0.137 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 232 | 0.100 | 0.800 | 2.900 | 3.400 | 0.232 |  |
| merge.validate [pose-only] | ms | cold | 216 | 0.100 | 0.400 | 0.800 | 3.000 | 0.142 |  |
| merge.validate [static-install] | ms | warm | 220 | 0.100 | 0.500 | 1.000 | 1.000 | 0.155 |  |
| merge.validate [static-install] | ms | cold | 184 | 0.100 | 0.300 | 0.900 | 1.100 | 0.130 |  |
| pool.compute-metric | ms | warm | 153 | 5.700 | 30.400 | 123.000 | 138.100 | 8.591 | 1 of 1 |
| pool.compute-metric | ms | cold | 51 | 5.400 | 15.200 | 23.600 | 23.600 | 6.580 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 78 | 1.500 | 9.500 | 123.000 | 123.000 | 3.892 |  |
| pool.compute-metric [pose-only] | ms | cold | 26 | 1.700 | 4.800 | 5.400 | 5.400 | 2.327 |  |
| pool.compute-metric [static-install] | ms | warm | 75 | 9.200 | 40.700 | 138.100 | 138.100 | 13.477 |  |
| pool.compute-metric [static-install] | ms | cold | 25 | 10.900 | 16.700 | 23.600 | 23.600 | 11.004 |  |
| pool.shard-max | ms | warm | 153 | 1.000 | 3.700 | 13.900 | 45.900 | 1.599 | 1 of 1 |
| pool.shard-max | ms | cold | 51 | 1.400 | 4.100 | 5.000 | 5.000 | 1.729 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 78 | 0.900 | 4.100 | 45.900 | 45.900 | 1.799 |  |
| pool.shard-max [pose-only] | ms | cold | 26 | 1.300 | 3.100 | 3.800 | 3.800 | 1.500 |  |
| pool.shard-max [static-install] | ms | warm | 75 | 1.100 | 3.600 | 5.800 | 5.800 | 1.391 |  |
| pool.shard-max [static-install] | ms | cold | 25 | 1.500 | 4.300 | 5.000 | 5.000 | 1.968 |  |
| pool.shard-total | ms | warm | 153 | 2.700 | 12.800 | 44.100 | 129.000 | 4.718 | 1 of 1 |
| pool.shard-total | ms | cold | 51 | 3.800 | 9.600 | 17.800 | 17.800 | 4.851 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 78 | 2.500 | 13.400 | 129.000 | 129.000 | 5.323 |  |
| pool.shard-total [pose-only] | ms | cold | 26 | 3.400 | 8.700 | 9.300 | 9.300 | 4.173 |  |
| pool.shard-total [static-install] | ms | warm | 75 | 2.800 | 12.800 | 21.000 | 21.000 | 4.089 |  |
| pool.shard-total [static-install] | ms | cold | 25 | 4.301 | 12.400 | 17.800 | 17.800 | 5.556 |  |
| pose.age-at-accept | ms | warm | 153 | 0.000 | 38.100 | 189.000 | 225.700 | 12.572 | 1 of 1 |
| pose.age-at-accept | ms | cold | 51 | 0.000 | 20.900 | 27.600 | 27.600 | 8.524 | 1 of 1 |
| pose.age-at-accept [pose-only] | ms | warm | 78 | 0.000 | 17.600 | 189.000 | 189.000 | 8.121 |  |
| pose.age-at-accept [pose-only] | ms | cold | 26 | 0.000 | 16.300 | 16.700 | 16.700 | 1.269 |  |
| pose.age-at-accept [static-install] | ms | warm | 75 | 16.200 | 53.300 | 225.700 | 225.700 | 17.201 |  |
| pose.age-at-accept [static-install] | ms | cold | 25 | 16.400 | 21.800 | 27.600 | 27.600 | 16.068 |  |
| pose.latest-wait | ms | warm | 976 | 57.500 | 122.900 | 286.100 | 382.500 | 63.135 | 0 of 1 |
| pose.latest-wait | ms | cold | 325 | 57.300 | 105.700 | 153.700 | 170.200 | 58.399 | 0 of 1 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 976 | 57.500 | 122.900 | 286.100 | 382.500 | 63.135 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 325 | 57.300 | 105.700 | 153.700 | 170.200 | 58.399 |  |
| queue.rate-limit | ms | warm | 113 | 6.133 | 14.433 | 16.933 | 81.833 | 7.252 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 5.833 | 14.233 | 14.633 | 15.533 | 6.171 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 58 | 6.733 | 15.433 | 81.833 | 81.833 | 8.716 |  |
| queue.rate-limit [pose-only] | ms | cold | 54 | 5.833 | 14.533 | 15.533 | 15.533 | 6.514 |  |
| queue.rate-limit [static-install] | ms | warm | 55 | 5.133 | 14.133 | 14.433 | 14.433 | 5.708 |  |
| queue.rate-limit [static-install] | ms | cold | 46 | 5.833 | 11.933 | 13.633 | 13.633 | 5.768 |  |
| queue.timer-lateness | ms | warm | 113 | 0.467 | 5.267 | 7.600 | 26.700 | 1.778 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.567 | 4.800 | 5.000 | 5.300 | 1.313 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 58 | 0.467 | 5.200 | 26.700 | 26.700 | 1.664 |  |
| queue.timer-lateness [pose-only] | ms | cold | 54 | 0.467 | 5.000 | 5.300 | 5.300 | 1.336 |  |
| queue.timer-lateness [static-install] | ms | warm | 55 | 0.467 | 5.500 | 7.600 | 7.600 | 1.898 |  |
| queue.timer-lateness [static-install] | ms | cold | 46 | 0.667 | 4.700 | 4.867 | 4.867 | 1.286 |  |
| queue.wait | ms | warm | 113 | 6.300 | 15.300 | 30.100 | 86.200 | 9.107 | 1 of 1 |
| queue.wait | ms | cold | 100 | 6.100 | 14.300 | 15.100 | 16.000 | 7.503 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 58 | 6.800 | 16.300 | 86.200 | 86.200 | 10.512 |  |
| queue.wait [pose-only] | ms | cold | 54 | 6.100 | 14.600 | 16.000 | 16.000 | 7.859 |  |
| queue.wait [static-install] | ms | warm | 55 | 6.200 | 14.100 | 14.900 | 14.900 | 7.625 |  |
| queue.wait [static-install] | ms | cold | 46 | 6.100 | 12.000 | 14.100 | 14.100 | 7.085 |  |
| shard.compute | ms | warm | 452 | 0.700 | 3.900 | 13.900 | 45.900 | 1.395 | 1 of 1 |
| shard.compute | ms | cold | 400 | 0.700 | 2.500 | 5.000 | 9.400 | 1.009 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 232 | 0.700 | 3.700 | 34.300 | 45.900 | 1.634 |  |
| shard.compute [pose-only] | ms | cold | 216 | 0.700 | 1.900 | 2.800 | 3.800 | 0.810 |  |
| shard.compute [static-install] | ms | warm | 220 | 0.700 | 3.900 | 5.500 | 5.800 | 1.143 |  |
| shard.compute [static-install] | ms | cold | 184 | 0.900 | 3.800 | 8.600 | 9.400 | 1.244 |  |
| shard.post | ms | warm | 452 | 0.000 | 0.100 | 0.300 | 2.400 | 0.027 | 1 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.013 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 232 | 0.000 | 0.100 | 0.300 | 0.800 | 0.026 |  |
| shard.post [pose-only] | ms | cold | 216 | 0.000 | 0.100 | 0.100 | 0.200 | 0.016 |  |
| shard.post [static-install] | ms | warm | 220 | 0.000 | 0.100 | 0.100 | 2.400 | 0.027 |  |
| shard.post [static-install] | ms | cold | 184 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| shard.reply-post | ms | warm | 452 | 0.000 | 0.200 | 0.400 | 1.800 | 0.056 | 1 of 1 |
| shard.reply-post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.036 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 232 | 0.000 | 0.200 | 0.700 | 1.800 | 0.065 |  |
| shard.reply-post [pose-only] | ms | cold | 216 | 0.000 | 0.100 | 0.200 | 0.300 | 0.035 |  |
| shard.reply-post [static-install] | ms | warm | 220 | 0.000 | 0.200 | 0.200 | 0.400 | 0.046 |  |
| shard.reply-post [static-install] | ms | cold | 184 | 0.000 | 0.100 | 0.200 | 0.200 | 0.037 |  |
| shard.roundtrip | ms | warm | 452 | 2.700 | 20.000 | 55.300 | 119.900 | 5.357 | 1 of 1 |
| shard.roundtrip | ms | cold | 400 | 2.400 | 6.700 | 12.800 | 30.100 | 3.013 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 232 | 1.100 | 17.200 | 111.900 | 119.900 | 4.437 |  |
| shard.roundtrip [pose-only] | ms | cold | 216 | 1.000 | 4.200 | 5.100 | 5.200 | 1.425 |  |
| shard.roundtrip [static-install] | ms | warm | 220 | 3.800 | 20.000 | 33.300 | 55.300 | 6.327 |  |
| shard.roundtrip [static-install] | ms | cold | 184 | 4.000 | 9.400 | 27.000 | 30.100 | 4.877 |  |
| shard.transport | ms | warm | 452 | 1.900 | 15.300 | 49.100 | 91.000 | 3.888 | 1 of 1 |
| shard.transport | ms | cold | 400 | 1.700 | 5.000 | 8.200 | 20.700 | 1.954 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 232 | 0.300 | 8.100 | 76.800 | 91.000 | 2.710 |  |
| shard.transport [pose-only] | ms | cold | 216 | 0.200 | 2.600 | 4.200 | 4.700 | 0.569 |  |
| shard.transport [static-install] | ms | warm | 220 | 3.000 | 15.900 | 27.300 | 49.100 | 5.130 |  |
| shard.transport [static-install] | ms | cold | 184 | 3.000 | 6.300 | 18.400 | 20.700 | 3.580 |  |
| shard.worker-deserialize | ms | warm | 452 | 0.000 | 0.100 | 0.200 | 0.800 | 0.018 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.014 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 232 | 0.000 | 0.100 | 0.500 | 0.800 | 0.028 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 216 | 0.000 | 0.100 | 0.100 | 0.100 | 0.013 |  |
| shard.worker-deserialize [static-install] | ms | warm | 220 | 0.000 | 0.100 | 0.100 | 0.500 | 0.009 |  |
| shard.worker-deserialize [static-install] | ms | cold | 184 | 0.000 | 0.100 | 0.100 | 0.200 | 0.015 |  |

## TS-W W03_C100_POSE_60HZ_60S pass=alloc boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1201 coalesced=968 dispatched=233 completed=233 accepted=233 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.decide | ms | warm | 175 | 0.300 | 0.700 | 2.200 | 4.700 | 0.337 | 1 of 1 |
| accept.decide | ms | cold | 58 | 0.300 | 0.700 | 0.800 | 0.800 | 0.317 | 1 of 1 |
| accept.decide [pose-only] | ms | warm | 175 | 0.300 | 0.700 | 2.200 | 4.700 | 0.337 |  |
| accept.decide [pose-only] | ms | cold | 57 | 0.300 | 0.700 | 0.800 | 0.800 | 0.318 |  |
| accept.decide [static-install] | ms | cold | 1 | 0.300 | 0.300 | 0.300 | 0.300 | 0.300 |  |
| dispatch.prepare | ms | warm | 133 | 0.200 | 0.400 | 0.500 | 3.200 | 0.206 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.200 | 0.400 | 0.600 | 2.600 | 0.214 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 133 | 0.200 | 0.400 | 0.500 | 3.200 | 0.206 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.200 | 0.400 | 0.600 | 0.600 | 0.190 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 2.600 | 2.600 | 2.600 | 2.600 | 2.600 |  |
| input.lateness | ms | warm | 900 | 0.167 | 1.300 | 1.633 | 16.233 | 0.292 | 0 of 1 |
| input.lateness | ms | cold | 301 | 0.167 | 1.267 | 1.600 | 14.300 | 0.310 | 0 of 1 |
| install.ack-roundtrip | ms | cold | 4 | 11.700 | 15.800 | 15.800 | 15.800 | 12.525 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 4 | 11.700 | 15.800 | 15.800 | 15.800 | 12.525 |  |
| install.post | ms | cold | 4 | 0.100 | 0.100 | 0.100 | 0.100 | 0.075 | 1 of 1 |
| install.post [static-install] | ms | cold | 4 | 0.100 | 0.100 | 0.100 | 0.100 | 0.075 |  |
| install.worker-deserialize | ms | cold | 4 | 0.100 | 0.200 | 0.200 | 0.200 | 0.100 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 4 | 0.100 | 0.200 | 0.200 | 0.200 | 0.100 |  |
| job.phase-residual | ms | warm | 127 | 0.000 | 0.000 | 0.100 | 0.100 | -0.001 | 1 of 1 |
| job.phase-residual | ms | cold | 99 | 0.000 | 0.100 | 0.100 | 0.100 | 0.002 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 127 | 0.000 | 0.000 | 0.100 | 0.100 | -0.001 |  |
| job.phase-residual [pose-only] | ms | cold | 98 | 0.000 | 0.100 | 0.100 | 0.100 | 0.003 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.100 | -0.100 | -0.100 | -0.100 | -0.100 |  |
| job.submit-to-accepted | ms | warm | 175 | 23.000 | 31.200 | 63.800 | 81.600 | 23.590 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 58 | 24.500 | 31.400 | 33.500 | 33.500 | 24.603 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 175 | 23.000 | 31.200 | 63.800 | 81.600 | 23.590 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 57 | 24.500 | 31.400 | 33.500 | 33.500 | 24.525 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 29.100 | 29.100 | 29.100 | 29.100 | 29.100 |  |
| merge.assemble | ms | warm | 127 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 | 1 of 1 |
| merge.assemble | ms | cold | 99 | 0.000 | 0.100 | 0.200 | 0.200 | 0.009 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 127 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| merge.assemble [pose-only] | ms | cold | 98 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.200 | 0.200 | 0.200 | 0.200 | 0.200 |  |
| merge.reply-deserialize | ms | warm | 532 | 0.000 | 0.100 | 0.100 | 0.400 | 0.016 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.100 | 0.014 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 532 | 0.000 | 0.100 | 0.100 | 0.400 | 0.016 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.100 | 0.100 | 0.013 |  |
| merge.reply-deserialize [static-install] | ms | cold | 4 | 0.100 | 0.100 | 0.100 | 0.100 | 0.075 |  |
| merge.validate | ms | warm | 532 | 0.200 | 0.800 | 2.200 | 9.100 | 0.333 | 1 of 1 |
| merge.validate | ms | cold | 400 | 0.300 | 0.800 | 1.300 | 2.800 | 0.332 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 532 | 0.200 | 0.800 | 2.200 | 9.100 | 0.333 |  |
| merge.validate [pose-only] | ms | cold | 396 | 0.300 | 0.800 | 1.100 | 1.500 | 0.316 |  |
| merge.validate [static-install] | ms | cold | 4 | 1.500 | 2.800 | 2.800 | 2.800 | 1.875 |  |
| pool.compute-metric | ms | warm | 175 | 2.200 | 4.000 | 14.500 | 35.900 | 2.658 | 1 of 1 |
| pool.compute-metric | ms | cold | 58 | 2.200 | 4.900 | 27.500 | 27.500 | 2.909 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 175 | 2.200 | 4.000 | 14.500 | 35.900 | 2.658 |  |
| pool.compute-metric [pose-only] | ms | cold | 57 | 2.200 | 4.700 | 4.900 | 4.900 | 2.477 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 27.500 | 27.500 | 27.500 | 27.500 | 27.500 |  |
| pool.shard-max | ms | warm | 175 | 1.000 | 1.500 | 13.700 | 16.000 | 1.197 | 1 of 1 |
| pool.shard-max | ms | cold | 58 | 1.200 | 1.900 | 8.700 | 8.700 | 1.264 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 175 | 1.000 | 1.500 | 13.700 | 16.000 | 1.197 |  |
| pool.shard-max [pose-only] | ms | cold | 57 | 1.200 | 1.800 | 2.000 | 2.000 | 1.133 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 8.700 | 8.700 | 8.700 | 8.700 | 8.700 |  |
| pool.shard-total | ms | warm | 175 | 2.900 | 5.100 | 16.400 | 31.800 | 3.238 | 1 of 1 |
| pool.shard-total | ms | cold | 58 | 3.300 | 5.900 | 29.000 | 29.000 | 3.803 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 175 | 2.900 | 5.100 | 16.400 | 31.800 | 3.238 |  |
| pool.shard-total [pose-only] | ms | cold | 57 | 3.300 | 5.600 | 6.000 | 6.000 | 3.361 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 29.000 | 29.000 | 29.000 | 29.000 | 29.000 |  |
| pose.age-at-accept | ms | warm | 175 | 16.500 | 18.000 | 33.800 | 34.700 | 14.493 | 1 of 1 |
| pose.age-at-accept | ms | cold | 58 | 16.500 | 18.800 | 19.100 | 19.100 | 16.569 | 1 of 1 |
| pose.age-at-accept [pose-only] | ms | warm | 175 | 16.500 | 18.000 | 33.800 | 34.700 | 14.493 |  |
| pose.age-at-accept [pose-only] | ms | cold | 57 | 16.500 | 18.100 | 19.100 | 19.100 | 16.530 |  |
| pose.age-at-accept [static-install] | ms | cold | 1 | 18.800 | 18.800 | 18.800 | 18.800 | 18.800 |  |
| pose.latest-wait | ms | warm | 900 | 57.900 | 97.400 | 103.400 | 132.700 | 58.211 | 0 of 1 |
| pose.latest-wait | ms | cold | 301 | 59.200 | 97.800 | 102.600 | 113.800 | 59.508 | 0 of 1 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 900 | 57.900 | 97.400 | 103.400 | 132.700 | 58.211 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 301 | 59.200 | 97.800 | 102.600 | 113.800 | 59.508 |  |
| queue.client | ms | warm | 899 | 12.300 | 13.600 | 14.200 | 14.800 | 12.092 | 0 of 1 |
| queue.client | ms | cold | 301 | 12.800 | 13.900 | 14.300 | 15.500 | 12.709 | 0 of 1 |
| queue.rate-limit | ms | warm | 133 | 7.433 | 15.333 | 17.433 | 70.933 | 8.257 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 8.033 | 15.733 | 16.033 | 16.933 | 8.210 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 133 | 7.433 | 15.333 | 17.433 | 70.933 | 8.257 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 8.033 | 15.733 | 16.933 | 16.933 | 8.293 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 133 | 0.367 | 1.367 | 2.067 | 3.867 | 0.395 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.367 | 1.567 | 1.767 | 1.767 | 0.448 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 133 | 0.367 | 1.367 | 2.067 | 3.867 | 0.395 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 0.467 | 1.567 | 1.767 | 1.767 | 0.452 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 0.100 | 0.100 | 0.100 | 0.100 | 0.100 |  |
| queue.wait | ms | warm | 133 | 20.500 | 27.700 | 29.800 | 79.900 | 20.478 | 1 of 1 |
| queue.wait | ms | cold | 100 | 21.500 | 28.800 | 29.100 | 29.400 | 21.140 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 133 | 20.500 | 27.700 | 29.800 | 79.900 | 20.478 |  |
| queue.wait [pose-only] | ms | cold | 99 | 21.600 | 28.800 | 29.400 | 29.400 | 21.346 |  |
| queue.wait [static-install] | ms | cold | 1 | 0.700 | 0.700 | 0.700 | 0.700 | 0.700 |  |
| shard.compute | ms | warm | 532 | 0.700 | 1.400 | 2.900 | 16.000 | 0.820 | 1 of 1 |
| shard.compute | ms | cold | 400 | 0.800 | 1.500 | 2.000 | 8.700 | 0.877 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 532 | 0.700 | 1.400 | 2.900 | 16.000 | 0.820 |  |
| shard.compute [pose-only] | ms | cold | 396 | 0.800 | 1.400 | 1.800 | 2.000 | 0.813 |  |
| shard.compute [static-install] | ms | cold | 4 | 6.700 | 8.700 | 8.700 | 8.700 | 7.250 |  |
| shard.post | ms | warm | 532 | 0.000 | 0.100 | 0.200 | 0.500 | 0.022 | 1 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.200 | 0.018 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 532 | 0.000 | 0.100 | 0.200 | 0.500 | 0.022 |  |
| shard.post [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.100 | 0.200 | 0.019 |  |
| shard.post [static-install] | ms | cold | 4 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.reply-post | ms | warm | 532 | 0.000 | 0.100 | 0.200 | 0.700 | 0.040 | 1 of 1 |
| shard.reply-post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.400 | 0.036 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 532 | 0.000 | 0.100 | 0.200 | 0.700 | 0.040 |  |
| shard.reply-post [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.200 | 0.400 | 0.037 |  |
| shard.reply-post [static-install] | ms | cold | 4 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.roundtrip | ms | warm | 532 | 1.100 | 2.400 | 5.800 | 22.500 | 1.303 | 1 of 1 |
| shard.roundtrip | ms | cold | 400 | 1.200 | 2.400 | 3.900 | 23.200 | 1.491 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 532 | 1.100 | 2.400 | 5.800 | 22.500 | 1.303 |  |
| shard.roundtrip [pose-only] | ms | cold | 396 | 1.200 | 2.400 | 3.000 | 3.900 | 1.296 |  |
| shard.roundtrip [static-install] | ms | cold | 4 | 20.400 | 23.200 | 23.200 | 23.200 | 20.775 |  |
| shard.transport | ms | warm | 532 | 0.300 | 1.200 | 2.000 | 5.700 | 0.405 | 1 of 1 |
| shard.transport | ms | cold | 400 | 0.300 | 1.200 | 2.600 | 17.200 | 0.546 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 532 | 0.300 | 1.200 | 2.000 | 5.700 | 0.405 |  |
| shard.transport [pose-only] | ms | cold | 396 | 0.300 | 1.100 | 1.800 | 2.600 | 0.415 |  |
| shard.transport [static-install] | ms | cold | 4 | 12.800 | 17.200 | 17.200 | 17.200 | 13.525 |  |
| shard.worker-deserialize | ms | warm | 532 | 0.000 | 0.100 | 0.200 | 0.300 | 0.038 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.200 | 0.032 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 532 | 0.000 | 0.100 | 0.200 | 0.300 | 0.038 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.200 | 0.200 | 0.032 |  |
| shard.worker-deserialize [static-install] | ms | cold | 4 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |

## TS-W W03_C100_POSE_60HZ_60S pass=clean boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 2
Denominators: submitted=7200 coalesced=5795 dispatched=1405 completed=1405 accepted=1405 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.decide | ms | warm | 1288 | 0.100 | 0.400 | 1.300 | 3.900 | 0.126 | 2 of 2 |
| accept.decide | ms | cold | 117 | 0.000 | 0.600 | 1.500 | 3.800 | 0.162 | 2 of 2 |
| accept.decide [pose-only] | ms | warm | 1288 | 0.100 | 0.400 | 1.300 | 3.900 | 0.126 |  |
| accept.decide [pose-only] | ms | cold | 115 | 0.000 | 0.600 | 1.500 | 3.800 | 0.159 |  |
| accept.decide [static-install] | ms | cold | 2 | 0.300 | 0.300 | 0.300 | 0.300 | 0.300 |  |
| dispatch.prepare | ms | warm | 1205 | 0.100 | 0.400 | 0.800 | 2.700 | 0.171 | 2 of 2 |
| dispatch.prepare | ms | cold | 200 | 0.200 | 0.400 | 1.700 | 3.600 | 0.229 | 2 of 2 |
| dispatch.prepare [pose-only] | ms | warm | 1205 | 0.100 | 0.400 | 0.800 | 2.700 | 0.171 |  |
| dispatch.prepare [pose-only] | ms | cold | 198 | 0.200 | 0.400 | 1.700 | 1.700 | 0.196 |  |
| dispatch.prepare [static-install] | ms | cold | 2 | 3.300 | 3.600 | 3.600 | 3.600 | 3.450 |  |
| input.lateness | ms | warm | 6598 | 0.333 | 1.300 | 1.800 | 24.533 | 0.351 | 0 of 2 |
| input.lateness | ms | cold | 602 | 0.200 | 1.300 | 2.533 | 17.633 | 0.332 | 0 of 2 |
| install.ack-roundtrip | ms | cold | 8 | 11.200 | 22.500 | 22.500 | 22.500 | 12.900 | 2 of 2 |
| install.ack-roundtrip [static-install] | ms | cold | 8 | 11.200 | 22.500 | 22.500 | 22.500 | 12.900 |  |
| install.post | ms | cold | 8 | 0.100 | 0.100 | 0.100 | 0.100 | 0.075 | 2 of 2 |
| install.post [static-install] | ms | cold | 8 | 0.100 | 0.100 | 0.100 | 0.100 | 0.075 |  |
| install.worker-deserialize | ms | cold | 8 | 0.200 | 0.300 | 0.300 | 0.300 | 0.212 | 2 of 2 |
| install.worker-deserialize [static-install] | ms | cold | 8 | 0.200 | 0.300 | 0.300 | 0.300 | 0.212 |  |
| job.phase-residual | ms | warm | 1122 | 0.000 | 0.000 | 0.100 | 0.100 | -0.004 | 2 of 2 |
| job.phase-residual | ms | cold | 192 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 | 2 of 2 |
| job.phase-residual [pose-only] | ms | warm | 1122 | 0.000 | 0.000 | 0.100 | 0.100 | -0.004 |  |
| job.phase-residual [pose-only] | ms | cold | 190 | 0.000 | 0.000 | 0.100 | 0.100 | 0.002 |  |
| job.phase-residual [static-install] | ms | cold | 2 | -0.100 | -0.100 | -0.100 | -0.100 | -0.100 |  |
| job.submit-to-accepted | ms | warm | 1288 | 17.000 | 26.300 | 31.300 | 57.500 | 17.213 | 2 of 2 |
| job.submit-to-accepted | ms | cold | 117 | 15.800 | 26.200 | 32.900 | 49.900 | 16.271 | 2 of 2 |
| job.submit-to-accepted [pose-only] | ms | warm | 1288 | 17.000 | 26.300 | 31.300 | 57.500 | 17.213 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 115 | 15.700 | 25.300 | 32.100 | 49.900 | 16.011 |  |
| job.submit-to-accepted [static-install] | ms | cold | 2 | 29.500 | 32.900 | 32.900 | 32.900 | 31.200 |  |
| merge.assemble | ms | warm | 1122 | 0.000 | 0.100 | 0.100 | 0.300 | 0.006 | 2 of 2 |
| merge.assemble | ms | cold | 192 | 0.000 | 0.100 | 0.100 | 0.200 | 0.011 | 2 of 2 |
| merge.assemble [pose-only] | ms | warm | 1122 | 0.000 | 0.100 | 0.100 | 0.300 | 0.006 |  |
| merge.assemble [pose-only] | ms | cold | 190 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| merge.assemble [static-install] | ms | cold | 2 | 0.100 | 0.200 | 0.200 | 0.200 | 0.150 |  |
| merge.reply-deserialize | ms | warm | 4820 | 0.000 | 0.100 | 0.200 | 0.700 | 0.016 | 0 of 2 |
| merge.reply-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.700 | 0.018 | 0 of 2 |
| merge.reply-deserialize [pose-only] | ms | warm | 4820 | 0.000 | 0.100 | 0.200 | 0.700 | 0.016 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 792 | 0.000 | 0.100 | 0.200 | 0.700 | 0.018 |  |
| merge.reply-deserialize [static-install] | ms | cold | 8 | 0.000 | 0.100 | 0.100 | 0.100 | 0.025 |  |
| merge.validate | ms | warm | 4820 | 0.100 | 0.500 | 1.300 | 6.400 | 0.189 | 0 of 2 |
| merge.validate | ms | cold | 800 | 0.200 | 0.700 | 1.900 | 5.100 | 0.269 | 0 of 2 |
| merge.validate [pose-only] | ms | warm | 4820 | 0.100 | 0.500 | 1.300 | 6.400 | 0.189 |  |
| merge.validate [pose-only] | ms | cold | 792 | 0.200 | 0.600 | 1.800 | 5.100 | 0.253 |  |
| merge.validate [static-install] | ms | cold | 8 | 1.600 | 3.300 | 3.300 | 3.300 | 1.825 |  |
| pool.compute-metric | ms | warm | 1288 | 1.500 | 3.200 | 13.000 | 33.600 | 1.815 | 2 of 2 |
| pool.compute-metric | ms | cold | 117 | 1.800 | 6.900 | 25.900 | 30.900 | 2.821 | 2 of 2 |
| pool.compute-metric [pose-only] | ms | warm | 1288 | 1.500 | 3.200 | 13.000 | 33.600 | 1.815 |  |
| pool.compute-metric [pose-only] | ms | cold | 115 | 1.800 | 6.100 | 17.800 | 23.400 | 2.376 |  |
| pool.compute-metric [static-install] | ms | cold | 2 | 25.900 | 30.900 | 30.900 | 30.900 | 28.400 |  |
| pool.shard-max | ms | warm | 1288 | 0.700 | 1.200 | 3.400 | 17.100 | 0.770 | 2 of 2 |
| pool.shard-max | ms | cold | 117 | 0.800 | 2.900 | 7.000 | 7.000 | 1.109 | 2 of 2 |
| pool.shard-max [pose-only] | ms | warm | 1288 | 0.700 | 1.200 | 3.400 | 17.100 | 0.770 |  |
| pool.shard-max [pose-only] | ms | cold | 115 | 0.800 | 2.600 | 4.900 | 7.000 | 1.020 |  |
| pool.shard-max [static-install] | ms | cold | 2 | 5.400 | 7.000 | 7.000 | 7.000 | 6.200 |  |
| pool.shard-total | ms | warm | 1288 | 1.900 | 3.700 | 9.700 | 40.200 | 2.162 | 2 of 2 |
| pool.shard-total | ms | cold | 117 | 2.300 | 7.400 | 20.700 | 26.000 | 3.265 | 2 of 2 |
| pool.shard-total [pose-only] | ms | warm | 1288 | 1.900 | 3.700 | 9.700 | 40.200 | 2.162 |  |
| pool.shard-total [pose-only] | ms | cold | 115 | 2.300 | 6.400 | 16.500 | 16.500 | 2.916 |  |
| pool.shard-total [static-install] | ms | cold | 2 | 20.700 | 26.000 | 26.000 | 26.000 | 23.350 |  |
| pose.age-at-accept | ms | warm | 1288 | 15.500 | 17.600 | 18.200 | 36.900 | 9.156 | 2 of 2 |
| pose.age-at-accept | ms | cold | 117 | 0.000 | 18.200 | 25.500 | 27.600 | 8.069 | 2 of 2 |
| pose.age-at-accept [pose-only] | ms | warm | 1288 | 15.500 | 17.600 | 18.200 | 36.900 | 9.156 |  |
| pose.age-at-accept [pose-only] | ms | cold | 115 | 0.000 | 17.700 | 18.800 | 19.100 | 7.748 |  |
| pose.age-at-accept [static-install] | ms | cold | 2 | 25.500 | 27.600 | 27.600 | 27.600 | 26.550 |  |
| pose.latest-wait | ms | warm | 6598 | 51.600 | 90.100 | 95.000 | 143.000 | 51.632 | 0 of 2 |
| pose.latest-wait | ms | cold | 602 | 51.000 | 89.800 | 99.800 | 130.900 | 51.107 | 0 of 2 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 6598 | 51.600 | 90.100 | 95.000 | 143.000 | 51.632 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 602 | 51.000 | 89.800 | 99.800 | 130.900 | 51.107 |  |
| queue.client | ms | warm | 6589 | 5.100 | 10.400 | 11.200 | 15.500 | 6.483 | 0 of 2 |
| queue.client | ms | cold | 600 | 4.700 | 5.900 | 6.800 | 16.800 | 4.822 | 0 of 2 |
| queue.rate-limit | ms | warm | 1205 | 8.433 | 16.233 | 17.533 | 36.033 | 8.491 | 2 of 2 |
| queue.rate-limit | ms | cold | 200 | 8.133 | 16.533 | 18.433 | 19.633 | 8.364 | 2 of 2 |
| queue.rate-limit [pose-only] | ms | warm | 1205 | 8.433 | 16.233 | 17.533 | 36.033 | 8.491 |  |
| queue.rate-limit [pose-only] | ms | cold | 198 | 8.133 | 16.833 | 18.533 | 19.633 | 8.448 |  |
| queue.rate-limit [static-install] | ms | cold | 2 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 1205 | 0.200 | 1.367 | 1.967 | 2.967 | 0.290 | 2 of 2 |
| queue.timer-lateness | ms | cold | 200 | 0.167 | 1.467 | 1.967 | 2.367 | 0.289 | 2 of 2 |
| queue.timer-lateness [pose-only] | ms | warm | 1205 | 0.200 | 1.367 | 1.967 | 2.967 | 0.290 |  |
| queue.timer-lateness [pose-only] | ms | cold | 198 | 0.167 | 1.467 | 2.267 | 2.367 | 0.289 |  |
| queue.timer-lateness [static-install] | ms | cold | 2 | 0.200 | 0.200 | 0.200 | 0.200 | 0.200 |  |
| queue.wait | ms | warm | 1205 | 15.300 | 24.400 | 26.800 | 42.100 | 15.352 | 2 of 2 |
| queue.wait | ms | cold | 200 | 13.300 | 21.400 | 23.200 | 23.300 | 13.447 | 2 of 2 |
| queue.wait [pose-only] | ms | warm | 1205 | 15.300 | 24.400 | 26.800 | 42.100 | 15.352 |  |
| queue.wait [pose-only] | ms | cold | 198 | 13.500 | 21.800 | 23.300 | 23.300 | 13.564 |  |
| queue.wait [static-install] | ms | cold | 2 | 0.900 | 2.800 | 2.800 | 2.800 | 1.850 |  |
| shard.compute | ms | warm | 4820 | 0.400 | 1.000 | 2.300 | 17.100 | 0.535 | 0 of 2 |
| shard.compute | ms | cold | 800 | 0.600 | 1.500 | 4.900 | 7.000 | 0.734 | 0 of 2 |
| shard.compute [pose-only] | ms | warm | 4820 | 0.400 | 1.000 | 2.300 | 17.100 | 0.535 |  |
| shard.compute [pose-only] | ms | cold | 792 | 0.600 | 1.400 | 3.000 | 7.000 | 0.682 |  |
| shard.compute [static-install] | ms | cold | 8 | 5.400 | 7.000 | 7.000 | 7.000 | 5.837 |  |
| shard.post | ms | warm | 4820 | 0.000 | 0.100 | 0.200 | 1.100 | 0.029 | 0 of 2 |
| shard.post | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.400 | 0.024 | 0 of 2 |
| shard.post [pose-only] | ms | warm | 4820 | 0.000 | 0.100 | 0.200 | 1.100 | 0.029 |  |
| shard.post [pose-only] | ms | cold | 792 | 0.000 | 0.100 | 0.200 | 0.400 | 0.024 |  |
| shard.post [static-install] | ms | cold | 8 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.reply-post | ms | warm | 4820 | 0.000 | 0.100 | 0.200 | 1.100 | 0.049 | 0 of 2 |
| shard.reply-post | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.600 | 0.042 | 0 of 2 |
| shard.reply-post [pose-only] | ms | warm | 4820 | 0.000 | 0.100 | 0.200 | 1.100 | 0.049 |  |
| shard.reply-post [pose-only] | ms | cold | 792 | 0.000 | 0.100 | 0.200 | 0.600 | 0.042 |  |
| shard.reply-post [static-install] | ms | cold | 8 | 0.000 | 0.100 | 0.100 | 0.100 | 0.012 |  |
| shard.roundtrip | ms | warm | 4820 | 0.800 | 1.800 | 5.000 | 27.600 | 0.950 | 0 of 2 |
| shard.roundtrip | ms | cold | 800 | 1.000 | 2.800 | 13.400 | 25.800 | 1.337 | 0 of 2 |
| shard.roundtrip [pose-only] | ms | warm | 4820 | 0.800 | 1.800 | 5.000 | 27.600 | 0.950 |  |
| shard.roundtrip [pose-only] | ms | cold | 792 | 0.900 | 2.500 | 5.400 | 16.000 | 1.162 |  |
| shard.roundtrip [static-install] | ms | cold | 8 | 17.000 | 25.800 | 25.800 | 25.800 | 18.700 |  |
| shard.transport | ms | warm | 4820 | 0.200 | 0.800 | 2.000 | 16.800 | 0.328 | 0 of 2 |
| shard.transport | ms | cold | 800 | 0.300 | 1.300 | 7.800 | 20.000 | 0.529 | 0 of 2 |
| shard.transport [pose-only] | ms | warm | 4820 | 0.200 | 0.800 | 2.000 | 16.800 | 0.328 |  |
| shard.transport [pose-only] | ms | cold | 792 | 0.300 | 1.200 | 2.000 | 8.300 | 0.405 |  |
| shard.transport [static-install] | ms | cold | 8 | 11.600 | 20.000 | 20.000 | 20.000 | 12.825 |  |
| shard.worker-deserialize | ms | warm | 4820 | 0.000 | 0.100 | 0.200 | 0.800 | 0.038 | 0 of 2 |
| shard.worker-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.600 | 0.033 | 0 of 2 |
| shard.worker-deserialize [pose-only] | ms | warm | 4820 | 0.000 | 0.100 | 0.200 | 0.800 | 0.038 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 792 | 0.000 | 0.100 | 0.200 | 0.600 | 0.033 |  |
| shard.worker-deserialize [static-install] | ms | cold | 8 | 0.000 | 0.100 | 0.100 | 0.100 | 0.025 |  |

## TS-W W03_C100_POSE_60HZ_60S pass=traced boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1201 coalesced=970 dispatched=231 completed=231 accepted=231 stale=0 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.decide | ms | warm | 175 | 0.000 | 0.900 | 13.500 | 15.200 | 0.319 | 1 of 1 |
| accept.decide | ms | cold | 56 | 0.000 | 2.000 | 11.800 | 11.800 | 0.529 | 1 of 1 |
| accept.decide [pose-only] | ms | warm | 175 | 0.000 | 0.900 | 13.500 | 15.200 | 0.319 |  |
| accept.decide [pose-only] | ms | cold | 55 | 0.000 | 2.000 | 11.800 | 11.800 | 0.529 |  |
| accept.decide [static-install] | ms | cold | 1 | 0.500 | 0.500 | 0.500 | 0.500 | 0.500 |  |
| dispatch.prepare | ms | warm | 131 | 0.100 | 0.500 | 2.000 | 3.000 | 0.206 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.100 | 1.000 | 6.000 | 14.300 | 0.424 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 131 | 0.100 | 0.500 | 2.000 | 3.000 | 0.206 |  |
| dispatch.prepare [pose-only] | ms | cold | 99 | 0.100 | 1.000 | 14.300 | 14.300 | 0.368 |  |
| dispatch.prepare [static-install] | ms | cold | 1 | 6.000 | 6.000 | 6.000 | 6.000 | 6.000 |  |
| input.lateness | ms | warm | 901 | 0.200 | 1.133 | 35.267 | 61.133 | 0.941 | 0 of 1 |
| input.lateness | ms | cold | 300 | 0.233 | 3.700 | 45.467 | 65.433 | 1.877 | 0 of 1 |
| install.ack-roundtrip | ms | cold | 4 | 15.400 | 17.000 | 17.000 | 17.000 | 16.075 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | cold | 4 | 15.400 | 17.000 | 17.000 | 17.000 | 16.075 |  |
| install.post | ms | cold | 4 | 0.000 | 0.200 | 0.200 | 0.200 | 0.050 | 1 of 1 |
| install.post [static-install] | ms | cold | 4 | 0.000 | 0.200 | 0.200 | 0.200 | 0.050 |  |
| install.worker-deserialize | ms | cold | 4 | 0.100 | 0.200 | 0.200 | 0.200 | 0.150 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | cold | 4 | 0.100 | 0.200 | 0.200 | 0.200 | 0.150 |  |
| job.phase-residual | ms | warm | 123 | 0.000 | 0.100 | 0.200 | 2.400 | 0.035 | 1 of 1 |
| job.phase-residual | ms | cold | 96 | 0.000 | 0.100 | 0.300 | 0.300 | 0.029 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 123 | 0.000 | 0.100 | 0.200 | 2.400 | 0.035 |  |
| job.phase-residual [pose-only] | ms | cold | 95 | 0.000 | 0.100 | 0.300 | 0.300 | 0.029 |  |
| job.phase-residual [static-install] | ms | cold | 1 | -0.000 | -0.000 | -0.000 | -0.000 | -0.000 |  |
| job.submit-to-accepted | ms | warm | 175 | 15.600 | 26.900 | 96.100 | 118.100 | 17.094 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 56 | 15.000 | 53.500 | 94.900 | 94.900 | 19.688 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 175 | 15.600 | 26.900 | 96.100 | 118.100 | 17.094 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 55 | 15.000 | 53.100 | 94.900 | 94.900 | 19.073 |  |
| job.submit-to-accepted [static-install] | ms | cold | 1 | 53.500 | 53.500 | 53.500 | 53.500 | 53.500 |  |
| merge.assemble | ms | warm | 123 | 0.000 | 0.100 | 1.000 | 2.000 | 0.033 | 1 of 1 |
| merge.assemble | ms | cold | 96 | 0.000 | 0.100 | 0.300 | 0.300 | 0.022 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 123 | 0.000 | 0.100 | 1.000 | 2.000 | 0.033 |  |
| merge.assemble [pose-only] | ms | cold | 95 | 0.000 | 0.100 | 0.200 | 0.200 | 0.019 |  |
| merge.assemble [static-install] | ms | cold | 1 | 0.300 | 0.300 | 0.300 | 0.300 | 0.300 |  |
| merge.reply-deserialize | ms | warm | 524 | 0.000 | 0.100 | 0.400 | 1.900 | 0.032 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 1.300 | 0.032 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 524 | 0.000 | 0.100 | 0.400 | 1.900 | 0.032 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.300 | 1.300 | 0.032 |  |
| merge.reply-deserialize [static-install] | ms | cold | 4 | 0.000 | 0.100 | 0.100 | 0.100 | 0.025 |  |
| merge.validate | ms | warm | 524 | 0.200 | 0.900 | 3.400 | 26.700 | 0.404 | 1 of 1 |
| merge.validate | ms | cold | 400 | 0.200 | 1.700 | 7.700 | 23.500 | 0.546 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 524 | 0.200 | 0.900 | 3.400 | 26.700 | 0.404 |  |
| merge.validate [pose-only] | ms | cold | 396 | 0.200 | 1.400 | 7.800 | 23.500 | 0.523 |  |
| merge.validate [static-install] | ms | cold | 4 | 2.100 | 4.500 | 4.500 | 4.500 | 2.825 |  |
| pool.compute-metric | ms | warm | 175 | 1.400 | 8.200 | 72.500 | 74.300 | 3.187 | 1 of 1 |
| pool.compute-metric | ms | cold | 56 | 1.900 | 42.000 | 62.300 | 62.300 | 5.704 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 175 | 1.400 | 8.200 | 72.500 | 74.300 | 3.187 |  |
| pool.compute-metric [pose-only] | ms | cold | 55 | 1.900 | 37.000 | 62.300 | 62.300 | 5.044 |  |
| pool.compute-metric [static-install] | ms | cold | 1 | 42.000 | 42.000 | 42.000 | 42.000 | 42.000 |  |
| pool.shard-max | ms | warm | 175 | 0.600 | 3.600 | 23.300 | 37.800 | 1.327 | 1 of 1 |
| pool.shard-max | ms | cold | 56 | 0.800 | 9.800 | 20.500 | 20.500 | 2.030 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 175 | 0.600 | 3.600 | 23.300 | 37.800 | 1.327 |  |
| pool.shard-max [pose-only] | ms | cold | 55 | 0.800 | 9.300 | 20.500 | 20.500 | 1.889 |  |
| pool.shard-max [static-install] | ms | cold | 1 | 9.800 | 9.800 | 9.800 | 9.800 | 9.800 |  |
| pool.shard-total | ms | warm | 175 | 1.400 | 8.400 | 49.300 | 86.500 | 3.097 | 1 of 1 |
| pool.shard-total | ms | cold | 56 | 2.100 | 36.300 | 57.600 | 57.600 | 5.470 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 175 | 1.400 | 8.400 | 49.300 | 86.500 | 3.097 |  |
| pool.shard-total [pose-only] | ms | cold | 55 | 2.100 | 27.500 | 57.600 | 57.600 | 4.869 |  |
| pool.shard-total [static-install] | ms | cold | 1 | 38.500 | 38.500 | 38.500 | 38.500 | 38.500 |  |
| pose.age-at-accept | ms | warm | 175 | 0.000 | 17.900 | 51.800 | 86.100 | 7.995 | 1 of 1 |
| pose.age-at-accept | ms | cold | 56 | 0.000 | 22.100 | 62.900 | 62.900 | 8.987 | 1 of 1 |
| pose.age-at-accept [pose-only] | ms | warm | 175 | 0.000 | 17.900 | 51.800 | 86.100 | 7.995 |  |
| pose.age-at-accept [pose-only] | ms | cold | 55 | 0.000 | 17.800 | 62.900 | 62.900 | 8.545 |  |
| pose.age-at-accept [static-install] | ms | cold | 1 | 33.300 | 33.300 | 33.300 | 33.300 | 33.300 |  |
| pose.latest-wait | ms | warm | 901 | 50.900 | 90.500 | 134.900 | 185.500 | 52.035 | 0 of 1 |
| pose.latest-wait | ms | cold | 300 | 55.300 | 109.500 | 144.800 | 206.200 | 56.245 | 0 of 1 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 901 | 50.900 | 90.500 | 134.900 | 185.500 | 52.035 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 300 | 55.300 | 109.500 | 144.800 | 206.200 | 56.245 |  |
| queue.client | ms | warm | 889 | 4.600 | 5.700 | 7.000 | 15.600 | 4.803 | 0 of 1 |
| queue.client | ms | cold | 292 | 4.600 | 5.800 | 8.700 | 9.200 | 4.809 | 0 of 1 |
| queue.rate-limit | ms | warm | 131 | 9.133 | 16.233 | 17.933 | 67.133 | 9.114 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 7.633 | 16.433 | 17.333 | 17.633 | 7.987 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 131 | 9.133 | 16.233 | 17.933 | 67.133 | 9.114 |  |
| queue.rate-limit [pose-only] | ms | cold | 99 | 7.733 | 17.033 | 17.633 | 17.633 | 8.068 |  |
| queue.rate-limit [static-install] | ms | cold | 1 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| queue.timer-lateness | ms | warm | 131 | -0.133 | 0.867 | 1.467 | 4.067 | 0.003 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.067 | 0.967 | 2.300 | 8.467 | 0.243 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 131 | -0.133 | 0.867 | 1.467 | 4.067 | 0.003 |  |
| queue.timer-lateness [pose-only] | ms | cold | 99 | 0.067 | 0.967 | 8.467 | 8.467 | 0.222 |  |
| queue.timer-lateness [static-install] | ms | cold | 1 | 2.300 | 2.300 | 2.300 | 2.300 | 2.300 |  |
| queue.wait | ms | warm | 131 | 13.500 | 21.000 | 23.000 | 73.600 | 13.811 | 1 of 1 |
| queue.wait | ms | cold | 100 | 12.200 | 21.700 | 22.100 | 22.100 | 13.021 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 131 | 13.500 | 21.000 | 23.000 | 73.600 | 13.811 |  |
| queue.wait [pose-only] | ms | cold | 99 | 12.500 | 21.900 | 22.100 | 22.100 | 13.052 |  |
| queue.wait [static-install] | ms | cold | 1 | 10.000 | 10.000 | 10.000 | 10.000 | 10.000 |  |
| shard.compute | ms | warm | 524 | 0.300 | 2.300 | 17.500 | 37.800 | 0.806 | 1 of 1 |
| shard.compute | ms | cold | 400 | 0.500 | 3.900 | 10.800 | 20.500 | 1.064 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 524 | 0.300 | 2.300 | 17.500 | 37.800 | 0.806 |  |
| shard.compute [pose-only] | ms | cold | 396 | 0.500 | 3.500 | 11.200 | 20.500 | 0.978 |  |
| shard.compute [static-install] | ms | cold | 4 | 9.600 | 9.800 | 9.800 | 9.800 | 9.625 |  |
| shard.post | ms | warm | 524 | 0.000 | 0.100 | 0.600 | 1.500 | 0.036 | 1 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.300 | 2.700 | 0.037 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 524 | 0.000 | 0.100 | 0.600 | 1.500 | 0.036 |  |
| shard.post [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.300 | 2.700 | 0.037 |  |
| shard.post [static-install] | ms | cold | 4 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.reply-post | ms | warm | 524 | 0.000 | 0.200 | 0.500 | 2.100 | 0.058 | 1 of 1 |
| shard.reply-post | ms | cold | 400 | 0.000 | 0.200 | 0.500 | 0.800 | 0.047 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 524 | 0.000 | 0.200 | 0.500 | 2.100 | 0.058 |  |
| shard.reply-post [pose-only] | ms | cold | 396 | 0.000 | 0.200 | 0.500 | 0.800 | 0.048 |  |
| shard.reply-post [static-install] | ms | cold | 4 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |  |
| shard.roundtrip | ms | warm | 524 | 0.700 | 4.100 | 21.400 | 63.400 | 1.490 | 1 of 1 |
| shard.roundtrip | ms | cold | 400 | 0.800 | 7.100 | 28.500 | 37.700 | 2.134 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 524 | 0.700 | 4.100 | 21.400 | 63.400 | 1.490 |  |
| shard.roundtrip [pose-only] | ms | cold | 396 | 0.800 | 6.200 | 24.300 | 37.700 | 1.855 |  |
| shard.roundtrip [static-install] | ms | cold | 4 | 29.600 | 33.500 | 33.500 | 33.500 | 29.800 |  |
| shard.transport | ms | warm | 524 | 0.300 | 1.800 | 6.700 | 23.300 | 0.585 | 1 of 1 |
| shard.transport | ms | cold | 400 | 0.300 | 2.900 | 15.100 | 27.900 | 0.982 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 524 | 0.300 | 1.800 | 6.700 | 23.300 | 0.585 |  |
| shard.transport [pose-only] | ms | cold | 396 | 0.300 | 2.700 | 8.700 | 27.900 | 0.788 |  |
| shard.transport [static-install] | ms | cold | 4 | 20.000 | 23.600 | 23.600 | 23.600 | 20.150 |  |
| shard.worker-deserialize | ms | warm | 524 | 0.000 | 0.100 | 0.400 | 1.200 | 0.040 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.400 | 0.600 | 0.041 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 524 | 0.000 | 0.100 | 0.400 | 1.200 | 0.040 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 396 | 0.000 | 0.100 | 0.400 | 0.600 | 0.041 |  |
| shard.worker-deserialize [static-install] | ms | cold | 4 | 0.000 | 0.100 | 0.100 | 0.100 | 0.025 |  |

## TS-W W04_C100_STATIC_5HZ_30S pass=clean boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 2
Denominators: submitted=3900 coalesced=3198 dispatched=702 completed=694 accepted=669 stale=33 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.decide | ms | warm | 579 | 0.100 | 0.500 | 0.900 | 3.100 | 0.132 | 2 of 2 |
| accept.decide | ms | cold | 115 | 0.100 | 0.700 | 1.000 | 1.200 | 0.150 | 2 of 2 |
| accept.decide [pose-only] | ms | warm | 329 | 0.100 | 0.400 | 0.900 | 3.100 | 0.137 |  |
| accept.decide [pose-only] | ms | cold | 65 | 0.100 | 0.700 | 1.200 | 1.200 | 0.165 |  |
| accept.decide [static-install] | ms | warm | 250 | 0.100 | 0.500 | 0.900 | 1.300 | 0.126 |  |
| accept.decide [static-install] | ms | cold | 50 | 0.000 | 0.600 | 1.000 | 1.000 | 0.132 |  |
| dispatch.prepare | ms | warm | 502 | 0.200 | 0.600 | 1.300 | 7.200 | 0.253 | 2 of 2 |
| dispatch.prepare | ms | cold | 200 | 0.200 | 0.600 | 1.700 | 1.900 | 0.262 | 2 of 2 |
| dispatch.prepare [pose-only] | ms | warm | 288 | 0.100 | 0.300 | 0.800 | 2.500 | 0.162 |  |
| dispatch.prepare [pose-only] | ms | cold | 113 | 0.100 | 0.300 | 0.500 | 0.600 | 0.153 |  |
| dispatch.prepare [static-install] | ms | warm | 214 | 0.300 | 0.800 | 1.300 | 7.200 | 0.375 |  |
| dispatch.prepare [static-install] | ms | cold | 87 | 0.300 | 1.500 | 1.900 | 1.900 | 0.403 |  |
| input.lateness | ms | warm | 3247 | 0.300 | 1.300 | 1.800 | 11.967 | 0.336 | 0 of 2 |
| input.lateness | ms | cold | 653 | 0.300 | 1.500 | 2.067 | 12.700 | 0.369 | 0 of 2 |
| install.ack-roundtrip | ms | warm | 856 | 0.500 | 1.000 | 2.100 | 10.300 | 0.565 | 2 of 2 |
| install.ack-roundtrip | ms | cold | 348 | 0.400 | 1.300 | 7.300 | 9.100 | 0.635 | 2 of 2 |
| install.ack-roundtrip [static-install] | ms | warm | 856 | 0.500 | 1.000 | 2.100 | 10.300 | 0.565 |  |
| install.ack-roundtrip [static-install] | ms | cold | 348 | 0.400 | 1.300 | 7.300 | 9.100 | 0.635 |  |
| install.post | ms | warm | 856 | 0.100 | 0.300 | 0.600 | 2.500 | 0.093 | 2 of 2 |
| install.post | ms | cold | 348 | 0.100 | 0.200 | 0.400 | 0.600 | 0.074 | 2 of 2 |
| install.post [static-install] | ms | warm | 856 | 0.100 | 0.300 | 0.600 | 2.500 | 0.093 |  |
| install.post [static-install] | ms | cold | 348 | 0.100 | 0.200 | 0.400 | 0.600 | 0.074 |  |
| install.worker-deserialize | ms | warm | 856 | 0.300 | 0.500 | 0.800 | 4.000 | 0.272 | 2 of 2 |
| install.worker-deserialize | ms | cold | 348 | 0.200 | 0.400 | 0.700 | 0.800 | 0.231 | 2 of 2 |
| install.worker-deserialize [static-install] | ms | warm | 856 | 0.300 | 0.500 | 0.800 | 4.000 | 0.272 |  |
| install.worker-deserialize [static-install] | ms | cold | 348 | 0.200 | 0.400 | 0.700 | 0.800 | 0.231 |  |
| job.phase-residual | ms | warm | 460 | 0.000 | 0.000 | 0.100 | 0.100 | -0.000 | 2 of 2 |
| job.phase-residual | ms | cold | 191 | 0.000 | 0.000 | 0.100 | 0.100 | 0.003 | 2 of 2 |
| job.phase-residual [pose-only] | ms | warm | 263 | 0.000 | 0.000 | 0.100 | 0.100 | -0.002 |  |
| job.phase-residual [pose-only] | ms | cold | 109 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 |  |
| job.phase-residual [static-install] | ms | warm | 197 | 0.000 | 0.000 | 0.100 | 0.100 | 0.001 |  |
| job.phase-residual [static-install] | ms | cold | 82 | 0.000 | 0.100 | 0.100 | 0.100 | 0.006 |  |
| job.submit-to-accepted | ms | warm | 559 | 17.500 | 27.800 | 33.800 | 49.900 | 17.570 | 2 of 2 |
| job.submit-to-accepted | ms | cold | 110 | 17.300 | 28.800 | 30.300 | 30.700 | 17.799 | 2 of 2 |
| job.submit-to-accepted [pose-only] | ms | warm | 309 | 17.700 | 27.800 | 32.700 | 38.900 | 17.823 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 60 | 17.900 | 28.900 | 30.700 | 30.700 | 18.678 |  |
| job.submit-to-accepted [static-install] | ms | warm | 250 | 17.200 | 28.300 | 33.800 | 49.900 | 17.258 |  |
| job.submit-to-accepted [static-install] | ms | cold | 50 | 16.000 | 25.900 | 29.200 | 29.200 | 16.744 |  |
| merge.assemble | ms | warm | 465 | 0.000 | 0.000 | 0.100 | 0.100 | 0.005 | 2 of 2 |
| merge.assemble | ms | cold | 194 | 0.000 | 0.100 | 0.100 | 0.100 | 0.006 | 2 of 2 |
| merge.assemble [pose-only] | ms | warm | 268 | 0.000 | 0.000 | 0.100 | 0.100 | 0.005 |  |
| merge.assemble [pose-only] | ms | cold | 111 | 0.000 | 0.100 | 0.100 | 0.100 | 0.006 |  |
| merge.assemble [static-install] | ms | warm | 197 | 0.000 | 0.100 | 0.100 | 0.100 | 0.005 |  |
| merge.assemble [static-install] | ms | cold | 83 | 0.000 | 0.100 | 0.100 | 0.100 | 0.006 |  |
| merge.reply-deserialize | ms | warm | 2008 | 0.000 | 0.100 | 0.100 | 0.400 | 0.014 | 0 of 2 |
| merge.reply-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.200 | 0.015 | 0 of 2 |
| merge.reply-deserialize [pose-only] | ms | warm | 1152 | 0.000 | 0.100 | 0.100 | 0.400 | 0.014 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 452 | 0.000 | 0.100 | 0.100 | 0.200 | 0.015 |  |
| merge.reply-deserialize [static-install] | ms | warm | 856 | 0.000 | 0.100 | 0.100 | 0.400 | 0.013 |  |
| merge.reply-deserialize [static-install] | ms | cold | 348 | 0.000 | 0.100 | 0.100 | 0.100 | 0.014 |  |
| merge.validate | ms | warm | 2008 | 0.100 | 0.500 | 1.200 | 4.700 | 0.176 | 0 of 2 |
| merge.validate | ms | cold | 800 | 0.100 | 0.600 | 1.100 | 3.100 | 0.204 | 0 of 2 |
| merge.validate [pose-only] | ms | warm | 1152 | 0.100 | 0.500 | 1.300 | 4.700 | 0.175 |  |
| merge.validate [pose-only] | ms | cold | 452 | 0.100 | 0.500 | 1.000 | 3.100 | 0.194 |  |
| merge.validate [static-install] | ms | warm | 856 | 0.100 | 0.500 | 1.200 | 2.600 | 0.178 |  |
| merge.validate [static-install] | ms | cold | 348 | 0.200 | 0.600 | 1.600 | 1.900 | 0.217 |  |
| pool.compute-metric | ms | warm | 579 | 1.600 | 3.600 | 11.500 | 28.200 | 1.997 | 2 of 2 |
| pool.compute-metric | ms | cold | 115 | 1.800 | 5.500 | 9.700 | 15.000 | 2.340 | 2 of 2 |
| pool.compute-metric [pose-only] | ms | warm | 329 | 1.400 | 3.400 | 11.300 | 17.900 | 1.739 |  |
| pool.compute-metric [pose-only] | ms | cold | 65 | 1.600 | 5.100 | 9.700 | 9.700 | 1.935 |  |
| pool.compute-metric [static-install] | ms | warm | 250 | 1.900 | 3.700 | 11.500 | 28.200 | 2.336 |  |
| pool.compute-metric [static-install] | ms | cold | 50 | 2.300 | 8.900 | 15.000 | 15.000 | 2.866 |  |
| pool.shard-max | ms | warm | 579 | 0.700 | 1.200 | 3.300 | 15.800 | 0.733 | 2 of 2 |
| pool.shard-max | ms | cold | 115 | 0.800 | 2.100 | 3.700 | 5.200 | 0.970 | 2 of 2 |
| pool.shard-max [pose-only] | ms | warm | 329 | 0.700 | 1.200 | 3.600 | 15.800 | 0.759 |  |
| pool.shard-max [pose-only] | ms | cold | 65 | 0.800 | 1.800 | 5.200 | 5.200 | 0.940 |  |
| pool.shard-max [static-install] | ms | warm | 250 | 0.700 | 1.300 | 2.400 | 3.900 | 0.698 |  |
| pool.shard-max [static-install] | ms | cold | 50 | 0.900 | 2.400 | 3.700 | 3.700 | 1.010 |  |
| pool.shard-total | ms | warm | 579 | 1.800 | 3.500 | 8.800 | 18.100 | 2.074 | 2 of 2 |
| pool.shard-total | ms | cold | 115 | 2.500 | 6.400 | 9.800 | 14.300 | 2.780 | 2 of 2 |
| pool.shard-total [pose-only] | ms | warm | 329 | 1.800 | 3.400 | 11.700 | 18.100 | 2.115 |  |
| pool.shard-total [pose-only] | ms | cold | 65 | 2.300 | 5.100 | 9.800 | 9.800 | 2.637 |  |
| pool.shard-total [static-install] | ms | warm | 250 | 1.800 | 3.500 | 7.200 | 12.800 | 2.020 |  |
| pool.shard-total [static-install] | ms | cold | 50 | 2.600 | 6.400 | 14.300 | 14.300 | 2.966 |  |
| pose.age-at-accept | ms | warm | 559 | 15.400 | 17.800 | 18.500 | 39.000 | 9.611 | 2 of 2 |
| pose.age-at-accept | ms | cold | 110 | 15.500 | 17.800 | 18.300 | 18.500 | 9.821 | 2 of 2 |
| pose.age-at-accept [pose-only] | ms | warm | 309 | 15.700 | 17.800 | 18.500 | 34.300 | 9.793 |  |
| pose.age-at-accept [pose-only] | ms | cold | 60 | 15.800 | 17.800 | 18.300 | 18.300 | 10.517 |  |
| pose.age-at-accept [static-install] | ms | warm | 250 | 15.100 | 17.800 | 18.300 | 39.000 | 9.388 |  |
| pose.age-at-accept [static-install] | ms | cold | 50 | 9.700 | 17.900 | 18.500 | 18.500 | 8.986 |  |
| pose.latest-wait | ms | warm | 3247 | 54.200 | 97.000 | 161.800 | 182.500 | 55.871 | 0 of 2 |
| pose.latest-wait | ms | cold | 653 | 55.800 | 101.400 | 155.800 | 173.900 | 57.113 | 0 of 2 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 3247 | 54.200 | 97.000 | 161.800 | 182.500 | 55.871 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 653 | 55.800 | 101.400 | 155.800 | 173.900 | 57.113 |  |
| queue.client | ms | warm | 2995 | 5.600 | 11.000 | 11.600 | 13.900 | 6.910 | 0 of 2 |
| queue.client | ms | cold | 602 | 5.600 | 11.400 | 12.000 | 13.300 | 7.232 | 0 of 2 |
| queue.rate-limit | ms | warm | 502 | 8.333 | 16.333 | 17.933 | 22.633 | 8.383 | 2 of 2 |
| queue.rate-limit | ms | cold | 200 | 7.333 | 16.333 | 16.933 | 16.933 | 7.767 | 2 of 2 |
| queue.rate-limit [pose-only] | ms | warm | 288 | 8.233 | 16.033 | 17.733 | 22.633 | 8.291 |  |
| queue.rate-limit [pose-only] | ms | cold | 113 | 8.533 | 16.533 | 16.933 | 16.933 | 8.514 |  |
| queue.rate-limit [static-install] | ms | warm | 214 | 8.533 | 16.733 | 19.233 | 21.533 | 8.505 |  |
| queue.rate-limit [static-install] | ms | cold | 87 | 6.433 | 16.333 | 16.933 | 16.933 | 6.797 |  |
| queue.timer-lateness | ms | warm | 502 | 0.267 | 1.467 | 2.067 | 2.467 | 0.301 | 2 of 2 |
| queue.timer-lateness | ms | cold | 200 | 0.167 | 1.467 | 1.867 | 2.167 | 0.316 | 2 of 2 |
| queue.timer-lateness [pose-only] | ms | warm | 288 | 0.267 | 1.367 | 2.067 | 2.367 | 0.302 |  |
| queue.timer-lateness [pose-only] | ms | cold | 113 | 0.267 | 1.767 | 1.867 | 2.167 | 0.377 |  |
| queue.timer-lateness [static-install] | ms | warm | 214 | 0.167 | 1.467 | 1.867 | 2.467 | 0.300 |  |
| queue.timer-lateness [static-install] | ms | cold | 87 | 0.167 | 1.267 | 1.767 | 1.767 | 0.237 |  |
| queue.wait | ms | warm | 502 | 15.600 | 25.500 | 27.000 | 34.500 | 15.450 | 2 of 2 |
| queue.wait | ms | cold | 200 | 15.200 | 25.600 | 27.500 | 27.700 | 15.382 | 2 of 2 |
| queue.wait [pose-only] | ms | warm | 288 | 16.100 | 25.800 | 27.100 | 34.500 | 15.903 |  |
| queue.wait [pose-only] | ms | cold | 113 | 15.500 | 26.300 | 27.500 | 27.700 | 16.571 |  |
| queue.wait [static-install] | ms | warm | 214 | 15.000 | 24.200 | 27.000 | 28.300 | 14.840 |  |
| queue.wait [static-install] | ms | cold | 87 | 13.900 | 22.800 | 27.600 | 27.600 | 13.838 |  |
| shard.compute | ms | warm | 2008 | 0.400 | 1.000 | 2.100 | 15.800 | 0.519 | 0 of 2 |
| shard.compute | ms | cold | 800 | 0.500 | 1.300 | 2.900 | 5.200 | 0.631 | 0 of 2 |
| shard.compute [pose-only] | ms | warm | 1152 | 0.400 | 1.000 | 2.200 | 15.800 | 0.530 |  |
| shard.compute [pose-only] | ms | cold | 452 | 0.500 | 1.300 | 2.200 | 5.200 | 0.600 |  |
| shard.compute [static-install] | ms | warm | 856 | 0.400 | 1.000 | 1.900 | 3.900 | 0.504 |  |
| shard.compute [static-install] | ms | cold | 348 | 0.500 | 1.700 | 3.600 | 3.700 | 0.671 |  |
| shard.post | ms | warm | 2008 | 0.000 | 0.100 | 0.200 | 1.200 | 0.017 | 0 of 2 |
| shard.post | ms | cold | 800 | 0.000 | 0.100 | 0.100 | 0.400 | 0.016 | 0 of 2 |
| shard.post [pose-only] | ms | warm | 1152 | 0.000 | 0.100 | 0.200 | 1.200 | 0.022 |  |
| shard.post [pose-only] | ms | cold | 452 | 0.000 | 0.100 | 0.200 | 0.400 | 0.022 |  |
| shard.post [static-install] | ms | warm | 856 | 0.000 | 0.100 | 0.100 | 0.500 | 0.010 |  |
| shard.post [static-install] | ms | cold | 348 | 0.000 | 0.100 | 0.100 | 0.100 | 0.007 |  |
| shard.reply-post | ms | warm | 2008 | 0.000 | 0.100 | 0.200 | 2.400 | 0.044 | 0 of 2 |
| shard.reply-post | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.200 | 0.035 | 0 of 2 |
| shard.reply-post [pose-only] | ms | warm | 1152 | 0.000 | 0.100 | 0.200 | 0.700 | 0.047 |  |
| shard.reply-post [pose-only] | ms | cold | 452 | 0.000 | 0.100 | 0.200 | 0.200 | 0.040 |  |
| shard.reply-post [static-install] | ms | warm | 856 | 0.000 | 0.100 | 0.200 | 2.400 | 0.041 |  |
| shard.reply-post [static-install] | ms | cold | 348 | 0.000 | 0.100 | 0.200 | 0.200 | 0.029 |  |
| shard.roundtrip | ms | warm | 2008 | 0.900 | 1.900 | 4.900 | 16.100 | 1.024 | 0 of 2 |
| shard.roundtrip | ms | cold | 800 | 0.900 | 2.500 | 6.100 | 12.400 | 1.163 | 0 of 2 |
| shard.roundtrip [pose-only] | ms | warm | 1152 | 0.800 | 1.800 | 5.700 | 16.100 | 0.941 |  |
| shard.roundtrip [pose-only] | ms | cold | 452 | 0.800 | 2.200 | 3.800 | 6.100 | 0.967 |  |
| shard.roundtrip [static-install] | ms | warm | 856 | 0.900 | 2.000 | 4.800 | 13.700 | 1.134 |  |
| shard.roundtrip [static-install] | ms | cold | 348 | 1.100 | 3.200 | 11.200 | 12.400 | 1.417 |  |
| shard.transport | ms | warm | 2008 | 0.300 | 1.000 | 2.700 | 9.400 | 0.430 | 0 of 2 |
| shard.transport | ms | cold | 800 | 0.300 | 1.200 | 2.300 | 9.100 | 0.469 | 0 of 2 |
| shard.transport [pose-only] | ms | warm | 1152 | 0.200 | 0.800 | 2.700 | 5.600 | 0.330 |  |
| shard.transport [pose-only] | ms | cold | 452 | 0.200 | 0.900 | 1.600 | 2.200 | 0.293 |  |
| shard.transport [static-install] | ms | warm | 856 | 0.500 | 1.000 | 2.800 | 9.400 | 0.566 |  |
| shard.transport [static-install] | ms | cold | 348 | 0.500 | 1.600 | 8.000 | 9.100 | 0.698 |  |
| shard.worker-deserialize | ms | warm | 2008 | 0.000 | 0.100 | 0.200 | 0.600 | 0.030 | 0 of 2 |
| shard.worker-deserialize | ms | cold | 800 | 0.000 | 0.100 | 0.200 | 0.200 | 0.028 | 0 of 2 |
| shard.worker-deserialize [pose-only] | ms | warm | 1152 | 0.000 | 0.100 | 0.200 | 0.400 | 0.035 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 452 | 0.000 | 0.100 | 0.200 | 0.200 | 0.034 |  |
| shard.worker-deserialize [static-install] | ms | warm | 856 | 0.000 | 0.100 | 0.200 | 0.600 | 0.024 |  |
| shard.worker-deserialize [static-install] | ms | cold | 348 | 0.000 | 0.100 | 0.100 | 0.200 | 0.019 |  |

## TS-W W04_C100_STATIC_5HZ_30S pass=traced boundary=browser-pool workers=4 audio=not-applicable build=not-applicable driver=not-applicable browser-channel=default viewport=not-applicable browser-args="not-applicable"

Runs: 1
Denominators: submitted=1301 coalesced=1074 dispatched=227 completed=225 accepted=212 stale=15 fallback=0 error=0 timeout=0

| phase | units | temperature | N | p50 | p95 | p99 | max | mean | exploratory runs |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| accept.decide | ms | warm | 169 | 0.100 | 1.100 | 19.300 | 47.700 | 0.731 | 1 of 1 |
| accept.decide | ms | cold | 56 | 0.200 | 0.800 | 1.000 | 1.000 | 0.229 | 1 of 1 |
| accept.decide [pose-only] | ms | warm | 94 | 0.100 | 1.100 | 47.700 | 47.700 | 0.747 |  |
| accept.decide [pose-only] | ms | cold | 31 | 0.200 | 0.600 | 1.000 | 1.000 | 0.239 |  |
| accept.decide [static-install] | ms | warm | 75 | 0.100 | 1.500 | 19.300 | 19.300 | 0.712 |  |
| accept.decide [static-install] | ms | cold | 25 | 0.200 | 0.800 | 0.900 | 0.900 | 0.216 |  |
| dispatch.prepare | ms | warm | 127 | 0.200 | 2.800 | 16.000 | 25.600 | 0.857 | 1 of 1 |
| dispatch.prepare | ms | cold | 100 | 0.200 | 0.800 | 1.400 | 2.100 | 0.298 | 1 of 1 |
| dispatch.prepare [pose-only] | ms | warm | 70 | 0.100 | 0.900 | 9.600 | 9.600 | 0.456 |  |
| dispatch.prepare [pose-only] | ms | cold | 56 | 0.100 | 0.500 | 0.700 | 0.700 | 0.166 |  |
| dispatch.prepare [static-install] | ms | warm | 57 | 0.400 | 3.300 | 25.600 | 25.600 | 1.349 |  |
| dispatch.prepare [static-install] | ms | cold | 44 | 0.300 | 1.300 | 2.100 | 2.100 | 0.466 |  |
| input.lateness | ms | warm | 976 | 0.267 | 52.433 | 126.200 | 144.700 | 5.767 | 0 of 1 |
| input.lateness | ms | cold | 325 | 0.233 | 1.000 | 1.267 | 2.267 | 0.238 | 0 of 1 |
| install.ack-roundtrip | ms | warm | 228 | 0.500 | 4.400 | 30.600 | 90.600 | 2.018 | 1 of 1 |
| install.ack-roundtrip | ms | cold | 176 | 0.400 | 1.800 | 9.500 | 10.400 | 0.715 | 1 of 1 |
| install.ack-roundtrip [static-install] | ms | warm | 228 | 0.500 | 4.400 | 30.600 | 90.600 | 2.018 |  |
| install.ack-roundtrip [static-install] | ms | cold | 176 | 0.400 | 1.800 | 9.500 | 10.400 | 0.715 |  |
| install.post | ms | warm | 228 | 0.100 | 0.700 | 5.700 | 10.000 | 0.323 | 1 of 1 |
| install.post | ms | cold | 176 | 0.100 | 0.300 | 0.600 | 0.900 | 0.093 | 1 of 1 |
| install.post [static-install] | ms | warm | 228 | 0.100 | 0.700 | 5.700 | 10.000 | 0.323 |  |
| install.post [static-install] | ms | cold | 176 | 0.100 | 0.300 | 0.600 | 0.900 | 0.093 |  |
| install.worker-deserialize | ms | warm | 228 | 0.200 | 1.000 | 8.700 | 15.000 | 0.480 | 1 of 1 |
| install.worker-deserialize | ms | cold | 176 | 0.100 | 0.500 | 0.600 | 1.500 | 0.165 | 1 of 1 |
| install.worker-deserialize [static-install] | ms | warm | 228 | 0.200 | 1.000 | 8.700 | 15.000 | 0.480 |  |
| install.worker-deserialize [static-install] | ms | cold | 176 | 0.100 | 0.500 | 0.600 | 1.500 | 0.165 |  |
| job.phase-residual | ms | warm | 122 | 0.000 | 0.200 | 0.400 | 2.400 | 0.051 | 1 of 1 |
| job.phase-residual | ms | cold | 95 | 0.000 | 0.100 | 0.500 | 0.500 | 0.032 | 1 of 1 |
| job.phase-residual [pose-only] | ms | warm | 68 | 0.000 | 0.100 | 2.400 | 2.400 | 0.060 |  |
| job.phase-residual [pose-only] | ms | cold | 53 | 0.000 | 0.100 | 0.200 | 0.200 | 0.023 |  |
| job.phase-residual [static-install] | ms | warm | 54 | 0.000 | 0.200 | 0.400 | 0.400 | 0.039 |  |
| job.phase-residual [static-install] | ms | cold | 42 | 0.000 | 0.200 | 0.500 | 0.500 | 0.043 |  |
| job.submit-to-accepted | ms | warm | 160 | 18.800 | 28.500 | 196.400 | 200.300 | 22.486 | 1 of 1 |
| job.submit-to-accepted | ms | cold | 52 | 18.000 | 29.500 | 31.600 | 31.600 | 18.835 | 1 of 1 |
| job.submit-to-accepted [pose-only] | ms | warm | 85 | 18.700 | 28.500 | 196.400 | 196.400 | 22.138 |  |
| job.submit-to-accepted [pose-only] | ms | cold | 27 | 18.000 | 24.500 | 24.500 | 24.500 | 18.170 |  |
| job.submit-to-accepted [static-install] | ms | warm | 75 | 19.800 | 30.700 | 200.300 | 200.300 | 22.880 |  |
| job.submit-to-accepted [static-install] | ms | cold | 25 | 19.200 | 30.100 | 31.600 | 31.600 | 19.552 |  |
| merge.assemble | ms | warm | 122 | 0.000 | 0.100 | 0.900 | 1.700 | 0.032 | 1 of 1 |
| merge.assemble | ms | cold | 97 | 0.000 | 0.100 | 0.300 | 0.300 | 0.011 | 1 of 1 |
| merge.assemble [pose-only] | ms | warm | 68 | 0.000 | 0.100 | 0.900 | 0.900 | 0.025 |  |
| merge.assemble [pose-only] | ms | cold | 54 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| merge.assemble [static-install] | ms | warm | 54 | 0.000 | 0.100 | 1.700 | 1.700 | 0.041 |  |
| merge.assemble [static-install] | ms | cold | 43 | 0.000 | 0.100 | 0.300 | 0.300 | 0.014 |  |
| merge.reply-deserialize | ms | warm | 508 | 0.000 | 0.200 | 0.500 | 5.400 | 0.048 | 1 of 1 |
| merge.reply-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.100 | 0.300 | 0.016 | 1 of 1 |
| merge.reply-deserialize [pose-only] | ms | warm | 280 | 0.000 | 0.200 | 0.700 | 5.400 | 0.051 |  |
| merge.reply-deserialize [pose-only] | ms | cold | 224 | 0.000 | 0.100 | 0.100 | 0.300 | 0.018 |  |
| merge.reply-deserialize [static-install] | ms | warm | 228 | 0.000 | 0.200 | 0.400 | 2.400 | 0.044 |  |
| merge.reply-deserialize [static-install] | ms | cold | 176 | 0.000 | 0.100 | 0.100 | 0.200 | 0.013 |  |
| merge.validate | ms | warm | 508 | 0.200 | 1.400 | 21.000 | 35.700 | 0.790 | 1 of 1 |
| merge.validate | ms | cold | 400 | 0.200 | 0.800 | 1.600 | 2.600 | 0.258 | 1 of 1 |
| merge.validate [pose-only] | ms | warm | 280 | 0.200 | 1.400 | 22.500 | 35.700 | 0.792 |  |
| merge.validate [pose-only] | ms | cold | 224 | 0.200 | 0.700 | 1.300 | 1.700 | 0.225 |  |
| merge.validate [static-install] | ms | warm | 228 | 0.200 | 1.300 | 19.800 | 27.000 | 0.787 |  |
| merge.validate [static-install] | ms | cold | 176 | 0.200 | 1.000 | 1.700 | 2.600 | 0.299 |  |
| pool.compute-metric | ms | warm | 169 | 1.500 | 10.800 | 131.700 | 155.100 | 5.610 | 1 of 1 |
| pool.compute-metric | ms | cold | 56 | 1.900 | 8.900 | 10.400 | 10.400 | 2.848 | 1 of 1 |
| pool.compute-metric [pose-only] | ms | warm | 94 | 1.200 | 7.200 | 129.900 | 129.900 | 4.576 |  |
| pool.compute-metric [pose-only] | ms | cold | 31 | 1.800 | 6.100 | 8.900 | 8.900 | 2.265 |  |
| pool.compute-metric [static-install] | ms | warm | 75 | 2.000 | 12.600 | 155.100 | 155.100 | 6.907 |  |
| pool.compute-metric [static-install] | ms | cold | 25 | 2.600 | 9.000 | 10.400 | 10.400 | 3.572 |  |
| pool.shard-max | ms | warm | 169 | 0.400 | 2.800 | 33.400 | 45.500 | 1.386 | 1 of 1 |
| pool.shard-max | ms | cold | 56 | 0.700 | 3.000 | 4.500 | 4.500 | 1.064 | 1 of 1 |
| pool.shard-max [pose-only] | ms | warm | 94 | 0.300 | 3.100 | 45.500 | 45.500 | 1.437 |  |
| pool.shard-max [pose-only] | ms | cold | 31 | 0.700 | 3.400 | 4.500 | 4.500 | 0.945 |  |
| pool.shard-max [static-install] | ms | warm | 75 | 0.400 | 2.400 | 27.500 | 27.500 | 1.323 |  |
| pool.shard-max [static-install] | ms | cold | 25 | 0.900 | 2.700 | 3.000 | 3.000 | 1.212 |  |
| pool.shard-total | ms | warm | 169 | 1.000 | 6.700 | 103.600 | 116.900 | 3.789 | 1 of 1 |
| pool.shard-total | ms | cold | 56 | 1.900 | 9.200 | 10.700 | 10.700 | 2.821 | 1 of 1 |
| pool.shard-total [pose-only] | ms | warm | 94 | 1.000 | 6.700 | 116.900 | 116.900 | 3.833 |  |
| pool.shard-total [pose-only] | ms | cold | 31 | 1.600 | 7.800 | 10.600 | 10.600 | 2.410 |  |
| pool.shard-total [static-install] | ms | warm | 75 | 1.100 | 7.700 | 79.600 | 79.600 | 3.733 |  |
| pool.shard-total [static-install] | ms | cold | 25 | 2.300 | 9.200 | 10.700 | 10.700 | 3.332 |  |
| pose.age-at-accept | ms | warm | 160 | 16.200 | 18.100 | 116.100 | 175.100 | 13.137 | 1 of 1 |
| pose.age-at-accept | ms | cold | 52 | 16.000 | 18.000 | 18.600 | 18.600 | 10.913 | 1 of 1 |
| pose.age-at-accept [pose-only] | ms | warm | 85 | 16.200 | 17.600 | 116.100 | 116.100 | 12.715 |  |
| pose.age-at-accept [pose-only] | ms | cold | 27 | 15.800 | 18.000 | 18.300 | 18.300 | 11.119 |  |
| pose.age-at-accept [static-install] | ms | warm | 75 | 16.100 | 18.700 | 175.100 | 175.100 | 13.615 |  |
| pose.age-at-accept [static-install] | ms | cold | 25 | 16.300 | 17.600 | 18.600 | 18.600 | 10.692 |  |
| pose.latest-wait | ms | warm | 976 | 56.500 | 151.300 | 250.200 | 350.500 | 63.300 | 0 of 1 |
| pose.latest-wait | ms | cold | 325 | 58.200 | 131.100 | 177.700 | 184.500 | 62.179 | 0 of 1 |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | warm | 976 | 56.500 | 151.300 | 250.200 | 350.500 | 63.300 |  |
| pose.latest-wait incl. 0 censored (lower bounds) | ms | cold | 325 | 58.200 | 131.100 | 177.700 | 184.500 | 62.179 |  |
| queue.client | ms | warm | 863 | 7.200 | 8.300 | 9.500 | 61.000 | 7.147 | 0 of 1 |
| queue.client | ms | cold | 301 | 7.600 | 8.500 | 9.000 | 9.900 | 7.547 | 0 of 1 |
| queue.rate-limit | ms | warm | 127 | 8.333 | 15.533 | 16.933 | 35.233 | 8.198 | 1 of 1 |
| queue.rate-limit | ms | cold | 100 | 8.333 | 15.533 | 16.333 | 16.533 | 8.408 | 1 of 1 |
| queue.rate-limit [pose-only] | ms | warm | 70 | 8.433 | 15.633 | 35.233 | 35.233 | 8.441 |  |
| queue.rate-limit [pose-only] | ms | cold | 56 | 8.033 | 15.733 | 16.533 | 16.533 | 8.643 |  |
| queue.rate-limit [static-install] | ms | warm | 57 | 8.233 | 15.433 | 16.833 | 16.833 | 7.899 |  |
| queue.rate-limit [static-install] | ms | cold | 44 | 8.733 | 15.533 | 16.133 | 16.133 | 8.109 |  |
| queue.timer-lateness | ms | warm | 127 | 0.267 | 1.667 | 4.500 | 6.600 | 0.378 | 1 of 1 |
| queue.timer-lateness | ms | cold | 100 | 0.067 | 0.867 | 1.267 | 1.267 | 0.115 | 1 of 1 |
| queue.timer-lateness [pose-only] | ms | warm | 70 | 0.167 | 1.467 | 4.500 | 4.500 | 0.271 |  |
| queue.timer-lateness [pose-only] | ms | cold | 56 | 0.167 | 0.867 | 1.267 | 1.267 | 0.114 |  |
| queue.timer-lateness [static-install] | ms | warm | 57 | 0.367 | 2.267 | 6.600 | 6.600 | 0.509 |  |
| queue.timer-lateness [static-install] | ms | cold | 44 | 0.067 | 0.867 | 1.267 | 1.267 | 0.116 |  |
| queue.wait | ms | warm | 127 | 16.100 | 23.800 | 25.700 | 43.400 | 15.505 | 1 of 1 |
| queue.wait | ms | cold | 100 | 16.000 | 24.000 | 24.600 | 25.000 | 15.934 | 1 of 1 |
| queue.wait [pose-only] | ms | warm | 70 | 16.400 | 23.600 | 43.400 | 43.400 | 15.963 |  |
| queue.wait [pose-only] | ms | cold | 56 | 15.800 | 24.000 | 25.000 | 25.000 | 16.338 |  |
| queue.wait [static-install] | ms | warm | 57 | 15.700 | 23.800 | 25.700 | 25.700 | 14.942 |  |
| queue.wait [static-install] | ms | cold | 44 | 16.400 | 24.100 | 24.600 | 24.600 | 15.420 |  |
| shard.compute | ms | warm | 508 | 0.300 | 2.200 | 24.100 | 45.500 | 1.172 | 1 of 1 |
| shard.compute | ms | cold | 400 | 0.300 | 2.200 | 4.400 | 5.200 | 0.578 | 1 of 1 |
| shard.compute [pose-only] | ms | warm | 280 | 0.300 | 2.800 | 33.400 | 45.500 | 1.207 |  |
| shard.compute [pose-only] | ms | cold | 224 | 0.300 | 1.500 | 3.300 | 4.500 | 0.473 |  |
| shard.compute [static-install] | ms | warm | 228 | 0.300 | 2.000 | 20.800 | 27.500 | 1.129 |  |
| shard.compute [static-install] | ms | cold | 176 | 0.400 | 2.600 | 5.000 | 5.200 | 0.713 |  |
| shard.post | ms | warm | 508 | 0.000 | 0.200 | 0.900 | 2.700 | 0.053 | 1 of 1 |
| shard.post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.200 | 0.015 | 1 of 1 |
| shard.post [pose-only] | ms | warm | 280 | 0.000 | 0.200 | 2.100 | 2.700 | 0.067 |  |
| shard.post [pose-only] | ms | cold | 224 | 0.000 | 0.100 | 0.200 | 0.200 | 0.020 |  |
| shard.post [static-install] | ms | warm | 228 | 0.000 | 0.100 | 0.400 | 1.300 | 0.036 |  |
| shard.post [static-install] | ms | cold | 176 | 0.000 | 0.100 | 0.100 | 0.100 | 0.009 |  |
| shard.reply-post | ms | warm | 508 | 0.000 | 0.300 | 1.800 | 9.200 | 0.110 | 1 of 1 |
| shard.reply-post | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.035 | 1 of 1 |
| shard.reply-post [pose-only] | ms | warm | 280 | 0.000 | 0.200 | 1.800 | 9.200 | 0.107 |  |
| shard.reply-post [pose-only] | ms | cold | 224 | 0.000 | 0.100 | 0.200 | 0.300 | 0.033 |  |
| shard.reply-post [static-install] | ms | warm | 228 | 0.000 | 0.300 | 2.200 | 4.700 | 0.113 |  |
| shard.reply-post [static-install] | ms | cold | 176 | 0.000 | 0.200 | 0.300 | 0.300 | 0.038 |  |
| shard.roundtrip | ms | warm | 508 | 0.700 | 6.700 | 74.100 | 109.300 | 3.253 | 1 of 1 |
| shard.roundtrip | ms | cold | 400 | 0.800 | 3.600 | 6.800 | 17.400 | 1.254 | 1 of 1 |
| shard.roundtrip [pose-only] | ms | warm | 280 | 0.600 | 6.700 | 83.300 | 109.300 | 2.833 |  |
| shard.roundtrip [pose-only] | ms | cold | 224 | 0.700 | 3.200 | 5.300 | 6.700 | 0.967 |  |
| shard.roundtrip [static-install] | ms | warm | 228 | 0.900 | 6.700 | 74.100 | 101.700 | 3.768 |  |
| shard.roundtrip [static-install] | ms | cold | 176 | 0.900 | 4.700 | 16.000 | 17.400 | 1.620 |  |
| shard.transport | ms | warm | 508 | 0.400 | 4.200 | 48.500 | 78.000 | 1.908 | 1 of 1 |
| shard.transport | ms | cold | 400 | 0.400 | 1.600 | 3.900 | 12.500 | 0.617 | 1 of 1 |
| shard.transport [pose-only] | ms | warm | 280 | 0.300 | 2.200 | 48.500 | 63.100 | 1.445 |  |
| shard.transport [pose-only] | ms | cold | 224 | 0.300 | 1.300 | 2.400 | 3.100 | 0.434 |  |
| shard.transport [static-install] | ms | warm | 228 | 0.500 | 4.600 | 52.100 | 78.000 | 2.476 |  |
| shard.transport [static-install] | ms | cold | 176 | 0.500 | 2.200 | 10.800 | 12.500 | 0.851 |  |
| shard.worker-deserialize | ms | warm | 508 | 0.000 | 0.200 | 1.100 | 6.100 | 0.063 | 1 of 1 |
| shard.worker-deserialize | ms | cold | 400 | 0.000 | 0.100 | 0.200 | 0.300 | 0.023 | 1 of 1 |
| shard.worker-deserialize [pose-only] | ms | warm | 280 | 0.000 | 0.200 | 1.600 | 6.100 | 0.074 |  |
| shard.worker-deserialize [pose-only] | ms | cold | 224 | 0.000 | 0.100 | 0.200 | 0.300 | 0.027 |  |
| shard.worker-deserialize [static-install] | ms | warm | 228 | 0.000 | 0.200 | 1.100 | 1.400 | 0.050 |  |
| shard.worker-deserialize [static-install] | ms | cold | 176 | 0.000 | 0.100 | 0.200 | 0.200 | 0.019 |  |

## Parity per path

| case | path | status | steps | bit-exact | differing leaves | leaves compared | rule violations |
| --- | --- | --- | --- | --- | --- | ---: | ---: |
| TC01_LISTENER_TAPE_SEEDED | browser-pool TS-W (real pools) | passed | 64 of 64 | false | 29 | 7145 | 0 |
| TC01_LISTENER_TAPE_SEEDED | browser-pool production fallback | passed | 64 of 64 | false | 29 | 7145 | 0 |
| TC01_LISTENER_TAPE_SEEDED | browser-pool serial | passed | 64 of 64 | false | 29 | 7145 | 0 |
| TC01_LISTENER_TAPE_SEEDED | node-core serial | passed | 64 of 64 | true | 0 | 7145 | 0 |
| TC02_STATIC_EDIT_TAPE | browser-pool TS-W (real pools) | passed | 24 of 24 | false | 19 | 2357 | 0 |
| TC02_STATIC_EDIT_TAPE | browser-pool production fallback | passed | 24 of 24 | false | 19 | 2357 | 0 |
| TC02_STATIC_EDIT_TAPE | browser-pool serial | passed | 24 of 24 | false | 19 | 2357 | 0 |
| TC02_STATIC_EDIT_TAPE | node-core serial | passed | 24 of 24 | true | 0 | 2357 | 0 |
| TH01_LISTENER_TAPE_SEEDED | browser-pool TS-W (real pools) | passed | 64 of 64 | false | 21 | 10472 | 0 |
| TH01_LISTENER_TAPE_SEEDED | browser-pool production fallback | passed | 64 of 64 | false | 21 | 10472 | 0 |
| TH01_LISTENER_TAPE_SEEDED | browser-pool serial | passed | 64 of 64 | false | 21 | 10472 | 0 |
| TH01_LISTENER_TAPE_SEEDED | node-core serial | passed | 64 of 64 | true | 0 | 10472 | 0 |
| TH02_STATIC_EDIT_TAPE | browser-pool TS-W (real pools) | passed | 24 of 24 | false | 4 | 3443 | 0 |
| TH02_STATIC_EDIT_TAPE | browser-pool production fallback | passed | 24 of 24 | false | 4 | 3443 | 0 |
| TH02_STATIC_EDIT_TAPE | browser-pool serial | passed | 24 of 24 | false | 4 | 3443 | 0 |
| TH02_STATIC_EDIT_TAPE | node-core serial | passed | 24 of 24 | true | 0 | 3443 | 0 |

Bit-exact false with zero rule violations means every difference is inside the comparison rules but the bytes are not identical.

## Paired TS-S and TS-W differences

### TC01_LISTENER_TAPE_SEEDED pass=clean boundary=browser-pool order=108 (TS-S r1-s-tc01, TS-W r1-w-tc01)

| phase | temperature | N TS-S | N TS-W | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| job.total (TS-S) against pool.compute-metric (TS-W) | warm | 1052 | 1052 | 0.300 | 1.200 | 5.700 |
| job.total (TS-S) against pool.compute-metric (TS-W) | cold | 100 | 100 | 0.200 | -0.100 | 0.100 |

### TC02_STATIC_EDIT_TAPE pass=clean boundary=browser-pool order=109 (TS-S r1-s-tc02, TS-W r1-w-tc02)

| phase | temperature | N TS-S | N TS-W | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| job.total (TS-S) against pool.compute-metric (TS-W) | warm | 1004 | 1004 | 0.300 | 0.500 | 1.200 |
| job.total (TS-S) against pool.compute-metric (TS-W) | cold | 100 | 100 | 0.200 | 1.200 | 7.900 |

### TH01_LISTENER_TAPE_SEEDED pass=clean boundary=browser-pool order=110 (TS-S r1-s-th01, TS-W r1-w-th01)

| phase | temperature | N TS-S | N TS-W | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| job.total (TS-S) against pool.compute-metric (TS-W) | warm | 1052 | 1052 | 0.200 | 0.400 | 1.800 |
| job.total (TS-S) against pool.compute-metric (TS-W) | cold | 100 | 100 | 0.200 | -0.800 | -5.500 |

### TH02_STATIC_EDIT_TAPE pass=clean boundary=browser-pool order=111 (TS-S r1-s-th02, TS-W r1-w-th02)

| phase | temperature | N TS-S | N TS-W | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| job.total (TS-S) against pool.compute-metric (TS-W) | warm | 1004 | 1004 | 0.100 | 0.400 | 5.400 |
| job.total (TS-S) against pool.compute-metric (TS-W) | cold | 100 | 100 | 0.400 | 2.500 | 19.100 |

### W01_H100_POSE_60HZ_60S pass=clean boundary=browser-pool order=112 (TS-S r1-s-w01, TS-W r1-w-w01)

| phase | temperature | N TS-S | N TS-W | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 624 | 622 | -0.300 | 3.700 | 16.700 |
| pool.compute-metric | cold | 57 | 58 | -1.100 | -3.900 | -30.900 |
| job.submit-to-accepted | warm | 624 | 622 | -0.100 | 3.400 | 26.200 |
| job.submit-to-accepted | cold | 57 | 58 | -1.200 | -4.900 | -43.400 |

### W02_H100_STATIC_5HZ_30S pass=clean boundary=browser-pool order=113 (TS-S r1-s-w02, TS-W r1-w-w02)

| phase | temperature | N TS-S | N TS-W | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 288 | 233 | 7.400 | 17.600 | 30.700 |
| pool.compute-metric | cold | 58 | 48 | 3.500 | 13.100 | 98.600 |
| job.submit-to-accepted | warm | 288 | 233 | 7.000 | 18.500 | 32.900 |
| job.submit-to-accepted | cold | 58 | 48 | 4.200 | 11.900 | 198.700 |

### W03_C100_POSE_60HZ_60S pass=clean boundary=browser-pool order=114 (TS-S r1-s-w03, TS-W r1-w-w03)

| phase | temperature | N TS-S | N TS-W | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 552 | 646 | -1.900 | -2.400 | 2.600 |
| pool.compute-metric | cold | 50 | 59 | -0.700 | -0.700 | -14.800 |
| job.submit-to-accepted | warm | 552 | 646 | 15.200 | 22.300 | 22.100 |
| job.submit-to-accepted | cold | 50 | 59 | 12.700 | 16.700 | -11.600 |

### W04_C100_STATIC_5HZ_30S pass=clean boundary=browser-pool order=115 (TS-S r1-s-w04, TS-W r1-w-w04)

| phase | temperature | N TS-S | N TS-W | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 252 | 290 | -1.900 | -2.700 | -2.300 |
| pool.compute-metric | cold | 51 | 58 | -1.000 | -1.700 | 7.300 |
| job.submit-to-accepted | warm | 252 | 275 | 12.100 | 17.200 | 14.200 |
| job.submit-to-accepted | cold | 51 | 53 | 11.600 | 17.200 | 15.200 |

## Pass overhead

### traced minus clean: {"variant":"TS-S","case":"APP_H100_SWITCH","boundary":"browser-app","workers":"not-applicable","audio":"on","build":"prod","driver":"poll","browserChannel":"default","viewport":"default","browserArgs":[]}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| app.worker-compute-metric | cold | 200 | 200 | -1.000 | -1.000 | 3.000 |
| app.input-to-commit | cold | 200 | 200 | -3.300 | 28.500 | 75.300 |

### traced minus clean: {"variant":"TS-S","case":"TC01_LISTENER_TAPE_SEEDED","boundary":"browser-pool","workers":"not-applicable","audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |

### traced minus clean: {"variant":"TS-S","case":"TH01_LISTENER_TAPE_SEEDED","boundary":"node-core","workers":"not-applicable","audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"not-applicable","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |

### traced minus clean: {"variant":"TS-S","case":"TH01_LISTENER_TAPE_SEEDED","boundary":"browser-pool","workers":"not-applicable","audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |

### traced minus clean: {"variant":"TS-W","case":"APP_C_DRAG","boundary":"browser-app","workers":2,"audio":"on","build":"prod","driver":"poll","browserChannel":"default","viewport":"default","browserArgs":[]}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| app.worker-compute-metric | warm | 5 | 17 | 0.000 | -17.000 | -17.000 |
| app.worker-compute-metric | cold | 100 | 100 | 0.000 | 1.000 | 45.000 |
| app.input-to-commit | warm | 1 | 1 | -42.800 | -42.800 | -42.800 |

### traced minus clean: {"variant":"TS-W","case":"APP_H100_SWITCH","boundary":"browser-app","workers":"not-applicable","audio":"on","build":"prod","driver":"poll","browserChannel":"default","viewport":"default","browserArgs":[]}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| app.worker-compute-metric | warm | 200 | 900 | 0.000 | 2.000 | 35.000 |
| app.worker-compute-metric | cold | 200 | 100 | 0.000 | 2.000 | 60.000 |
| app.input-to-commit | warm | 200 | 900 | 0.700 | 52.400 | 153.000 |
| app.input-to-commit | cold | 200 | 100 | 2.900 | 72.000 | 149.000 |

### traced minus clean: {"variant":"TS-W","case":"APP_H100_SWITCH","boundary":"browser-app","workers":4,"audio":"on","build":"prod","driver":"poll","browserChannel":"chromium","viewport":"default","browserArgs":["--use-angle=d3d11","--enable-gpu-rasterization","--ignore-gpu-blocklist"]}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| app.worker-compute-metric | cold | 100 | 200 | 0.000 | 1.000 | 56.000 |
| app.input-to-commit | cold | 100 | 200 | -6.100 | -3.000 | 65.600 |

### traced minus clean: {"variant":"TS-W","case":"APP_H100_SWITCH","boundary":"browser-app","workers":4,"audio":"on","build":"prod","driver":"poll","browserChannel":"chromium","viewport":"default","browserArgs":[]}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| app.worker-compute-metric | cold | 100 | 200 | 0.000 | 1.000 | 46.000 |
| app.input-to-commit | cold | 100 | 200 | -3.200 | -12.500 | 49.600 |

### traced minus clean: {"variant":"TS-W","case":"APP_H100_SWITCH","boundary":"browser-app","workers":4,"audio":"on","build":"prod","driver":"poll","browserChannel":"default","viewport":"1920x1080","browserArgs":[]}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| app.worker-compute-metric | cold | 100 | 200 | -1.000 | 0.000 | -105.000 |
| app.input-to-commit | cold | 100 | 200 | -0.900 | -70.200 | -199.000 |

### traced minus clean: {"variant":"TS-W","case":"APP_H100_SWITCH","boundary":"browser-app","workers":4,"audio":"on","build":"prod","driver":"poll","browserChannel":"default","viewport":"default","browserArgs":[]}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| app.worker-compute-metric | cold | 200 | 300 | 0.000 | 0.000 | 1.000 |
| app.input-to-commit | cold | 200 | 300 | -4.400 | -15.600 | -66.400 |

### traced minus clean: {"variant":"TS-W","case":"TC01_LISTENER_TAPE_SEEDED","boundary":"browser-pool","workers":2,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 92 | 1052 | -0.100 | 0.700 | 30.000 |
| pool.compute-metric | cold | 100 | 100 | 0.000 | 5.800 | 47.600 |
| job.submit-to-accepted | warm | 92 | 1052 | -8.900 | -9.400 | 18.600 |
| job.submit-to-accepted | cold | 100 | 100 | -8.900 | -5.100 | 26.500 |

### clean minus bare: {"variant":"TS-W","case":"TC01_LISTENER_TAPE_SEEDED","boundary":"browser-pool","workers":2,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 1052 | 1052 | 0.100 | 0.500 | 1.500 |
| pool.compute-metric | cold | 100 | 100 | -0.100 | -0.700 | -1.200 |
| job.submit-to-accepted | warm | 1052 | 1052 | 0.100 | 0.200 | 1.500 |
| job.submit-to-accepted | cold | 100 | 100 | -0.100 | 0.400 | 2.300 |

### traced minus clean: {"variant":"TS-W","case":"TC02_STATIC_EDIT_TAPE","boundary":"browser-pool","workers":2,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 44 | 1004 | -0.100 | 0.000 | -0.300 |
| pool.compute-metric | cold | 100 | 100 | -0.100 | -0.200 | -7.700 |
| job.submit-to-accepted | warm | 44 | 1004 | -8.800 | -10.200 | -12.300 |
| job.submit-to-accepted | cold | 100 | 100 | -8.700 | -10.300 | -13.700 |

### traced minus clean: {"variant":"TS-W","case":"TH01_LISTENER_TAPE_SEEDED","boundary":"browser-pool","workers":2,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 92 | 1052 | 0.000 | 2.500 | 2.300 |
| pool.compute-metric | cold | 100 | 100 | 0.000 | 1.600 | 2.400 |
| job.submit-to-accepted | warm | 92 | 1052 | -9.300 | -7.400 | -7.200 |
| job.submit-to-accepted | cold | 100 | 100 | -9.100 | -9.400 | -9.200 |

### clean minus bare: {"variant":"TS-W","case":"TH01_LISTENER_TAPE_SEEDED","boundary":"browser-pool","workers":2,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 1052 | 1052 | -0.100 | -0.000 | 0.400 |
| pool.compute-metric | cold | 100 | 100 | -0.200 | -1.300 | -8.100 |
| job.submit-to-accepted | warm | 1052 | 1052 | 0.100 | 0.300 | -0.100 |
| job.submit-to-accepted | cold | 100 | 100 | 0.200 | -0.000 | -0.600 |

### traced minus clean: {"variant":"TS-W","case":"TH02_STATIC_EDIT_TAPE","boundary":"browser-pool","workers":2,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 44 | 1004 | -0.300 | -2.200 | -7.600 |
| pool.compute-metric | cold | 100 | 100 | -0.500 | -2.000 | -16.600 |
| job.submit-to-accepted | warm | 44 | 1004 | -9.200 | -11.300 | -14.900 |
| job.submit-to-accepted | cold | 100 | 100 | -8.700 | -9.900 | -23.400 |

### traced minus clean: {"variant":"TS-W","case":"W01_H100_POSE_60HZ_60S","boundary":"browser-pool","workers":4,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 173 | 1871 | -1.000 | -1.700 | -24.400 |
| pool.compute-metric | cold | 59 | 171 | -0.900 | -4.400 | -8.100 |
| job.submit-to-accepted | warm | 173 | 1871 | -1.800 | -2.400 | 2.200 |
| job.submit-to-accepted | cold | 59 | 171 | -1.400 | -6.100 | -22.100 |

### clean minus bare: {"variant":"TS-W","case":"W01_H100_POSE_60HZ_60S","boundary":"browser-pool","workers":4,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 1871 | 631 | 0.400 | 1.600 | 23.400 |
| pool.compute-metric | cold | 171 | 58 | 0.600 | 3.800 | 10.400 |
| job.submit-to-accepted | warm | 1871 | 631 | 0.300 | 1.500 | 40.800 |
| job.submit-to-accepted | cold | 171 | 58 | 1.200 | 5.500 | 33.400 |

### traced minus clean: {"variant":"TS-W","case":"W02_H100_STATIC_5HZ_30S","boundary":"browser-pool","workers":4,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 153 | 481 | -3.700 | 7.700 | 85.200 |
| pool.compute-metric | cold | 51 | 100 | 0.400 | -5.600 | 1.900 |
| job.submit-to-accepted | warm | 153 | 481 | -4.900 | 19.300 | 172.700 |
| job.submit-to-accepted | cold | 51 | 100 | -0.200 | -5.500 | -5.400 |

### traced minus clean: {"variant":"TS-W","case":"W03_C100_POSE_60HZ_60S","boundary":"browser-pool","workers":4,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 175 | 1288 | -0.100 | 5.000 | 59.500 |
| pool.compute-metric | cold | 56 | 117 | 0.100 | 35.100 | 36.400 |
| job.submit-to-accepted | warm | 175 | 1288 | -1.400 | 0.600 | 64.800 |
| job.submit-to-accepted | cold | 56 | 117 | -0.800 | 27.300 | 62.000 |

### traced minus clean: {"variant":"TS-W","case":"W04_C100_STATIC_5HZ_30S","boundary":"browser-pool","workers":4,"audio":"not-applicable","build":"not-applicable","driver":"not-applicable","browserChannel":"default","viewport":"not-applicable","browserArgs":"not-applicable"}

| phase | temperature | N higher | N lower | p50 diff | p95 diff | p99 diff |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| pool.compute-metric | warm | 169 | 579 | -0.100 | 7.200 | 120.200 |
| pool.compute-metric | cold | 56 | 115 | 0.100 | 3.400 | 0.700 |
| job.submit-to-accepted | warm | 160 | 559 | 1.300 | 0.700 | 162.600 |
| job.submit-to-accepted | cold | 52 | 110 | 0.700 | 0.700 | 1.300 |


## Rederived runs

These runs were rebuilt from their kept raw files with rederive; nothing was re-measured. The original status and error are in each run-status.json.

- r1-app-w-audioon: passed, 33088 samples (rederived 2026-11-06T14:58:53.682Z)
- r1-app-w-audiooff: passed, 29025 samples (rederived 2026-11-06T14:58:53.983Z)
- r1-traced-app-w-1: passed, 6651 samples (rederived 2026-11-06T14:59:07.337Z)
- r1-traced-app-w-2: passed, 6652 samples (rederived 2026-11-06T14:59:14.599Z)
- r1-alloc-app-w: passed, 6613 samples (rederived 2026-11-06T14:58:54.400Z)
- r1-app-w-audiooff-immediate: passed, 14542 samples (rederived 2026-11-06T14:58:54.662Z)
