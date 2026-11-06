import { installPerf } from "./pool-runtime";

installPerf({
  makeClassicWorker: () => new Worker(new URL("./classic-worker-entry.ts", import.meta.url)),
  makeHybridWorker: () => new Worker(new URL("./hybrid-worker-entry.ts", import.meta.url)),
});
