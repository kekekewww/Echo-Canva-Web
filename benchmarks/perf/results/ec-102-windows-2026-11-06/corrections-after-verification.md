# Corrections after the first independent verification

The first independent verification of EC-102 at `63a50c6` returned NOT_VERIFIED (`verification/63a50c6-not-verified-report.md`). The harness faults it found were fixed in harness commit `08f8227`: open-loop warm labels counted input events instead of jobs, merge samples were lost on timestamp ties, and per-worker trace summaries overwrote same-named threads. Nothing was re-measured. All pool runs were re-derived from the kept raw logs with `rederive`.

Each value below comes from the run's `summary.json` before and after `rederive`. Format: `N p50/p95/p99/max` in ms. Some rows are listed with identical before and after values. No threshold is involved.

| run | phase | before (N p50/p95/p99/max) | after |
| --- | --- | --- | --- |
| r1-w-w01 | pool.compute-metric [pose-only] | N622 1.9/10.9/40.0/60.2 | N580 1.9/11.5/40.7/60.2 |
| r1-w-w01 | shard.compute [pose-only] | N2320 0.8/3.0/14.7/22.7 | N2320 0.8/3.0/14.7/22.7 |
| r1-w-w01 | shard.transport [pose-only] | N2320 0.3/5.6/21.9/38.7 | N2320 0.3/5.6/21.9/38.7 |
| r1-w-w01 | merge.validate [pose-only] | N2320 0.1/0.6/2.1/7.2 | N2320 0.1/0.5/2.1/7.2 |
| r1-w-w01 | job.submit-to-accepted [pose-only] | N622 13.4/25.1/79.3/97.8 | N580 13.4/26.3/80.1/97.8 |
| r2-w-w01 | pool.compute-metric [pose-only] | N628 2.3/5.5/7.6/19.1 | N585 2.3/5.4/11.3/19.1 |
| r2-w-w01 | shard.compute [pose-only] | N2340 1.5/2.0/2.9/6.5 | N2340 1.5/2.0/2.9/6.5 |
| r2-w-w01 | shard.transport [pose-only] | N2340 0.2/3.0/4.8/11.3 | N2340 0.2/3.0/4.8/11.3 |
| r2-w-w01 | merge.validate [pose-only] | N2340 0.1/0.4/0.7/1.9 | N2340 0.1/0.4/0.6/1.0 |
| r2-w-w01 | job.submit-to-accepted [pose-only] | N628 13.9/21.6/24.2/71.0 | N585 13.9/21.6/25.6/71.0 |
| r1-w-w03 | pool.compute-metric [pose-only] | N646 1.2/2.5/9.1/33.6 | N605 1.2/2.5/9.1/33.6 |
| r1-w-w03 | shard.compute [pose-only] | N2420 0.4/0.8/2.1/11.1 | N2420 0.4/0.8/2.1/11.1 |
| r1-w-w03 | shard.transport [pose-only] | N2420 0.2/0.6/1.6/14.7 | N2420 0.2/0.6/1.6/14.7 |
| r1-w-w03 | merge.validate [pose-only] | N2420 0.1/0.4/1.0/5.9 | N2420 0.1/0.4/1.0/5.9 |
| r1-w-w03 | job.submit-to-accepted [pose-only] | N646 18.4/27.3/29.5/57.5 | N605 18.5/27.4/29.5/57.5 |
| r2-w-w03 | pool.compute-metric [pose-only] | N642 1.7/3.7/15.0/33.5 | N600 1.7/3.5/15.0/33.5 |
| r2-w-w03 | shard.compute [pose-only] | N2400 0.6/1.1/2.3/17.1 | N2400 0.6/1.1/2.3/17.1 |
| r2-w-w03 | shard.transport [pose-only] | N2400 0.3/1.0/2.5/16.8 | N2400 0.3/1.0/2.5/16.8 |
| r2-w-w03 | merge.validate [pose-only] | N2400 0.1/0.6/1.5/6.4 | N2400 0.1/0.6/1.5/6.4 |
| r2-w-w03 | job.submit-to-accepted [pose-only] | N642 15.8/23.9/32.5/50.6 | N600 15.7/23.9/32.5/50.6 |
| r1-w-w01 | pose.latest-wait | N3300 48.6/91.7/121.2/173.8 | N3084 48.8/91.9/121.8/173.8 |
| r1-w-w01 | input.lateness | N3300 0.3/39.1/112.5/145.8 | N3084 0.3/45.6/117.4/145.8 |
| r2-w-w01 | pose.latest-wait | N3299 48.9/91.2/95.1/116.4 | N3074 48.9/91.3/95.1/116.4 |
| r2-w-w01 | input.lateness | N3299 0.2/1.5/2.0/21.1 | N3074 0.2/1.5/2.0/21.1 |
| r1-w-w03 | pose.latest-wait | N3299 52.8/91.0/95.6/139.4 | N3090 53.1/91.2/95.9/139.4 |
| r1-w-w03 | input.lateness | N3299 0.3/1.3/1.7/24.5 | N3090 0.4/1.3/1.7/24.5 |
| r2-w-w03 | pose.latest-wait | N3299 50.5/89.3/93.5/143.0 | N3085 50.5/89.3/93.5/143.0 |
| r2-w-w03 | input.lateness | N3299 0.3/1.3/1.8/19.4 | N3085 0.3/1.3/1.8/19.4 |
| r1-s-w01 | pose.latest-wait | N3299 48.9/87.9/95.7/157.7 | N3069 48.8/87.9/95.7/157.7 |
| r1-s-w01 | input.lateness | N3299 0.3/5.5/111.2/164.8 | N3069 0.3/5.0/105.3/164.8 |
| r2-s-w01 | pose.latest-wait | N3299 51.5/91.5/95.4/164.0 | N3064 51.5/91.5/95.5/164.0 |
| r2-s-w01 | input.lateness | N3299 0.4/5.4/99.7/182.2 | N3064 0.4/5.5/100.8/182.2 |
| r1-s-w03 | pose.latest-wait | N3299 42.3/87.1/88.5/93.3 | N3005 44.6/87.1/88.6/93.3 |
| r1-s-w03 | input.lateness | N3299 0.1/1.0/1.6/2.2 | N3005 0.2/1.0/1.6/2.2 |
| r2-s-w03 | pose.latest-wait | N3299 49.6/87.8/89.2/123.8 | N3008 49.7/87.8/89.2/123.8 |
| r2-s-w03 | input.lateness | N3299 0.2/1.3/1.9/24.2 | N3008 0.2/1.3/1.9/24.2 |
| r1-w-w01 | input.project | N3300 1.8/6.5/30.2/42.8 | N3084 1.9/6.8/30.6/42.8 |
| r2-w-w01 | input.project | N3299 3.0/4.0/7.1/16.9 | N3074 3.0/4.1/7.1/16.9 |
| r2-s-w01 | input.project | N3299 3.4/4.7/7.7/47.0 | N3064 3.4/4.8/7.8/47.0 |
| r1-s-w01 | pool.compute-metric | N624 2.2/7.2/23.3/58.2 | N581 2.2/7.2/22.5/58.2 |
| r1-s-w01 | job.submit-to-accepted | N624 13.5/21.7/53.1/100.3 | N581 13.5/21.6/53.1/100.3 |
| r2-s-w01 | pool.compute-metric | N607 4.5/6.6/12.1/54.3 | N563 4.5/6.7/15.4/54.3 |
| r2-s-w01 | job.submit-to-accepted | N607 15.6/21.8/40.0/90.5 | N563 15.6/21.8/45.4/90.5 |
| r1-s-w03 | pool.compute-metric | N552 3.1/4.9/6.5/10.0 | N502 3.2/5.0/6.5/10.0 |
| r1-s-w03 | job.submit-to-accepted | N552 3.2/5.0/7.4/36.1 | N502 3.3/5.1/7.4/36.1 |
| r2-s-w03 | pool.compute-metric | N551 3.7/5.3/7.5/37.1 | N502 3.7/5.3/7.5/37.1 |
| r2-s-w03 | job.submit-to-accepted | N551 3.8/5.5/9.0/38.2 | N502 3.7/5.4/9.0/38.2 |
| r1-s-w02 | pool.compute-metric | N288 1.8/4.3/7.1/8.6 | N246 1.8/4.0/5.4/6.1 |
| r1-s-w02 | job.submit-to-accepted | N288 12.5/19.1/21.1/89.2 | N246 12.3/19.1/21.1/89.2 |
| r2-s-w02 | pool.compute-metric | N276 4.7/6.1/7.0/9.4 | N233 4.7/6.1/7.0/9.4 |
| r2-s-w02 | job.submit-to-accepted | N276 15.9/21.8/23.4/99.1 | N233 15.7/21.5/23.2/99.1 |
| r1-s-w04 | pool.compute-metric | N252 3.3/5.9/14.4/21.6 | N203 3.3/6.3/14.4/21.6 |
| r1-s-w04 | job.submit-to-accepted | N252 3.3/6.3/18.5/77.0 | N203 3.4/7.2/18.5/77.0 |
| r2-s-w04 | pool.compute-metric | N250 4.0/5.6/6.0/20.9 | N201 3.9/5.4/5.9/20.9 |
| r2-s-w04 | job.submit-to-accepted | N250 4.0/5.7/6.0/20.9 | N201 3.9/5.5/5.9/20.9 |
| r1-w-w02 | pool.compute-metric [static-install] | N125 15.8/23.7/51.2/214.7 | N98 15.9/23.1/26.5/26.5 |
| r1-w-w02 | install.post [static-install] | N392 2.4/3.6/4.2/4.3 | N392 2.4/3.6/4.2/4.3 |
| r1-w-w02 | install.ack-roundtrip [static-install] | N392 8.4/14.8/17.6/19.3 | N392 8.4/14.8/17.6/19.3 |
| r1-w-w02 | shard.transport [static-install] | N392 5.5/10.3/12.4/15.0 | N392 5.5/10.3/12.4/15.0 |
| r1-w-w02 | job.submit-to-accepted [static-install] | N125 26.4/39.3/81.1/262.0 | N98 27.1/38.7/40.6/40.6 |
| r2-w-w02 | pool.compute-metric [static-install] | N125 20.4/24.0/43.9/53.1 | N101 20.6/24.0/43.9/53.1 |
| r2-w-w02 | install.post [static-install] | N404 3.3/3.8/7.0/9.1 | N404 3.3/3.8/7.0/9.1 |
| r2-w-w02 | install.ack-roundtrip [static-install] | N404 11.2/17.7/25.3/38.6 | N404 11.2/17.7/25.3/38.6 |
| r2-w-w02 | shard.transport [static-install] | N404 7.5/12.8/19.2/28.2 | N404 7.5/12.8/19.2/28.2 |
| r2-w-w02 | job.submit-to-accepted [static-install] | N125 34.8/40.1/80.6/81.9 | N101 34.8/40.0/80.6/81.9 |
| r1-w-w04 | pool.compute-metric [static-install] | N125 1.7/3.0/12.1/28.2 | N107 1.7/3.7/12.1/28.2 |
| r1-w-w04 | install.post [static-install] | N428 0.1/0.2/0.7/2.5 | N428 0.1/0.2/0.7/2.5 |
| r1-w-w04 | install.ack-roundtrip [static-install] | N428 0.3/0.9/2.2/10.3 | N428 0.3/0.9/2.2/10.3 |
| r1-w-w04 | shard.transport [static-install] | N428 0.3/1.0/4.5/9.4 | N428 0.3/1.0/4.5/9.4 |
| r1-w-w04 | job.submit-to-accepted [static-install] | N125 15.6/24.5/32.2/49.9 | N107 15.6/24.5/32.2/49.9 |
| r2-w-w04 | pool.compute-metric [static-install] | N125 2.2/4.4/10.5/11.5 | N107 2.1/4.4/8.4/11.5 |
| r2-w-w04 | install.post [static-install] | N428 0.1/0.3/0.5/0.6 | N428 0.1/0.3/0.5/0.6 |
| r2-w-w04 | install.ack-roundtrip [static-install] | N428 0.6/1.0/1.7/2.4 | N428 0.6/1.0/1.7/2.4 |
| r2-w-w04 | shard.transport [static-install] | N428 0.6/1.0/2.2/3.8 | N428 0.6/1.0/2.2/3.8 |
| r2-w-w04 | job.submit-to-accepted [static-install] | N125 19.0/29.7/33.8/34.3 | N107 18.9/29.7/33.8/34.3 |
| r2-hc3-w01 | pool.compute-metric [pose-only] | N591 6.1/12.6/87.2/98.3 | N547 6.0/12.9/87.2/98.3 |
| r2-hc3-w01 | shard.compute [pose-only] | N547 4.9/9.5/53.9/70.5 | N547 4.9/9.5/53.9/70.5 |
| r2-hc4-w01 | pool.compute-metric [pose-only] | N611 3.7/10.2/19.7/51.9 | N568 3.7/9.4/17.3/51.9 |
| r2-hc4-w01 | shard.compute [pose-only] | N1136 2.7/4.4/9.5/38.6 | N1136 2.7/4.4/9.5/38.6 |
| r2-hc6-w01 | pool.compute-metric [pose-only] | N621 2.4/6.5/16.9/57.6 | N577 2.4/6.7/35.4/57.6 |
| r2-hc6-w01 | shard.compute [pose-only] | N2308 1.4/2.3/7.2/18.9 | N2308 1.4/2.3/7.2/18.9 |
| r1-w-tc01 | pool.compute-metric | N1052 0.6/1.8/7.8/20.1 | N1052 0.6/1.8/7.8/20.1 |
| r1-w-th01 | pool.compute-metric | N1052 0.6/1.3/2.8/11.1 | N1052 0.6/1.3/2.8/11.1 |
| r1-w-tc02 | pool.compute-metric | N1004 0.6/1.0/1.9/12.8 | N1004 0.6/1.0/1.9/12.8 |
| r1-w-th02 | pool.compute-metric | N1004 1.2/3.7/9.3/37.2 | N1004 1.2/3.7/9.3/37.2 |
| r1-s-tc01 | job.total | N1052 0.3/0.6/2.1/4.6 | N1052 0.3/0.6/2.1/4.6 |
| r1-s-tc02 | job.total | N1004 0.3/0.5/0.7/7.3 | N1004 0.3/0.5/0.7/7.3 |
| r1-s-th01 | job.total | N1052 0.4/0.9/1.0/4.2 | N1052 0.4/0.9/1.0/4.2 |
| r1-s-th02 | job.total | N1004 1.1/3.3/3.9/24.2 | N1004 1.1/3.3/3.9/24.2 |
| r1-w-tc01 | merge.assemble | N930 0.0/0.1/0.1/0.3 | N1052 0.0/0.1/0.1/0.3 |
| r1-w-th02 | merge.assemble | N954 0.0/0.1/0.1/0.6 | N1004 0.0/0.1/0.1/0.6 |
