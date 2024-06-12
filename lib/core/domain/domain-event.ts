import { IDomainEvent } from "../interface/types";

export class DomainEvent<T> implements IDomainEvent<T> {
  public aggregate!: T;
  public createdAt!: Date;
  public eventName: string
  constructor(aggregate: T, eventName?: string) {
    this.aggregate = aggregate;
    this.createdAt = new Date();
    this.eventName = eventName || this?.constructor?.name
  }
}

