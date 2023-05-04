export type PaginationCriteria<Model = any> = {
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
  public readonly results: number
  public readonly totalResults: number
  public readonly orderBy?: string

  constructor(criteria: PaginationCriteria<any>, result: PaginationResult<any>) {
    this.currentPage = Math.floor(criteria.offset / criteria.limit) + 1
    this.totalPages = Math.ceil(result.total / criteria.limit)
    this.results = result.data.length
    this.totalResults = result.data.length
    this.orderBy = criteria?.orderBy?.join?.(" ")
    this.data = result.data
  }
}