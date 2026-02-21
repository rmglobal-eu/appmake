/**
 * Health check utility for monitoring application status.
 * Checks: database connectivity, memory usage, event loop lag.
 */

const startTime = Date.now();

export interface HealthCheck {
  name: string;
  status: "ok" | "warning" | "error";
  latencyMs: number;
  error?: string;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheck[];
  uptime: number;
  version: string;
}

/**
 * Check database connectivity by attempting a simple query.
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = performance.now();
  try {
    // Dynamic import to avoid hard dependency on the db module
    const { db } = await import("@/lib/db");
    await db.execute("SELECT 1");
    return {
      name: "database",
      status: "ok",
      latencyMs: Math.round(performance.now() - start),
    };
  } catch (err) {
    return {
      name: "database",
      status: "error",
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Check memory usage. Warn if heap usage exceeds 85%, error if exceeds 95%.
 */
function checkMemory(): HealthCheck {
  const start = performance.now();
  try {
    const mem = process.memoryUsage();
    const heapUsedPercent = (mem.heapUsed / mem.heapTotal) * 100;
    const rssInMB = Math.round(mem.rss / 1024 / 1024);

    let status: HealthCheck["status"] = "ok";
    let error: string | undefined;

    if (heapUsedPercent > 95) {
      status = "error";
      error = `Heap usage critical: ${heapUsedPercent.toFixed(1)}% (RSS: ${rssInMB}MB)`;
    } else if (heapUsedPercent > 85) {
      status = "warning";
      error = `Heap usage elevated: ${heapUsedPercent.toFixed(1)}% (RSS: ${rssInMB}MB)`;
    }

    return {
      name: "memory",
      status,
      latencyMs: Math.round(performance.now() - start),
      error,
    };
  } catch (err) {
    return {
      name: "memory",
      status: "error",
      latencyMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Check event loop lag. Warn if lag exceeds 100ms, error if exceeds 500ms.
 */
async function checkEventLoopLag(): Promise<HealthCheck> {
  const start = performance.now();
  const expectedDelay = 5; // ms

  const lagMs = await new Promise<number>((resolve) => {
    const before = performance.now();
    setTimeout(() => {
      const actual = performance.now() - before;
      resolve(Math.max(0, actual - expectedDelay));
    }, expectedDelay);
  });

  let status: HealthCheck["status"] = "ok";
  let error: string | undefined;

  if (lagMs > 500) {
    status = "error";
    error = `Event loop lag critical: ${lagMs.toFixed(1)}ms`;
  } else if (lagMs > 100) {
    status = "warning";
    error = `Event loop lag elevated: ${lagMs.toFixed(1)}ms`;
  }

  return {
    name: "event_loop",
    status,
    latencyMs: Math.round(performance.now() - start),
    error,
  };
}

/**
 * Run all health checks and return aggregate status.
 */
export async function checkHealth(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkMemory()),
    checkEventLoopLag(),
  ]);

  const hasError = checks.some((c) => c.status === "error");
  const hasWarning = checks.some((c) => c.status === "warning");

  let status: HealthStatus["status"] = "healthy";
  if (hasError) {
    status = "unhealthy";
  } else if (hasWarning) {
    status = "degraded";
  }

  return {
    status,
    checks,
    uptime: Math.round((Date.now() - startTime) / 1000),
    version: process.env.APP_VERSION ?? process.env.npm_package_version ?? "0.0.0",
  };
}
