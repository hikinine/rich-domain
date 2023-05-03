import {
  BaseAggregate,
  BaseEntity,
  EntityProps as BaseEntityProps,
  EventPublisher as BaseEventPublisher,
  Id as BaseId,
  Rules as BaseRules,
  BaseValueObject,
  DomainEvent,
} from './core';
import { DomainError as BaseDomainError } from './core/domain-error';
import * as BaseRepository from './core/repository';
import * as ResultBase from './core/result';
export { BaseAdapter as Adapter } from './core/adapter';
export * from "./core/pagination";

export const DomainError = BaseDomainError;
export class Result {
  static ok = ResultBase.ok
  static fail = ResultBase.fail
  static combine = ResultBase.combine
}
export class Repository {
  static Read = BaseRepository.ReadRepository
  static Write = BaseRepository.WriteRepository
  static WriteAndRead = BaseRepository.WriteAndRead
  static Impl = BaseRepository.RepositoryImpl
}
export type Collection<T> = T[]
export const ok = ResultBase.ok
export const fail = ResultBase.fail
export const Ok = ResultBase.Ok
export const Fail = ResultBase.Fail
export type Either<Error extends ResultBase.ResultError, Result> = ResultBase.Either<Error, Result>

export namespace Domain {
  export const Entity = BaseEntity;
  export const Aggregate = BaseAggregate
  export const ValueObject = BaseValueObject
  export const Event = DomainEvent
  export const Id = BaseId
  export type UUID4 = BaseId
  export type EntityProps = BaseEntityProps
  export type RulesError = "Error"
  export interface Rules extends BaseRules { }

  export const applyRules = (rules: Rules[]): Either<BaseDomainError, void> => {
    for (const rule of rules) {
      if (rule.isBrokenIf()) {
        return Result.fail(rule.Error)
      }
    }

    return Result.ok(undefined);
  };


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
