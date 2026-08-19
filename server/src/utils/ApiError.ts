/**
 * Standard application error used across the whole API.
 * Thrown from controllers/services and caught by the global error handler.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Codsi khaldan.", details?: unknown) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = "Fadlan soo gal (login) marka hore.") {
    return new ApiError(401, message);
  }
  static forbidden(message = "Ogolaanshaha kuma jirto qeybtan.") {
    return new ApiError(403, message);
  }
  static notFound(message = "Waxaad raadinayso lama helin.") {
    return new ApiError(404, message);
  }
  static conflict(message = "Isku dhac ayaa jira.", details?: unknown) {
    return new ApiError(409, message, details);
  }
  static internal(message = "System khalad ayaa dhacay. Fadlan mar kale isku day.") {
    return new ApiError(500, message, undefined, false);
  }
}
