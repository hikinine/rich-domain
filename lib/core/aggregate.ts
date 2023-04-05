import { EntityProps, EventHandler, IAggregate, IHandle, IReplaceOptions, ISettings, UID } from "../types";
import DomainEvent from "./domain-event";
import Entity from "./entity";
import DomainEvents from "./events";
import ID from "./id";

 export class Aggregate<Props extends EntityProps> extends Entity<Props> implements IAggregate<Props> {

	constructor(props: Props, config?: ISettings) { 
		super(props, config);
	}

	/**
	 * @description Get hash to identify the aggregate.
	 * @returns Aggregate hash as ID instance.
	 * @example 
	 * `[Aggregate@ClassName]:UUID`
	 * 
	 * @summary className is defined on constructor config param
	 */
	public hashCode(): UID<string> {
		const name = Reflect.getPrototypeOf(this);
		return ID.create(`[Aggregate@${name?.constructor.name}]:${this.id.value()}`);
	}

	/**
	 * @description Dispatch event added to aggregate instance
	 * @param eventName optional event name as string. If provided only event match name is called.
	 * @returns Promise void as executed event
	 */
	dispatchEvent(eventName?: string, handler?: EventHandler<IAggregate<any>, void>): Promise<void> {
		if(eventName) return DomainEvents.dispatch({ id: this.id, eventName }, handler);
		return DomainEvents.dispatchAll(this.id, handler);
	}

	/**
	 * @description Add event to aggregate
	 * @param event Event to be dispatched
	 * @param replace 'REPLACE_DUPLICATED' option to remove old event with the same name and id
	 */
	addEvent(event: IHandle<IAggregate<Props>>, replace?: IReplaceOptions): void {
		const doReplace = replace === 'REPLACE_DUPLICATED';
		DomainEvents.addEvent<Props>({ event: new DomainEvent(this, event), replace: doReplace });
	}

	/**
	 * @description Delete event match with provided name
	 * @param eventName event name as string
	 */
	deleteEvent(eventName: string): void {
		DomainEvents.deleteEvent({ eventName, id: this.id });
	}
}
export default Aggregate;
