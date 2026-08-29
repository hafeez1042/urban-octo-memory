export interface IQueryStringParams {
  q?: string;
  filter?: IFieldFilter;
  limit?: number;
  skip?: number;
  cursor?: string;
  orderBy?: string;
  order?: "asc" | "dsc";
  expand?: boolean;
  deleted?: boolean;
}

export interface IFilterConditions {
  startsWith?: string;
  contains?: string;
  endsWith?: string;
  eq?: unknown;
  neq?: unknown;
  lt?: number | Date | null;
  lte?: number | Date | null;
  gt?: number | Date | null;
  gte?: number | Date | null;
  in?: unknown[];
  nin?: unknown[];
}

export type IFieldFilter = Record<string, IFilterConditions>;

export interface IAPIResponse<T = unknown> {
  version?: string;
  success?: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  validationErrors?: Record<string, string[]>;
}
