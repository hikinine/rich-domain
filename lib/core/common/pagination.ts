import { PaginationCriteria } from "./pagination-criteria";
import { PaginationQuery, PaginationResult } from './pagination-types';

export class Pagination<Aggregate> {
  public readonly query: PaginationQuery
  public result: Aggregate[]

  constructor(criteria: PaginationCriteria, paginationResult: PaginationResult<Aggregate>) {

    this.result = paginationResult.result
    this.query = {
      timestamp: Date.now(),
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
    }
  }


  public toJSON<T>(transformer?: (aggregate: Aggregate) => T): Pagination<T> {
    if (typeof transformer === 'function') {
      this.result = this.result.map(transformer) as unknown[] as Aggregate[]
      return this as unknown as Pagination<T>
    }

    if (!this.result.length) {
      return this as unknown as Pagination<T>
    }

    const [item] = this.result

    if (typeof item !== 'object') {
      return this as unknown as Pagination<T>
    }

    if (typeof (item as any)?.toJSON !== 'function') {
      throw new Error('toJSON method is not implemented in the pagination item. Please provide a transformer function in pagination.toJSON() method. Example pagination.toJSON((item) => item.toJSON())')
    }

    this.result = this.result.map((item: any) => item.toJSON()) 

    return this as unknown as Pagination<T>
  }
} 