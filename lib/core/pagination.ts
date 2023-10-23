export class PaginationCriteria {
  offset: number;
  limit: number;
  search?: string
  orderBy?: [string, "asc" | "desc"];

  constructor(props: any) {
    this.orderBy = props?.orderBy;

    if (props?.search) {
      this.search = String(props.search);
      this.offset = 0;
      this.limit = 20;
    }
    else {
      this.offset = Number(props.offset) || 0;
      this.limit = Number(props.limit) || 10;
    }
  }

  public maxLimit(number: number) {
    this.limit = Math.min(this.limit, number);
  }
}

export type PaginationResult<Model> = {
  result: Model[];
  total: number;
}
type ConstructorTypeof<T> = new (...args: any[]) => T;
export class Pagination<Aggregate> {
  public readonly query: {
    currentPage: number
    totalPages: number
    totalResults: number
    timestamp: number
    config: {
      search?: string
      offset: number
      limit: number
      orderBy?: string
    }
  }
  public readonly result: Aggregate[]

  constructor(criteria: PaginationCriteria, paginationResult: PaginationResult<any>) {

    this.result = paginationResult.result
    this.query = {
      currentPage: Math.floor(criteria.offset / criteria.limit) + 1,
      totalPages: Math.ceil(paginationResult.total / criteria.limit),
      totalResults: paginationResult.total,
      config: {
        search: criteria.search,
        offset: criteria.offset,
        limit: criteria.limit,
        orderBy: criteria?.orderBy?.join?.(" "),
      },
      timestamp: Date.now(),
    }
  }

  public convertTo<T>(clazz: ConstructorTypeof<T>): Pagination<T> {
    return {
      query: this.query,
      result: this.result.map((item) => new clazz(item))
    } as Pagination<T>
  }
}
