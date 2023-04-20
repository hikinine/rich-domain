import { DomainEventImplementation, IDomainEvent } from "./types";

export class DomainEvent<T> implements IDomainEvent<T> {
  public aggregate!: T;
  public createdAt!: Date;
  public eventName: string
  constructor(aggregate: T, eventImplementation: DomainEventImplementation) {
    this.aggregate = aggregate;
    this.createdAt = new Date();
    this.eventName = eventImplementation.eventName;
  }
}

