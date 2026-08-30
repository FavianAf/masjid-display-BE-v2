export type ResponseCode = "00" | "01" | "400" | "401" | "404" | "422" | "429" | "500" | "502";

export interface StandardResponse<T = unknown> {
  responseCode: ResponseCode;
  responseMessage: string;
  responseData?: T;
}

export function success<T>(data: T, message = "Success"): StandardResponse<T> {
  return { responseCode: "00", responseMessage: message, responseData: data };
}

export function created<T>(data: T, message = "Created successfully"): StandardResponse<T> {
  return { responseCode: "01", responseMessage: message, responseData: data };
}
