import { EventHandler, IAggregate, IDispatchOptions, IDomainEventPayload, IEvent, IIterator, UID } from "../types";
import Iterator from "./iterator";

/**
 * @description Domain Events manager.
 */
export abstract class DomainEventsBus {
	public static events: IIterator<IDomainEventPayload<IAggregate<any>>> = Iterator.create();

	/**
	 * @description Add event to state.
	 * @param param event to be added.
	 */
	public static addEvent<T = any>({ event, replace }: IEvent<IAggregate<T>>) {
		const target = Reflect.getPrototypeOf(event.callback);
		const eventName = event.callback?.eventName ?? target?.constructor.name as string;
		if (!!replace) this.deleteEvent({ eventName, id: event.aggregate.id });
		event.callback.eventName = eventName;
		this.events.addToEnd(event);
	}

	/**
	 * @description Dispatch event for a provided name and an aggregate id.
	 * @param options params to find event to dispatch it.
	 * @returns promise void.
	 */
	public static async dispatch(options: IDispatchOptions, handler?: EventHandler<IAggregate<any>, void>): Promise<void> {
		const log = (): void => console.log('None handler provided');

		const callback: EventHandler<IAggregate<any>, void> = handler ? handler : ({ execute: (): void => { log(); } });

		const eventsToDispatch: Array<IDomainEventPayload<IAggregate<any>>> = [];
		const events = this.events.toArray();
		let position = 0;
		while (events[position]) {
			const event = events[position];
			if (event.aggregate.id.equal(options.id) && event.callback.eventName === options.eventName) {
				eventsToDispatch.push(event);
				this.events.removeItem(event);
			}
			position = position + 1;
		}
		eventsToDispatch.forEach((event): void | Promise<void> => event.callback.dispatch(event, callback));
	}

	/**
	 * @description Dispatch event for a provided name and an aggregate id.
	 * @param id aggregate id.
	 * @returns promise void.
	 */
	public static async dispatchAll(id: UID, handler?: EventHandler<IAggregate<any>, void>): Promise<void> {
		const log = (): void => console.log('None handler provided');
		const callback: EventHandler<IAggregate<any>, void> = handler ? handler : ({ execute: (): void => { log(); } });
		const eventsToDispatch: Array<IDomainEventPayload<IAggregate<any>>> = [];
		const events = this.events.toArray();
		let position = 0;
		while (events[position]) {
			const event = events[position];
			if (event.aggregate.id.equal(id)) {
				eventsToDispatch.push(event);
				this.events.removeItem(event);
			}
			position = position + 1;
		}
		eventsToDispatch.forEach((event): void | Promise<void> => event.callback.dispatch(event, callback));
	}

	/**
	 * @description Delete an event from state.
	 * @param options to find event to be deleted.
	 */
	public static deleteEvent(options: IDispatchOptions): void {
		const events = this.events.toArray();
		let position = 0;
		while (events[position]) {
			const event = events[position];
			const target = Reflect.getPrototypeOf(event.callback);
			const eventName = event.callback?.eventName ?? target?.constructor.name;

			if (event.aggregate.id.equal(options.id) && (options.eventName === eventName)) {
				this.events.removeItem(event);
			}
			position = position + 1;
		}
	}
}
