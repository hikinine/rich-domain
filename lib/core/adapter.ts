import { BaseAggregate } from './aggregate';
import { Either } from './result';

export abstract class BaseAdapter<Aggregate extends BaseAggregate<any>, Model = any> {
  public abstract toDomain(data: Model): Either<any, Aggregate>;
  public abstract toPersistence(data: Aggregate): Either<any, Model>
}