import { Filtering, Ordering } from './pagination-types';

type PaginationCriteriaInput = {
  offset?: number;
  limit?: number;
  search?: string
  filter?: Filtering | string
  orderBy?: Ordering | string
}
export class PaginationCriteria  {
  public offset: number;
  public limit: number;
  public search?: string
  public businessFilter?: Filtering 
  public filter?: Filtering
  public orderBy?: Ordering 

  constructor(props: PaginationCriteriaInput) {
    this.offset = Number(props?.offset ?? 0)
    this.limit = Number(props?.limit ?? 10)

    if (props?.orderBy && props.orderBy !== 'undefined' && props.orderBy !== 'null') {
      this.orderBy = typeof props.orderBy === 'string'
        ? JSON.parse(props.orderBy) as Ordering
        : props.orderBy
    }

    if (props?.filter) {
      this.filter = typeof props.filter === 'string'
        ? JSON.parse(props.filter) as Filtering
        : props.filter
    }

    if (props?.search) {
      this.offset = 0;
      this.limit = 20;
      this.search = String(props.search);
    }
  }

  public setFilter(filter: Filtering) {
    this.filter = filter;
  }

  public setBusinessFilter(filter: Filtering) {
    this.businessFilter = filter;
  }
}
