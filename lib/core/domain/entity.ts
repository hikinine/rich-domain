import lodash from "lodash";
import { deepFreeze } from "../../utils/deep-freeze";
import { lodashCompare } from "../../utils/lodash-compare";
import { DomainError } from "../errors";
import { AutoMapperSerializer, EntityCompareResult, EntityConfig, EntityProps, HistorySubscribe, IEntity, ISnapshot, WithDate, WithoutEntityProps } from "../interface/types";
import { AutoMapperEntity } from "./auto-mapper-entity";
import { EntityMetaHistory } from "./history";
import { EntityHook } from "./hooks";
import { Id } from "./ids";
import { proxyHandler } from "./proxy";
import { RevalidateError } from "./revalidate-error";

export abstract class Entity<Props extends EntityProps, Input extends Partial<Props> = Props> implements IEntity<Props> {
  protected static autoMapper = new AutoMapperEntity();
  protected static hooks: EntityHook<any, any>;

  public isEntity = true;

  private _id: Id | null = null
  private _createdAt: Date | null = null
  private _updatedAt: Date | null = null;
  protected props: Props
  protected metaHistory: EntityMetaHistory<Props> | null = null
  protected rulesIsLocked: boolean = false;

  constructor(input: Input, options?: EntityConfig);
  constructor(input: Props, options?: EntityConfig);
  constructor(input: WithDate<Props>, options?: EntityConfig)
  constructor(input: Props | WithDate<Props> | Input, options: EntityConfig = {}) {
    const instance = this.constructor as typeof Entity<Props>

    if (!input || typeof input !== 'object') {
      throw new DomainError('Entity input must be an object reference to "' + instance?.name + 'Props"')
    }

    if (input instanceof Entity) {
      throw new DomainError('Entity instance cannot be passed as argument')
    }

    this.props = this.transformBeforeCreate(input as Input)
    this.generateOrAssignId(this.props)
    this.assignAndRemoveTimestampSignatureFromProps(this.props)
    this.revalidate();
    this.ensureBusinessRules()

    if (!options?.isAggregate) {
      this.onEntityCreate()
    }

    if (!options?.preventHistoryTracker) {
      this.props = this.generateProxyProps() 
      const self = this

      const onAddedSnapshot = (snapshot: ISnapshot<Props>) => {
        const field = snapshot.trace.update
        self.revalidate(field as keyof WithoutEntityProps<Props>)
        if (!self.rulesIsLocked) {
          self.ensureBusinessRules()
        }

        if (typeof instance?.hooks?.onChange === 'function') {
          instance.hooks.onChange(self, snapshot)
          if (options.isAggregate)
            self.history.deepWatch(self, instance.hooks.onChange);
        }
      }

      this.metaHistory = new EntityMetaHistory<Props>(this.props, { onAddedSnapshot });

      if (options.isAggregate && typeof instance?.hooks?.onChange === 'function') {
        this.history.deepWatch(this, instance.hooks.onChange)
      }
    }
  }


  public subscribe(props: HistorySubscribe<Props>) {
    if (!this.history) {
      throw new DomainError('History is not enabled for this entity')
    }
    return this.history.subscribe(this, props)
  }

  // Dispatch Entity Hook Validation
  public revalidate(fieldToRevalidate?: keyof WithoutEntityProps<Props>) {
    const instance = this.constructor as typeof Entity<Props>
    const typeValidation = instance.hooks?.typeValidation
    if (!typeValidation) return;

    if (fieldToRevalidate) {
      const value = this.props[fieldToRevalidate]
      const validation = typeValidation[fieldToRevalidate]
      const errorMessage = validation?.(value)
      if (errorMessage) {
        const fieldMessage = `. field=${fieldToRevalidate?.toString()} instance=${instance?.name}`
        const expected = typeValidation[fieldToRevalidate]?.name
        const field = fieldToRevalidate.toString()
        throw RevalidateError(errorMessage + fieldMessage, value, expected!, field)
      }
    }
    else {
      Object.entries(typeValidation)
        .forEach(([field, validation]: any) => {
          const value = this.props[field as keyof Props]
          const errorMessage = validation(value)
          if (errorMessage) {
            const fieldMessage = `. field=${field?.toString()} instance=${instance?.name}`
            throw RevalidateError(errorMessage + fieldMessage, value, validation?.name, field)
          }
        })
    }
  }

  /**
    @deprecated
    This method will throw an error if called.
   */
  public getRawProps(): Props {
    throw new DomainError('Method .getRawProps() is not allowed.')
  }

  public ensureBusinessRules() {
    const instance = this.constructor as typeof Entity<Props>
    instance?.hooks?.rules?.(this)
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
    if (!this._id) {
      throw new DomainError('Entity id is not defined')
    }

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

  public toPrimitives(): Readonly<AutoMapperSerializer<Props>> {
    const result = Entity.autoMapper.entityToObj<Props>(this)
    const frozen = deepFreeze(result)
    return frozen
  }

  public toJSON(): Readonly<AutoMapperSerializer<Props>> {
    return this.toPrimitives()
  }

  public hashCode(): Id {
    const name = Reflect.getPrototypeOf(this);
    return new Id(`entity@${name?.constructor?.name}:${this.id.value}`)
  }


  protected static fieldsToIgnoreOnComparsion = [
    'metaHistory',
    'createdAt',
    'updatedAt',
    '_createdAt',
    '_updatedAt',
    'rulesIsLocked'
  ]
  public isEqual(other?: IEntity<Props>): boolean {
    if (!other) return false
    if (!(other instanceof Entity)) return false
    if (this === other) return true

    const thisProps = this['props']
    const otherProps = other['props']
    const currentProps = lodash.cloneDeep(thisProps)
    const providedProps = lodash.cloneDeep(otherProps)
    const equalId = this.id.isEqual(other.id as Id);
    return equalId && lodash.isEqualWith(currentProps, providedProps, (_, __, key) => {
      if (Entity.fieldsToIgnoreOnComparsion.includes(key as string)) {
        return true
      }
    });
  }

  public compare(other?: Entity<Props>): EntityCompareResult {
    return lodashCompare(this.props, other?.props)
  }

  private transformBeforeCreate(props: Input | Props): Props {
    const instance = this.constructor as typeof Entity<Props>

    if (!instance?.hooks?.defaultValues) {
      return props as unknown as Props
    }

    if (instance?.hooks?.defaultValues) {
      Object.entries(instance.hooks.defaultValues).forEach(([key, defaultValue]) => {
        if (props[key] === undefined) {
          if (typeof defaultValue === 'function')
            props[key] = defaultValue?.(props[key], props)
          else
            props[key] = defaultValue
        }
      })
    }

    return props as unknown as Props
  }

  private onEntityCreate() {
    const instance = this.constructor as typeof Entity<Props>
    instance?.hooks?.onCreate?.(this)
  }
  
  private generateProxyProps() {
    return new Proxy<Props>(this.props, proxyHandler(this));
  }

  private generateOrAssignId(props: Props) {
    if (props.id instanceof Id) {
      this._id = props.id;
    }
    else {
      const id = new Id(typeof props.id === 'string' ? props.id : undefined)
      this._id = id
      props.id = id
    }
  }

  private assignAndRemoveTimestampSignatureFromProps(props: Props) {
    if (props?.createdAt) {
      this._createdAt = props.createdAt
    }
    else {
      if (props.id.isNew()) {
        this._createdAt = new Date()
      }
    }
    if (props?.updatedAt) {
      this._updatedAt = props.updatedAt
    }

    delete props?.createdAt
    delete props?.updatedAt
  }
}
