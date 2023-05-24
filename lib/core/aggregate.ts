import { Id } from "./Id";
import { DomainEvent } from "./domain-event";
import { Entity } from "./entity";
import { DomainEventReplaceOptions, EntityProps, EventPublisher, IDomainEvent } from "./types";


const DOMAIN_EVENTS = Symbol();
export abstract class Aggregate<Props extends EntityProps> extends Entity<Props> {

  private [DOMAIN_EVENTS]: IDomainEvent<Aggregate<Props>>[] = []

  constructor(props: Props,) {
    super(props, { isAggregate: true })

    const instance = this.constructor as typeof Entity<any>
    instance?.onCreate?.(this)
  }

  public hashCode() {
    const name = Reflect.getPrototypeOf(this);
    return new Id(`[Aggregate@${name?.constructor.name}]:${this.props.id}`)
  }

  public addEvent(
    domainEvent: DomainEvent<Aggregate<Props>>,
    replace?: DomainEventReplaceOptions
  ) {
    const shouldReplace = replace === 'REPLACE_DUPLICATED';

    if (Boolean(shouldReplace)) {
      this.removeEvent(domainEvent.eventName);
    }
    this[DOMAIN_EVENTS].push(domainEvent);
  }

  public clearEvents() {
    this[DOMAIN_EVENTS].splice(0, this[DOMAIN_EVENTS].length);
  }

  public removeEvent(eventName: string) {
    this[DOMAIN_EVENTS] = this[DOMAIN_EVENTS].filter(
      (domainEvent) => domainEvent.eventName !== eventName
    );
  }

  public async dispatch(eventName: string, eventPublisher: EventPublisher<Aggregate<Props>>) {
    const promisesQueue = [] as any[];
    for (const event of this[DOMAIN_EVENTS]) {
      if (event.aggregate.id.equal(this.id) && event.eventName === eventName) {
        promisesQueue.push(eventPublisher.publish(event))
        this.removeEvent(eventName);
      }
    }
    await Promise.all(promisesQueue);
  }

  public async dispatchAll(eventPublisher: EventPublisher<Aggregate<Props>>) {
    const promisesQueue = [] as any[];
    for (const event of this[DOMAIN_EVENTS]) {
      promisesQueue.push(eventPublisher.publish(event))
    }
    await Promise.all(promisesQueue);
    this.clearEvents();
  }
}