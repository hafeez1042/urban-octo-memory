import { IAPIResponse } from "@repo/types/lib/types";

export const v1Response = <T>(data?: T, message?: string): IAPIResponse<T> => {
  return {
    version: "v1",
    success: true,
    message,
    data,
  };
};
