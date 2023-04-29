import { DomainError } from "./domain-error";

export type EntityProps = {
  id?: IdImplementation,
  createdAt?: Date,
  updatedAt?: Date
}

export interface IdImplementation {
	value: string;
	isNew(): boolean;
	createdAt(): Date;
	equal(id: IdImplementation): boolean;
	deepEqual(id: IdImplementation): boolean;
	cloneAsNew(): IdImplementation;
	clone(): IdImplementation;
}

export type DomainEventReplaceOptions = 'REPLACE_DUPLICATED' | 'UPDATE' | 'KEEP';

export interface IDomainEvent<T> {
  aggregate: T;
  createdAt: Date;
  eventName: string
}

export interface EntityMapperPayload {
  id: string 
  createdAt: Date 
  updatedAt: Date
}

export interface EventPublisher<AggregateType> {
  publish(event: IDomainEvent<AggregateType> ): void;
}

export interface Rules {
  Error: DomainError;
  isBrokenIf(): boolean;
}