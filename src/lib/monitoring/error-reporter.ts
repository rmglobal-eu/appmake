/**
 * Centralized error reporting utility.
 * Stores the last 100 errors in memory for debugging.
 * Logs to console in development; extensible for external services.
 */

export interface ErrorContext {
  userId?: string;
  route?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface ReportedError {
  id: string;
  message: string;
  stack?: string;
  name: string;
  context?: ErrorContext;
  timestamp: number;
  environment: string;
}

const MAX_STORED_ERRORS = 100;
const errors: ReportedError[] = [];

let idCounter = 0;

function generateErrorId(): string {
  idCounter++;
  return `err_${Date.now()}_${idCounter}`;
}

/**
 * Report an error. Stores it in memory and logs to console in development.
 */
export function reportError(error: Error, context?: ErrorContext): void {
  const environment = process.env.NODE_ENV ?? "development";

  const reported: ReportedError = {
    id: generateErrorId(),
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: Date.now(),
    environment,
  };

  // Store in memory, evicting oldest if at capacity
  if (errors.length >= MAX_STORED_ERRORS) {
    errors.shift();
  }
  errors.push(reported);

  // Log in development
  if (environment === "development") {
    console.error("[ErrorReporter]", {
      id: reported.id,
      name: reported.name,
      message: reported.message,
      context: reported.context,
      timestamp: new Date(reported.timestamp).toISOString(),
    });
    if (reported.stack) {
      console.error(reported.stack);
    }
  }

  // Production logging - structured JSON for log aggregation
  if (environment === "production") {
    console.error(
      JSON.stringify({
        level: "error",
        errorId: reported.id,
        name: reported.name,
        message: reported.message,
        context: reported.context,
        timestamp: new Date(reported.timestamp).toISOString(),
      })
    );
  }
}

/**
 * Retrieve all recently reported errors, newest first.
 */
export function getRecentErrors(): ReportedError[] {
  return [...errors].reverse();
}

/**
 * Get a specific error by ID.
 */
export function getErrorById(id: string): ReportedError | undefined {
  return errors.find((e) => e.id === id);
}

/**
 * Clear all stored errors. Useful for testing.
 */
export function clearErrors(): void {
  errors.length = 0;
}

/**
 * Get the count of stored errors.
 */
export function getErrorCount(): number {
  return errors.length;
}
