type Loose = Record<string, unknown>;
export const TRACE_CATEGORIES: string;
export function launchBrowser(chromium: { executablePath(): string; launch(options?: Loose): Promise<unknown> }, channel: string, args?: string[]): Promise<unknown>;
export function launchedExecutable(chromium: { executablePath(): string }, channel: string): { path: string | null; kind: string };
export function collectBrowserFacts(options: {
  browser: { version(): string };
  chromium: { executablePath(): string };
  channel: string;
  page: { evaluate(fn: () => unknown): Promise<unknown> };
  browserSession: { send(method: string): Promise<unknown> };
  extraArgs?: string[];
}): Promise<Record<string, unknown>>;
