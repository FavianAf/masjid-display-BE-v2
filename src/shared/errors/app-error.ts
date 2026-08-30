import type { ResponseCode } from "@/shared/types/response";

export class AppError extends Error {
  readonly httpStatus: number;
  readonly responseCode: ResponseCode;

  constructor(message: string, httpStatus: number, responseCode: ResponseCode) {
    super(message);
    this.name = new.target.name;
    this.httpStatus = httpStatus;
    this.responseCode = responseCode;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, "400");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized - Invalid or missing token") {
    super(message, 401, "401");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "404");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, "422");
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500, "500");
  }
}

export class BadGatewayError extends AppError {
  constructor(message: string) {
    super(message, 502, "502");
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Rate limit exceeded. Please slow down.") {
    super(message, 429, "429");
  }
}
