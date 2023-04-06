import { EntityProps, EventHandler, IAggregate, IHandle, IReplaceOptions, ISettings, UID } from "../types";
import DomainEvent from "./domain-event";
import Entity from "./entity";
import DomainEvents from "./events";
import ID from "./id";

 export class Aggregate<Props extends EntityProps> extends Entity<Props> implements IAggregate<Props> {

	constructor(props: Props, config?: ISettings) { 
		super(props, config);
	}

	public hashCode(): UID<string> {
		const name = Reflect.getPrototypeOf(this);
		return ID.create(`[Aggregate@${name?.constructor.name}]:${this.id.value}`);
	}

	dispatchEvent(eventName?: string, handler?: EventHandler<IAggregate<any>, void>): Promise<void> {
		if(eventName) return DomainEvents.dispatch({ id: this.id, eventName }, handler);
		return DomainEvents.dispatchAll(this.id, handler);
	}

	addEvent(event: IHandle<IAggregate<Props>>, replace?: IReplaceOptions): void {
		const doReplace = replace === 'REPLACE_DUPLICATED';
		DomainEvents.addEvent<Props>({ event: new DomainEvent(this, event), replace: doReplace });
	}

	deleteEvent(eventName: string): void {
		DomainEvents.deleteEvent({ eventName, id: this.id });
	}
}
export default Aggregate;
