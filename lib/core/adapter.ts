import { BaseAggregate } from './aggregate';

export abstract class BaseAdapter<Aggregate extends BaseAggregate<any>, Model = any> {
  public abstract toDomain(data: Model): Aggregate;
  public abstract toPersistence(data: Aggregate): Model
}