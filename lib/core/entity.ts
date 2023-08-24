import lodash from "lodash";
import validator from "../utils/validator";
import { Id } from "./Id";
import { AutoMapper } from "./auto-mapper";
import { DomainError } from "./errors";
import { EntityMetaHistory } from "./history";
import { HooksConfig } from "./hooks";
import { proxyHandler } from "./proxy";
import { EntityProps } from "./types";

export interface EntityConfig {
  isAggregate?: boolean
}

export abstract class Entity<Props extends EntityProps> {
  protected static hooks: HooksConfig<Entity<any>, any> = {}

  public constructorName = "Entity"
  protected _id: Id;
  protected _createdAt: Date = new Date();
  protected _updatedAt: Date = new Date();
  protected props: Props
  protected autoMapper: AutoMapper<Props>
  protected metaHistory: EntityMetaHistory<Props>

  constructor(input: Props, options?: EntityConfig) {
    this.autoMapper = new AutoMapper<Props>();

    
    const instance = this.constructor as typeof Entity<any>
    const props = instance?.hooks?.transformBeforeCreate?.(input) as Props || input

    this.registerTimestampSignature(props)
    const id = this.generateOrAssignId(props)
    this._id = id;
    props.id = id;

    this.props = props
    const proxy = new Proxy<Props>(this.props, proxyHandler(this));
    this.props = proxy;
  
    this.revalidate();
    instance?.hooks?.rules?.(props);

    if (!options?.isAggregate) {
      instance?.hooks?.onCreate?.(this as Entity<Props>)
    }

    this.metaHistory = new EntityMetaHistory<Props>(proxy, {
      onAddedSnapshot: (snapshot) => {
        if (typeof instance?.hooks?.onChange === 'function') {
          instance.hooks.onChange(this as Entity<Props>, snapshot)
          instance?.hooks?.rules?.(props);
        }
      }
    })

  }

  // Dispatch Entity Hook Validation
  public revalidate() {
    const instance = this.constructor as typeof Entity<any>;
    
    if (instance?.hooks?.schema) {
      const result = instance.hooks.schema.safeParse(this.props)

      if (!result.success) {
        throw new DomainError('Falha de validação.', result.error)

      }
    }
  }

  //Dispatch Entity Hook  Rules
  public ensureBusinessRules() {
    const instance = this.constructor as typeof Entity<any>
    instance?.hooks?.rules?.(this.props);
  }

  get history() {
    return this.metaHistory
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  get createdBy() {
    return this.props?.createdBy || null;
  }

  get updatedBy() {
    return this.props?.updatedBy || null;
  }

  get id(): Id {
    return this._id;
  }

  public setAuthor(createdBy: string) {
    this.props.createdBy = createdBy;
    this.props.updatedBy = createdBy;
  }

  public setAuthorChange(updatedBy: string) {
    this.props.updatedBy = updatedBy;
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

  protected customizedIsEqual(first: any, second: any) {
    if (first instanceof Date || second instanceof Date) {
      return true;
    }
  }

  public isEqual(other: Entity<Props>): boolean {
    const currentProps = lodash.cloneDeep(this.props)
    const providedProps = lodash.cloneDeep(other.props)
    const equalId = this.id.equal(other.id);
    return equalId && lodash.isEqual(currentProps, providedProps);
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
    this._createdAt = new Date(props?.createdAt || now)
    this._updatedAt = new Date(props?.updatedAt || now)

    delete props?.createdAt
    delete props?.updatedAt
  }

  public static fromPlainObject<T = any>(plain: any): T {
    const props = plain.props;
    const entity = Reflect.construct(this, [props]);
    return entity
  }
}