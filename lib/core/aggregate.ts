import { DomainEvent, EntityProps, EventHandler, IAggregate, IDomainEventPayload, IReplaceOptions, UID } from "../types";
import { DomainEventPayload } from "./domain-event-payload";
import Entity from "./entity";
import ID from "./id";

export abstract class Aggregate<Props extends EntityProps> extends Entity<Props> implements IAggregate<Props> {
	private domainEvents: IDomainEventPayload<IAggregate<Props>>[]

	constructor(props: Props) {
		super(props);
		this.domainEvents = []
	}


	public hashCode(): UID<string> {
		const name = Reflect.getPrototypeOf(this);
		return ID.create(`[Aggregate@${name?.constructor.name}]:${this.id.value}`);
	}

	dispatchEvent(eventName: string, handler?: EventHandler<IAggregate<Props>>) {
		const callback = handler || ({ execute: (): void => { } });

		for (const event of this.domainEvents) {
			if (event.aggregate.id.equal(this.id) && event.callback.eventName === eventName) {
				event.callback.dispatch(event, callback)
				this.deleteEvent(eventName)
			}
		}
	}

	addEvent(eventToAdd: DomainEvent<IAggregate<Props>>, replace?: IReplaceOptions): void {
		const doReplace = replace === 'REPLACE_DUPLICATED';
		const event = new DomainEventPayload(this, eventToAdd);
		const target = Reflect.getPrototypeOf(event.callback);
		const eventName = event.callback?.eventName ?? target?.constructor.name as string;
		event.callback.eventName = eventName;
		if (!!doReplace) this.deleteEvent(eventName);
		this.domainEvents.push(event);
	}

	deleteEvent(eventName: string): void {
	
		this.domainEvents = this.domainEvents.filter(
			domainEvent => (domainEvent.callback.eventName !== eventName) 
		);
	}
}
export default Aggregate;



