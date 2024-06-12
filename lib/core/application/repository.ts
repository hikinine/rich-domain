import { Aggregate as BaseAggregate } from "../domain/aggregate";
import { WriteAndRead } from "../domain/repository";
import { BaseAdapter } from "./adapter";

export type PersistenceContext = unknown;
export type Transaction<T> = (context: PersistenceContext) => Promise<T>

export abstract class BaseUnitOfWork {
  abstract startTransaction<T>(callback: Transaction<T>): Promise<T>
  abstract commit?(): Promise<void>
  abstract rollback?(): Promise<void>
} 

export abstract class RepositoryImplementation<Aggregate extends BaseAggregate<any>> extends WriteAndRead<Aggregate> {
  protected abstract readonly adapterToDomain: BaseAdapter<unknown, Aggregate>;
  protected abstract readonly adapterToPersistence: BaseAdapter<Aggregate, unknown>;
  abstract get model(): any
}
