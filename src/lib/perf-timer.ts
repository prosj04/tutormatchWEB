type PerfMeta = Record<string, unknown>;

function makeLabel(name: string) {
  return `[perf] ${name}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export function startPerfTimer(name: string, meta?: PerfMeta) {
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
  const timer = startPerfTimer(name, meta);
  try {
    return await task();
  } finally {
    timer.end();
  }
}

export function timeSync<T>(name: string, task: () => T, meta?: PerfMeta): T {
  const timer = startPerfTimer(name, meta);
  try {
    return task();
  } finally {
    timer.end();
  }
}
