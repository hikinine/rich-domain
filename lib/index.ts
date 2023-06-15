import { Id as BaseId } from "./core/Id";
import { Aggregate as BaseAggregate } from "./core/aggregate";
import { DomainEvent as BaseDomainEvent } from "./core/domain-event";
import { Entity as BaseEntity } from "./core/entity";
import * as CoreHook from "./core/hooks";
import { Either } from './core/result';
import { EntityProps as BaseEntityProps, EventPublisher as BaseEventPublisher } from "./core/types";
import { ValueObject as BaseValueObject } from "./core/value-object";

export { BaseAdapter as Adapter } from './core/adapter';
export * from './core/entity-validation';
export * from './core/errors';
export * from "./core/hooks";
export * from "./core/pagination";
export * as Repository from "./core/repository";
export * as RepositoryError from "./core/repository-errors";
export * as Result from './core/result';
export * from "./core/types";
export * from "./decorators";
export { Either };

export type Maybe<T> = T | null | undefined
export type Collection<T> = T[]

export namespace Domain {
  export const Hooks = CoreHook.Hooks
  export type HooksConfig<Aggregate, Props> = CoreHook.HooksConfig<Aggregate, Props>
  export const Entity = BaseEntity;
  export const Aggregate = BaseAggregate
  export const ValueObject = BaseValueObject
  export const Event = BaseDomainEvent
  export const Id = BaseId
  export type Id = BaseId
  export type Aggregate<T extends EntityProps> = BaseAggregate<T>
  export type Entity<T extends EntityProps> = BaseEntity<T>
  export type EntityProps = BaseEntityProps

  export interface Service<I, O> {
    execute(e?: I): Promise<O>
  }
}

export namespace Application {
  export interface EventPublisher<T> extends BaseEventPublisher<T> { }
  export interface Usecase<I, O> {
    execute(e?: I): Promise<O>
  }
}