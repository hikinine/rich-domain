
export { BaseAdapter as Adapter } from './core/adapter';
export * from './core/assert';
export * from './core/errors';
export * from "./core/pagination";
export * as Repository from "./core/repository";
export * as RepositoryError from "./core/repository-errors";
export * as Result from './core/result';
export * from "./core/types";
export * from "./decorators";
export { Either };
  import { Id as BaseId } from "./core/Id";
  import { Aggregate as BaseAggregate } from "./core/aggregate";
  import { DomainEvent as BaseDomainEvent } from "./core/domain-event";
  import { Entity as BaseEntity } from "./core/entity";
  import { Either } from './core/result';
  import { EntityProps as BaseEntityProps, EventPublisher as BaseEventPublisher } from "./core/types";
  import { ValueObject as BaseValueObject } from "./core/value-object";

export type Maybe<T> = T | null | undefined
export type Collection<T> = T[]

export namespace Domain {
  export const Entity = BaseEntity;
  export const Aggregate = BaseAggregate
  export const ValueObject = BaseValueObject
  export const Event = BaseDomainEvent
  export const Id = BaseId
  export type Id = BaseId
  export type Aggregate<T extends EntityProps> = BaseAggregate<T>
  export type Entity<T extends EntityProps> = BaseEntity<T>
  export type EntityProps = BaseEntityProps
  
  export interface Service<R> {
    execute(e?: any): Promise<R>
  }
}

export namespace Application {
  export interface EventPublisher<AggregateType> extends BaseEventPublisher<AggregateType> { }
  export interface Usecase<I, R> {
    execute(e?: I): Promise<R>
  }
}