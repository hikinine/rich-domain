import { BaseAdapter } from "./adapter";
import { BaseAggregate } from "./aggregate";
import { Pagination, PaginationCriteria } from "./pagination";
import { Either } from "./result";


export abstract class ReadRepository<Aggregate extends BaseAggregate<any>> {
  abstract find<T extends unknown = any>(criteria?: PaginationCriteria<T>): Promise<Either<any, Pagination<Aggregate>>>
  abstract findById(id: string): Promise<Either<any, Aggregate>>
}

export abstract class WriteRepository<Aggregate extends BaseAggregate<any>> {
  abstract create(entity: Aggregate): Promise<Either<any, void>>
  abstract update(entity: Aggregate): Promise<Either<any, void>>
  abstract delete(id: string): Promise<Either<any, void>>
}

export abstract class WriteAndRead<Aggregate extends BaseAggregate<any>> {
  abstract find<T extends unknown = any>(criteria?: PaginationCriteria<T>): Promise<Either<any, Pagination<Aggregate>>>
  abstract findById(id: string): Promise<Either<any, Aggregate>>
  abstract create(entity: Aggregate): Promise<Either<any, void>>
  abstract update(entity: Aggregate): Promise<Either<any, void>>
  abstract delete(id: string): Promise<Either<any, void>>
}

export abstract class RepositoryImpl<Aggregate extends BaseAggregate<any>> extends WriteAndRead<Aggregate> {
  protected abstract readonly adapterToDomain: BaseAdapter<unknown, Aggregate>;
  protected abstract readonly adapterToPersistence: BaseAdapter<Aggregate, unknown>;
}
