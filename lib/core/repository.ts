import { BaseAdapter } from "./adapter";
import { Aggregate as BaseAggregate } from "./aggregate";
import { Pagination, PaginationCriteria } from "./pagination";

export type Transaction<T> = (context: PersistenceContext) => Promise<T>
export type WriteOptions<T = PersistenceContext> = { context?: T }
export type PersistenceContext = unknown;


export abstract class BaseUnitOfWork {
  abstract startTransaction<T>(callback: Transaction<T>): Promise<T>
  abstract commit?(): Promise<void>
  abstract rollback?(): Promise<void>
}
export abstract class ReadRepository<Aggregate extends BaseAggregate<any>> {
  abstract find(criteria: PaginationCriteria): Promise<Pagination<Aggregate> | null>
  abstract findById(id: string): Promise<Aggregate | null>
}

export abstract class WriteRepository<Aggregate extends BaseAggregate<any>> {
  abstract create(entity: Aggregate, options?: WriteOptions): Promise<void>
  abstract update(entity: Aggregate, options?: WriteOptions): Promise<void>
  abstract delete(id: string, options?: WriteOptions): Promise<void>
}

export abstract class WriteAndRead<Aggregate extends BaseAggregate<any>> {
  abstract find(criteria: PaginationCriteria): Promise<Pagination<Aggregate> | null>
  abstract findById(id: string): Promise<Aggregate | null>
  abstract create(entity: Aggregate, options?: WriteOptions): Promise<void>
  abstract update(entity: Aggregate, options?: WriteOptions): Promise<void>
  abstract delete(id: string, options?: WriteOptions): Promise<void>
}

export abstract class Impl<Aggregate extends BaseAggregate<any>> extends WriteAndRead<Aggregate> {
  protected abstract readonly adapterToDomain: BaseAdapter<unknown, Aggregate>;
  protected abstract readonly adapterToPersistence: BaseAdapter<Aggregate, unknown>;
  abstract get model(): any
}
