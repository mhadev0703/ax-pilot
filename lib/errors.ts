export class AppError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 502) {
    super(message);
    this.name = "AppError";
  }
}

// Never forward provider errors: they can contain request data or connection details.
export function publicError(error: unknown) {
  return error instanceof AppError
    ? { code: error.code, message: error.message, status: error.status }
    : { code: "INTERNAL_ERROR", message: "The operation could not be completed. Retry or ask a maintainer to check the service configuration.", status: 500 };
}
