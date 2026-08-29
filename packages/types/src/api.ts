export interface IApiResponse<T = unknown> {
  version: "v1";
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  correlationId?: string;
}

export interface IAPIV1Response<T = unknown> {
  version: "v1";
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  correlation_id?: string;
  code?: string;
}

export interface IListResponse<T> {
  items: T[];
  total?: number;
  nextCursor?: string;
}
