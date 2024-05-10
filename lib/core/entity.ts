import lodash from "lodash";
import validator from "../utils/validator";
import { AutoMapperEntity } from "./auto-mapper-entity";
import { DomainError } from "./errors";
import { EntityMetaHistory } from "./history";
import { HooksConfig } from "./hooks";
import { Id } from "./ids";
import { proxyHandler } from "./proxy";
import { AutoMapperSerializer, EntityProps, IEntity } from "./types";
import { ValueObject } from "./value-object";

export interface EntityConfig {
  isAggregate?: boolean
  preventRulesAndMetaHistory?: boolean
}

type WithDate<T> = T & {
  createdAt: Date,
  updatedAt?: Date
}

export abstract class Entity<Props extends EntityProps> implements IEntity<Props> {
  public isEntity = true;
  protected static autoMapper = new AutoMapperEntity();
  protected static hooks: HooksConfig<any> = {} as any

  protected rulesIsLocked: boolean = false;
  protected _id: Id;
  protected _createdAt: Date;
  protected _updatedAt: Date | null = null;
  protected props: Props
  protected metaHistory: EntityMetaHistory<Props> | null

  constructor(input: Props, options?: EntityConfig);
  constructor(input: WithDate<Props>, options?: EntityConfig)
  constructor(props: Props | WithDate<Props>, options: EntityConfig = {}) {
    const instance = this.constructor as typeof Entity<Props>;

    this._createdAt = props.createdAt ?? new Date()
    this._updatedAt = props.updatedAt ?? null
    this.removeTimestampSignatureFromProps(props)

    const id = this.generateOrAssignId(props)
    this._id = id;
    props.id = id;

    this.props = props
    this.metaHistory = null;
    if (!options?.preventRulesAndMetaHistory) {
      const proxy = new Proxy<Props>(this.props, proxyHandler(this));
      this.props = proxy;
      this.metaHistory = new EntityMetaHistory<Props>(proxy, {
        onAddedSnapshot: (snapshot) => {
          this.revalidate();
          if (!this.rulesIsLocked) {
            instance?.hooks?.rules?.(this);
          }

          if (typeof instance?.hooks?.onChange === 'function') {
            instance.hooks.onChange(this as Entity<Props>, snapshot)
          }
        }
      })
    }

    if (!options?.isAggregate) {
      instance?.hooks?.onCreate?.(this as Entity<Props>)
    }

    this.revalidate();
    instance?.hooks?.rules?.(this);
  }

  // Dispatch Entity Hook Validation
  public revalidate() {
    const instance = this.constructor as typeof Entity<Props>;
    if (instance?.hooks?.typeValidation) {
      Object.entries(instance.hooks.typeValidation)
        .forEach(([key, validation]) => {
          const value = this.props[key as keyof Props]
          const hasError = validation(value)
          if (hasError) {  
            throw new DomainError(`Erro 422. ${hasError}`, { 
              property: `${this.constructor.name}.${key}`,
              value,
              received: typeof value === 'object' 
                ? value instanceof Entity 
                  ? value.constructor.name
                : value instanceof ValueObject
                  ? value.constructor.name
                : 'Object'
                : typeof value
              ,
              expected: validation.name, 
            })
          }
        }) 
    }
  }

  public getRawProps(): Props {
    return this.props
  }

  public ensureBusinessRules() {
    const instance = this.constructor as typeof Entity<Props>
    instance?.hooks?.rules?.(this);
  }

  get history() {
    if (!this.metaHistory) {
      throw new DomainError('History is not enabled for this entity')
    }
    return this.metaHistory
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  get id(): Id {
    return this._id;
  }

  public clone(): IEntity<Props> {
    const instance = Reflect.getPrototypeOf(this);
    const args = [this.props];
    const entity = Reflect.construct(instance!.constructor, args);
    return entity
  }

  public isNew(): boolean {
    return this.id.isNew();
  }

  public toPrimitives(): AutoMapperSerializer<Props> {
    return Entity.autoMapper.entityToObj<Props>(this as any)
  }

  public hashCode(): Id {
    const name = Reflect.getPrototypeOf(this);
    return new Id(`entity@${name?.constructor?.name}]:${this.id.value}`)
  }


  protected customizedIsEqual(first: any, second: any) {
    if (first instanceof Date || second instanceof Date) {
      return true;
    }
  }
  public isEqual(other: IEntity<Props>): boolean {
    const thisProps = this.getRawProps()
    const otherProps = other.getRawProps()
    const currentProps = lodash.cloneDeep(thisProps)
    const providedProps = lodash.cloneDeep(otherProps)
    const equalId = this.id.isEqual(other.id as Id);
    return equalId && lodash.isEqual(currentProps, providedProps);
  }

  private generateOrAssignId(props: Props) {
    const { id } = props
    const isID = validator.isID(id);
    const isString = validator.isString(id)
    const newId = isString ? new Id(id as any) : isID ? id : new Id()
    return newId! as Id
  }

  private removeTimestampSignatureFromProps(props: Props) {
    delete props?.createdAt
    delete props?.updatedAt
  }
}
