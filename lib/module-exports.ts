
import { Either } from './core/result';

export { BaseAdapter as Adapter } from './core/adapter';
export * from './core/aggregate';
export * from './core/entity';
export * from './core/errors';
export * from "./core/hooks";
export * from "./core/pagination";
export * from "./core/policy";
export * as Repository from "./core/repository";
export * as RepositoryError from "./core/repository-errors";
export * as Result from './core/result';
export * from "./core/types";
export * from "./decorators";
export { Either };
export type Maybe<T> = T | null | undefined
export type Collection<T> = T[]