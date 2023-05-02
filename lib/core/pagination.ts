export type PaginationCriteria<Model> = {
  offset: number;
  limit: number;
  orderBy?: [keyof Model, "asc" | "desc"];
}

export type PaginationResult<Model> = {
  data: Model[];
  total: number;
}

export class Pagination<Aggregate> {
  public readonly data: Aggregate[]
  public readonly currentPage: number
  public readonly totalPages: number
  public readonly orderBy?: string

  constructor(criteria: PaginationCriteria<any>, result: PaginationResult<any>) {
    this.currentPage = Math.floor(criteria.offset / criteria.limit) + 1
    this.totalPages = Math.ceil(result.total / criteria.limit)
    this.data = result.data
    this.orderBy = criteria?.orderBy?.join?.(" ")
  }
}