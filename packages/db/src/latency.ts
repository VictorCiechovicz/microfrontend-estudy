const DEFAULT_LATENCY_MS = 400;

export async function withLatency<T>(fn: () => T, ms?: number): Promise<T> {
  const delay = ms ?? Number(process.env.LAB_LATENCY_MS ?? DEFAULT_LATENCY_MS);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return fn();
}
