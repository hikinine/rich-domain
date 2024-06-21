import { PaginationCriteria } from "./pagination-criteria";
import { ConstructorTypeof, PaginationQuery, PaginationResult } from './pagination-types';

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

  public convertTo<DtoOutput>(clazzDto: ConstructorTypeof<DtoOutput>): Pagination<Aggregate> {
    this.result = this.result.map((item) => new clazzDto(item)) as unknown as Aggregate[]
    return this
  }
} 