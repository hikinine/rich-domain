import { Pagination } from "../common/pagination";
import { PaginationCriteria } from "../common/pagination-criteria";
import { Aggregate as BaseAggregate } from "./aggregate";

export type PersistenceContext = unknown;
export type WriteOptions<T = PersistenceContext> = { context?: T }

export abstract class ReadRepository<Aggregate extends BaseAggregate<any>> {
  abstract find(criteria: PaginationCriteria): Promise<Pagination<Aggregate>>
  abstract findById(id: string): Promise<Aggregate | null>
}

export abstract class WriteRepository<Aggregate extends BaseAggregate<any>> {
  abstract create(entity: Aggregate, options?: WriteOptions): Promise<void>
  abstract update(entity: Aggregate, options?: WriteOptions): Promise<void>
  abstract delete(entity: Aggregate, options?: WriteOptions): Promise<void>
}

export abstract class WriteAndRead<Aggregate extends BaseAggregate<any>> {
  abstract find(criteria: PaginationCriteria): Promise<Pagination<Aggregate>>
  abstract findById(id: string): Promise<Aggregate | null>
  abstract create(entity: Aggregate, options?: WriteOptions): Promise<void>
  abstract update(entity: Aggregate, options?: WriteOptions): Promise<void>
  abstract delete(entity: Aggregate, options?: WriteOptions): Promise<void>
}
 