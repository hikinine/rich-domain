type OrderByEnum = 'asc' | 'desc';
type Condition =
  | 'equals'
  | 'in'
  | 'notIn'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'contains'
  | 'startsWith'
  | 'endsWith';
const conditions = [
  'equals',
  'in',
  'notIn',
  'lt',
  'lte',
  'gt',
  'gte',
  'contains',
  'startsWith',
  'endsWith',
] as const;
type Value =
  | string
  | number
  | boolean
  | Date
  | null
  | string[]
  | number[];
type Field = string;
type OrderBy = [Field, OrderByEnum][]
type Filter = [Field, Condition, Value][]
/**
 * 
 */
export class PaginationCriteria {
  public offset: number;
  public limit: number;
  public search?: string
  public filter?: Filter
  public orderBy?: OrderBy

  constructor(props: Record<string, any>) {
    this.offset = Number(props?.offset) || 0;
    this.limit = Number(props?.limit) || 10;

    if (props?.orderBy) {
      const orderBy = JSON.parse(props?.orderBy) as OrderBy || []
      validationOrderBy(orderBy)
    }

    if (props?.filter) {
      const filter = JSON.parse(props.filter) as Filter || []
      validationFilter(filter)
    }

    if (props?.search) {
      this.filter = undefined;
      this.orderBy = undefined;
      this.offset = 0;
      this.limit = 20;
      this.search = String(props.search);
    }
  }

}
function validationOrderBy(orderBy: OrderBy) {
  if (!Array.isArray(orderBy))
    throw new Error("Pagination criteria orderBy must be an array");

  orderBy.forEach((item) => {
    if (!Array.isArray(item) || item.length !== 2) {
      throw new Error("Pagination criteria orderBy item must be an array of 2 items [field, order]");
    }
    const [field, order] = item
    if (typeof field !== "string" || !field)
      throw new Error("Pagination criteria orderBy field must be a string");

    if (order !== "asc" && order !== "desc")
      throw new Error("Pagination criteria orderBy order must be one of the following: asc, desc");
  })
}
function validationFilter(filter: Filter) {
  if (!Array.isArray(filter))
    throw new Error("Pagination criteria filter must be an array");

  filter.forEach((item) => {
    if (!Array.isArray(item) || item.length !== 3) {
      throw new Error("Pagination criteria filter item must be an array of 3 items [field, condition, value]");
    }
    const [field, condition, value] = item
    if (!conditions.includes(condition))
      throw new Error("Pagination criteria filter condition must be one of the following: " + conditions.join(", "));
    if (typeof field !== "string" || !field)
      throw new Error("Pagination criteria filter field must be a string");

    if (value === undefined) {
      throw new Error("Pagination criteria filter value must be defined");
    }
  })
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
      filter?: Filter
      limit: number
      orderBy?: OrderBy
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
        filter: criteria?.filter,
        orderBy: criteria?.orderBy,
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
