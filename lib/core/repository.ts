import { BaseAdapter } from "./adapter";
import { Aggregate as BaseAggregate } from "./aggregate";
import { Pagination, PaginationCriteria } from "./pagination";
import { RepositoryPersistenceError, RepositoryQueryError } from "./repository-errors";
import { Either } from "./result";


export abstract class ReadRepository<Aggregate extends BaseAggregate<any>> {
  abstract find(criteria: PaginationCriteria): Promise<Either<RepositoryQueryError, Pagination<Aggregate>>>
  abstract findById(id: string): Promise<Either<RepositoryQueryError, Aggregate>>
}

export abstract class WriteRepository<Aggregate extends BaseAggregate<any>> {
  abstract create(entity: Aggregate): Promise<Either<RepositoryPersistenceError, void>>
  abstract update(entity: Aggregate): Promise<Either<RepositoryPersistenceError, void>>
  abstract delete(id: string): Promise<Either<RepositoryPersistenceError, void>>
}

export abstract class WriteAndRead<Aggregate extends BaseAggregate<any>> {
  abstract find(criteria: PaginationCriteria): Promise<Either<RepositoryQueryError, Pagination<Aggregate>>>
  abstract findById(id: string): Promise<Either<RepositoryQueryError, Aggregate>>
  abstract create(entity: Aggregate): Promise<Either<RepositoryPersistenceError, void>>
  abstract update(entity: Aggregate): Promise<Either<RepositoryPersistenceError, void>>
  abstract delete(id: string): Promise<Either<RepositoryPersistenceError, void>>
}

export abstract class Impl<Aggregate extends BaseAggregate<any>> extends WriteAndRead<Aggregate> {
  protected abstract readonly adapterToDomain: BaseAdapter<unknown, Aggregate>;
  protected abstract readonly adapterToPersistence: BaseAdapter<Aggregate, unknown>;
  abstract get model(): any
}
