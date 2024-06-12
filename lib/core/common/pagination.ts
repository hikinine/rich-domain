import { parseQueryWithDots } from "../../utils/parsing-filter";

type OrderByEnum = 'asc' | 'desc';
type Condition = | 'equals'
  | 'in'
  | 'notIn'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'not'
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
  'not',
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
  public businessFilter?: Filter
  public orderBy?: OrderBy

  constructor(props: Record<string, number | string>) {
    this.offset = Number(props?.offset ?? 0)
    this.limit = Number(props?.limit ?? 10)

    if (props?.orderBy && props.orderBy !== 'undefined' && props.orderBy !== 'null') {

      const orderBy = JSON.parse(props?.orderBy as string || '[]') as OrderBy || []
      validationOrderBy(orderBy)
      this.orderBy = orderBy
    }

    if (props?.filter) {
      const filter = JSON.parse(props.filter as string) as Filter || []
      validationFilter(filter)
      this.filter = filter
    }

    if (props?.search) {
      this.filter = undefined;
      //this.orderBy = undefined;
      this.offset = 0;
      this.limit = 20;
      this.search = String(props.search);
    }
  }

  public setFilter(filter: Filter) {
    validationFilter(filter)
    this.filter = filter;
  }

  public setBusinessFilter(filter: Filter) {
    validationFilter(filter)
    this.businessFilter = filter;
  }

  public adaptFiltersToPrisma() {
    if (!this.filter && !this.businessFilter) return null;

    return {
      AND: [
        ...(this?.businessFilter?.map((filter) => {
          const [field, verb, value] = filter;
          return parseQueryWithDots(field, verb, value);
        }) || []),
        {
          OR: this.filter?.map((filter) => {
            const [field, verb, value] = filter;
            return parseQueryWithDots(field, verb, value);
          }) || []
        }
      ],

    }

  }

  public adaptOnlyBusinessFiltersToPrisma() {
    if (!this.businessFilter) return null;

    return {
      AND: this.businessFilter.map((filter) => {
        const [field, verb, value] = filter;
        return parseQueryWithDots(field, verb, value);
      })
    }
  }

  public adaptOrderByToPrisma() {
    if (!this.orderBy) return null;

    return this.orderBy.map((orderBy) => {
      const [field, order] = orderBy;
      const fieldMap = field.split('.');
      const m = {}

      fieldMap.reduce((acc, curr, index) => {
        if (index === fieldMap.length - 1) {
          acc[curr] = order;
        } else {
          acc[curr] = {};
        }
        return acc[curr];
      }, m)

      return m
    })
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
      businessFilter?: Filter
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
        businessFilter: criteria?.businessFilter,
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
 

export type Filtering<T> = {
  [key in keyof T]?: {
    [condition in Condition]?: Value;
  };
} & {
  OR?: Filtering<T> | Filtering<T>[]
  AND?: Filtering<T> | Filtering<T>[]
  NOT?: Filtering<T> | Filtering<T>[]
}
 

// (nome = paulo & idade = 25 & email = ppp) OU (nome = thiago & idade = 22 & email = ggg)