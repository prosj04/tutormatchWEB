type PerfMeta = Record<string, unknown>;

const isDev = process.env.NODE_ENV === "development";

function makeLabel(name: string) {
  return `[perf] ${name}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

const noopTimer = {
  label: "",
  end() {},
};

export function startPerfTimer(name: string, meta?: PerfMeta) {
  if (!isDev) return noopTimer;

  const label = makeLabel(name);
  if (meta) {
    console.log(`${label} start`, meta);
  }
  console.time(label);

  return {
    label,
    end(extraMeta?: PerfMeta) {
      if (extraMeta) {
        console.log(`${label} end-meta`, extraMeta);
      }
      console.timeEnd(label);
    },
  };
}

export async function timeAsync<T>(
  name: string,
  task: () => Promise<T>,
  meta?: PerfMeta,
): Promise<T> {
  if (!isDev) return task();

  const timer = startPerfTimer(name, meta);
  try {
    return await task();
  } finally {
    timer.end();
  }
}

export function timeSync<T>(name: string, task: () => T, meta?: PerfMeta): T {
  if (!isDev) return task();

  const timer = startPerfTimer(name, meta);
  try {
    return task();
  } finally {
    timer.end();
  }
}
