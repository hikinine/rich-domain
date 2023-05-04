import { Id } from "./Id";
import { DomainEvent } from "./domain-event";
import { Entity } from "./entity";
import { DomainEventReplaceOptions, EntityProps, EventPublisher, IDomainEvent } from "./types";

export abstract class Aggregate<Props extends EntityProps> extends Entity<Props> {

  private domainEvents: Array<IDomainEvent<Aggregate<Props>>>;

  constructor(props: Props) {
    super(props)
    this.domainEvents = new Array<IDomainEvent<Aggregate<Props>>>();
  }

  public hashCode() {
    const name = Reflect.getPrototypeOf(this);
    return Id.create(`[Aggregate@${name?.constructor.name}]:${this.props.id}`).getValue() as Id;
  }

  public addEvent(
    domainEvent: DomainEvent<Aggregate<Props>>,
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

  public dispatch(eventName: string, eventPublisher: EventPublisher<Aggregate<Props>>) {
    for (const event of this.domainEvents) {
      if (event.aggregate.id.equal(this.id) && event.eventName === eventName) {
        eventPublisher.publish(event);
        this.removeEvent(eventName);
      }
    }
  }

  public dispatchAll(eventPublisher: EventPublisher<Aggregate<Props>>) {
    for (const event of this.domainEvents) {
      eventPublisher.publish(event);
    }
  }
}