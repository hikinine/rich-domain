export class PaginationCriteria {
  offset: number;
  limit: number;
  orderBy?: [string, "asc" | "desc"];

  constructor(props: PaginationCriteria) {
    this.offset = Number(props.offset || 0);
    this.limit = Number(props.limit || 10);
    this.orderBy = props.orderBy;
  }
}

export type PaginationResult<Model> = {
  data: Model[];
  total: number;
} 
type ConstructorTypeof<T> = new (...args:any[]) => T;
export class Pagination<Aggregate> {
  public readonly query: {
    currentPage: number
    totalPages: number
    totalResults: number
    timestamp: number
    config: {
      offset: number
      limit: number
      orderBy?: string
    }
  }
  public readonly data: Aggregate[]

  constructor(criteria: PaginationCriteria, result: PaginationResult<any>) {

    this.data = result.data
    this.query = {
      currentPage: Math.floor(criteria.offset / criteria.limit) + 1,
      totalPages: Math.ceil(result.total / criteria.limit),
      totalResults: result.total,
      config: {
        offset: criteria.offset,
        limit: criteria.limit,
        orderBy: criteria?.orderBy?.join?.(" "),
      },
      timestamp: Date.now(),
    }
  }

  public toPublicView<T>(clazz: ConstructorTypeof<T>): Pagination<T> {
    return {
      query: this.query,
      data: this.data.map((item) => new clazz(item))
    } as Pagination<T>
  }
}
