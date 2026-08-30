import { Elysia } from "elysia";
import { AppError } from "@/shared/errors/app-error";
import type { StandardResponse } from "@/shared/types/response";

export const errorHandlerPlugin = new Elysia().onError({ as: "global" }, ({ error, code, set }) => {
  if (error instanceof AppError) {
    set.status = error.httpStatus;
    const body: StandardResponse = {
      responseCode: error.responseCode,
      responseMessage: error.message,
    };
    return body;
  }

  if (code === "VALIDATION") {
    set.status = 400;
    const body: StandardResponse = {
      responseCode: "400",
      responseMessage: error.message ?? "invalid request body",
    };
    return body;
  }

  if (code === "NOT_FOUND") {
    set.status = 404;
    const body: StandardResponse = { responseCode: "404", responseMessage: "not found" };
    return body;
  }

  console.error("Unhandled error:", error);
  set.status = 500;
  const body: StandardResponse = { responseCode: "500", responseMessage: "Internal server error" };
  return body;
});
