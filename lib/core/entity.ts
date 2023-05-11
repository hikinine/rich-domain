import validator from "../utils/validator";
import { Id } from "./Id";
import { AutoMapper } from "./auto-mapper";
import { EntityMetaHistory } from "./history";
import { EntityProps } from "./types";


export abstract class Entity<Props extends EntityProps> {
  public constructorName = "Entity"
  protected _id: Id;
  protected props: Props
  protected autoMapper: AutoMapper<Props>
  protected metaHistory: EntityMetaHistory<Props>


  get history() {
    return this.metaHistory
  }
  constructor(props: Props) {
    this.registerTimestampSignature(props)
    const id = this.generateOrAssignId(props)
    this._id = id;
    props.id = id;
    
    this.metaHistory = new EntityMetaHistory<Props>(props)
    this.autoMapper = new AutoMapper<Props>()
    this.props = props
    const self = this;
    const handler = function (keyProp?: string): ProxyHandler<Props> {
      return {
        get: function (target, prop) {
          if (
            //should refactor. typeof object && !== null doesnt work somehow
            ['[object Object]', '[object Array]'].indexOf(
              Object.prototype.toString.call(target[prop]),
            ) > -1
          ) {
            return new Proxy(target[prop], handler(prop as string));
          }
          return Reflect.get(target, prop);
        },
        set: function (target, prop, value, receiver) {
          const oldValue = Reflect.get(target, prop, receiver)
          if (!Array.isArray(receiver)) {
            self.metaHistory.addSnapshot(self.props, prop, oldValue, value)
          }
          else if (prop !== 'length') {
            self.metaHistory.addSnapshot(self.props, keyProp, oldValue, value, Number(prop))
          }
          Reflect.set(target, prop, value, receiver)
          return true;
        },
      };
    };
    const proxy = new Proxy<Props>(this.props, handler());
    this.props = proxy
  }

  get createdAt() {
    return this.props?.createdAt;
  }
  get updatedAt() {
    return this.props?.updatedAt;
  }
  get id(): Id {
    return this._id;
  }

  public clone(): Entity<Props> {
    const instance = Reflect.getPrototypeOf(this);
    const args = [this.props];
    const entity = Reflect.construct(instance!.constructor, args);
    return entity
  }

  public isNew(): boolean {
    return this.id.isNew();
  }

  public toPrimitives() {
    return this.autoMapper.entityToObj(this)
  }

  public hashCode(): Id {
    const name = Reflect.getPrototypeOf(this);
    return Id.create(`[Entity@${name?.constructor?.name}]:${this.id.value}`).getValue() as Id;
  }

  public isEqual(other: Entity<Props>): boolean {
    const currentProps = Object.assign({}, {}, { ...this.props });
    const providedProps = Object.assign({}, {}, { ...other.props });
    delete currentProps?.['createdAt'];
    delete currentProps?.['updatedAt'];
    delete providedProps?.['createdAt'];
    delete providedProps?.['updatedAt'];
    const equalId = this.id.equal(other.id);
    const serializedA = JSON.stringify(currentProps);
    const serializedB = JSON.stringify(providedProps);
    const equalSerialized = serializedA === serializedB;
    return equalId && equalSerialized;
  }



  private generateOrAssignId(props: Props) {
    const { id } = props
    const isID = validator.isID(id);
    const isString = validator.isString(id)
    const newId = isString ? Id.create(id as any).getValue() : isID ? id : Id.create().getValue();
    return newId! as Id
  }

  private registerTimestampSignature(props: Props) {
    const now = Date.now()
    props.createdAt = new Date(props.createdAt || now)
    props.updatedAt = new Date(props.updatedAt || now)
  }
}