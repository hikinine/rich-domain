import { Id } from "./Id";
import { DomainEvent } from "./domain-event";
import { BaseEntity } from "./entity";
import { DomainEventReplaceOptions, EntityProps, EventPublisher, IDomainEvent } from "./types";

export abstract class BaseAggregate<Props extends EntityProps> extends BaseEntity<Props> {

  private domainEvents: Array<IDomainEvent<BaseAggregate<Props>>>;

  constructor(props: Props) {
    super(props)
    this.domainEvents = new Array<IDomainEvent<BaseAggregate<Props>>>();
  }

  public hashCode() {
    const name = Reflect.getPrototypeOf(this);
    return new Id(`[Aggregate@${name?.constructor.name}]:${this.id.value}`);
  }

  public addEvent(
    domainEvent: DomainEvent<BaseAggregate<Props>>,
    replace?: DomainEventReplaceOptions
  ) {
    const shouldReplace = replace === 'REPLACE_DUPLICATED';
    
    if (Boolean(shouldReplace)) {
      this.removeEvent(domainEvent.eventName);
    }
    this.domainEvents.push(domainEvent);
  }

  public clearEvents() {
    this.domainEvents.splice(0, this.domainEvents.length);
  }

  public removeEvent(eventName: string) {
    this.domainEvents = this.domainEvents.filter(
      (domainEvent) => domainEvent.eventName !== eventName
    );
  }

  public dispatch(eventName: string, eventPublisher: EventPublisher<BaseAggregate<Props>>) {
    for (const event of this.domainEvents) {
      if (event.aggregate.id.equal(this.id) && event.eventName === eventName) {
        eventPublisher.publish(event);
        this.removeEvent(eventName);
      }
    }
  }

  public dispatchAll(eventPublisher: EventPublisher<BaseAggregate<Props>>) {
    for (const event of this.domainEvents) {
      eventPublisher.publish(event);
    }
  }
}