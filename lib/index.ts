
export { BaseAdapter as Adapter } from './core/adapter';
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
  export type UUID4 = BaseId
  export type EntityProps = BaseEntityProps
  
  export interface Service<R extends Either<any, unknown>> {
    execute(e?: any): Promise<R>
  }
}

export namespace Application {
  export interface EventPublisher<AggregateType> extends BaseEventPublisher<AggregateType> { }
  export interface Usecase<R extends Either<any, unknown>> {
    execute(e?: any): Promise<R>
  }
}