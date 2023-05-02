import validator from "../utils/validator";
import { Id } from "./Id";
import { AutoMapper } from "./auto-mapper";
import { EntityMetaHistory } from "./history";
import { EntityProps } from "./types";


export abstract class BaseEntity<Props extends EntityProps> {
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

    const handler = function (): ProxyHandler<Props> {
      return {
        get: function (target, prop) {
          if (['[object Object]', '[object Array]'].indexOf(Object.prototype.toString.call(target[prop])) > -1) {
            return new Proxy(target[prop], handler());
          }
          return target[prop];
        },
        set: function (target, prop, value, receiver) {
          const oldValue = Reflect.get(target, prop, receiver)
          self.metaHistory.addSnapshot(self.props, prop, oldValue, value)
          Reflect.set(target, prop, value, receiver)
          return true;
        }
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

  public clone(): BaseEntity<Props> {
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
    return new Id(`[Entity@${name?.constructor?.name}]:${this.id.value}`);
  }



  public isEqual(other: BaseEntity<Props>): boolean {
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
    const newId = isString ? new Id(id as any) : isID ? id : new Id();
    return newId! as Id
  }

  private registerTimestampSignature(props: Props) {
    const now = Date.now()
    props.createdAt = new Date(props.createdAt || now)
    props.updatedAt = new Date(props.updatedAt || now)
  }
}