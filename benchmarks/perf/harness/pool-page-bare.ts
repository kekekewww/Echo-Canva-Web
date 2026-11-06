import { installPerf } from "./pool-runtime";

// `bare`: the production pools create their own workers from the production modules.
installPerf({ makeClassicWorker: null, makeHybridWorker: null });
