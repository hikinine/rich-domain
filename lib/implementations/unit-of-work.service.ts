import { Transaction } from "../core";

export abstract class UnitOfWorkService {
  abstract startTransaction<T>(callback: Transaction<T>): Promise<T>;
  abstract getContext(): any;
  abstract allowTransaction(constructor: any): void;
}
