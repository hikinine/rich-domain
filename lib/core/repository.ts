import { BaseAdapter } from "./adapter";
import { Aggregate as BaseAggregate } from "./aggregate";
import { Pagination, PaginationCriteria } from "./pagination";


export abstract class ReadRepository<Aggregate extends BaseAggregate<any>> {
  abstract find(criteria: PaginationCriteria): Promise<Pagination<Aggregate> | null>
  abstract findById(id: string): Promise<Aggregate | null>
}

export abstract class WriteRepository<Aggregate extends BaseAggregate<any>> {
  abstract create(entity: Aggregate): Promise<void>
  abstract update(entity: Aggregate): Promise<void>
  abstract delete(id: string): Promise<void>
}

export abstract class WriteAndRead<Aggregate extends BaseAggregate<any>> {
  abstract find(criteria: PaginationCriteria): Promise<Pagination<Aggregate> | null>
  abstract findById(id: string): Promise<Aggregate | null>
  abstract create(entity: Aggregate): Promise<void>
  abstract update(entity: Aggregate): Promise<void>
  abstract delete(id: string): Promise<void>
}

export abstract class Impl<Aggregate extends BaseAggregate<any>> extends WriteAndRead<Aggregate> {
  protected abstract readonly adapterToDomain: BaseAdapter<unknown, Aggregate>;
  protected abstract readonly adapterToPersistence: BaseAdapter<Aggregate, unknown>;
  abstract get model(): any
}
