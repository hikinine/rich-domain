import { Filtering, Ordering } from './pagination-types';

type PaginationCriteriaInput<T> = {
  offset?: number;
  limit?: number;
  search?: string
  filter?: Filtering<T> | string
  orderBy?: Ordering<T> | string
}
export class PaginationCriteria<T = unknown> {
  public offset: number;
  public limit: number;
  public search?: string
  public businessFilter?: Filtering<T>
  public filter?: Filtering<T>
  public orderBy?: Ordering<T>

  constructor(props: PaginationCriteriaInput<T>) {
    this.offset = Number(props?.offset ?? 0)
    this.limit = Number(props?.limit ?? 10)

    if (props?.orderBy && props.orderBy !== 'undefined' && props.orderBy !== 'null') {
      this.orderBy = typeof props.orderBy === 'string'
        ? JSON.parse(props.orderBy) as Ordering<T>
        : props.orderBy
    }

    if (props?.filter) {
      this.filter = typeof props.filter === 'string'
        ? JSON.parse(props.filter) as Filtering<T>
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
