import validator from "../utils/validator";
import { Id } from "./Id";
import { AutoMapper } from "./auto-mapper";
import { EntityMetaHistory } from "./history";
import { proxyHandler } from "./proxy";
import { EntityProps } from "./types";


export interface EntityConfig {
  isAggregate?: boolean
}
export abstract class Entity<Props extends EntityProps> {
  public constructorName = "Entity"
  protected _id: Id;
  protected props: Props
  protected autoMapper: AutoMapper<Props>
  protected metaHistory: EntityMetaHistory<Props>


  get history() {
    return this.metaHistory
  }
  constructor(input: Props, options?: EntityConfig) {

    const instance = this.constructor as typeof Entity<any>
    const props = instance?.transform?.(input);
    instance?.validation?.(props)
    instance?.rules?.(props)

    this.registerTimestampSignature(props)
    const id = this.generateOrAssignId(props)
    this._id = id;
    props.id = id;


    this.autoMapper = new AutoMapper<Props>()
    this.props = props
    const proxy = new Proxy<Props>(this.props, proxyHandler(this));
    this.props = proxy;
    this.metaHistory = new EntityMetaHistory<Props>(proxy, {
      onAddedSnapshot: (snapshot) => {
        instance?.onChange(this, snapshot)
      }
    })
    if (!options?.isAggregate) {
      instance?.onCreate?.(this)
    }
  }

  protected static onChange(entity: any, snapshot: any): any { return Boolean(entity & snapshot) }
  protected static onCreate(entity: any): any { return Boolean(entity) }
  protected static validation(
    props?: any
  ): any {
    return props
  }
  protected static transform(props: any): any {
    return props
  }
  protected static rules(props: any): any {
    return Boolean(props)
  }

  protected validate() {
    const instance = this.constructor as typeof Entity<any>
    instance?.validation?.(this.props);
  }

  protected ensureBusinessRules() {
    const instance = this.constructor as typeof Entity<any>
    instance?.rules?.(this.props);
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


  public static fromPlainObject<T = any>(plain: any): T {
    const props = plain.props;
    const entity = Reflect.construct(this, [props]);
    return entity
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
    return new Id(`[Entity@${name?.constructor?.name}]:${this.id.value}`)
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
    const newId = isString ? new Id(id as any) : isID ? id : new Id()
    return newId! as Id
  }

  private registerTimestampSignature(props: Props) {
    const now = Date.now()
    props.createdAt = new Date(props.createdAt || now)
    props.updatedAt = new Date(props.updatedAt || now)
  }
}