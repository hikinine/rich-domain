import { DomainEvent, IDomainEventPayload } from "../types";

/**
 * @description Domain Event with state.
 */
 export class DomainEventPayload<T> implements IDomainEventPayload<T> {
	public aggregate!: T;
	public createdAt!: Date;
	public callback: DomainEvent<T>;
	constructor(aggregate: T, callback: DomainEvent<T>){
		this.aggregate = aggregate;
		this.createdAt = new Date();
		this.callback = callback;
	}
}

