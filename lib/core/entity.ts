import lodash from "lodash";
import validator from "../utils/validator";
import { AutoMapperEntity } from "./auto-mapper-entity";
import { DomainError } from "./errors";
import { EntityMetaHistory } from "./history";
import { HooksConfig, WithoutEntityProps } from "./hooks";
import { Id } from "./ids";
import { proxyHandler } from "./proxy";
import { RevalidateError } from "./revalidate-error";
import { AutoMapperSerializer, EntityProps, IEntity, WithDate } from "./types";

export interface EntityConfig {
  isAggregate?: boolean
  preventSubscribeOfChanges?: boolean
}


export abstract class Entity<Props extends EntityProps> implements IEntity<Props> {
  protected static autoMapper = new AutoMapperEntity();
  protected abstract hooks: HooksConfig<this, Props>;
  public isEntity = true;

  protected rulesIsLocked: boolean = false;
  private _id: Id;
  private _createdAt: Date;
  private _updatedAt: Date | null = null;
  protected props: Props
  protected metaHistory: EntityMetaHistory<Props> | null

  constructor(input: Props, options?: EntityConfig);
  constructor(input: WithDate<Props>, options?: EntityConfig)
  constructor(props: Props | WithDate<Props>, options: EntityConfig = {}) {
    if (props instanceof Entity) {
      throw new DomainError('Entity instance cannot be passed as argument')
    }

    this._createdAt = props.createdAt ?? new Date()
    this._updatedAt = props.updatedAt ?? null
    this.removeTimestampSignatureFromProps(props)

    const assignedId = this.generateOrAssignId(props)
    this._id = assignedId
    props.id = assignedId

    this.props = props
    this.metaHistory = null;
    if (!options?.preventSubscribeOfChanges) {
      const proxy = new Proxy<Props>(this.props, proxyHandler(this));
      this.props = proxy;
      this.metaHistory = new EntityMetaHistory<Props>(proxy, {
        onAddedSnapshot: (snapshot) => {
          const field = snapshot.getUpdatedField<Props>()
          this.revalidate(field as keyof WithoutEntityProps<Props>)
          if (!this.rulesIsLocked) {
            this.ensureBusinessRules()
          }

          if (typeof this.hooks?.onChange === 'function') {
            this.hooks.onChange(this as any, snapshot)
          }
        }
      })
    }

    if (!options?.isAggregate) {
      this.onEntityCreate()
    }

    this.revalidate();
    this.ensureBusinessRules()
  }

  // Dispatch Entity Hook Validation
  public revalidate(fieldToRevalidate?: keyof WithoutEntityProps<Props>) {
    const typeValidation = this.hooks?.typeValidation as any
    if (!typeValidation) return;

    if (!(this?.hooks?.typeValidation)) {
      return;
    }
    if (fieldToRevalidate) {
      const value = this.props[fieldToRevalidate]
      const validation = typeValidation[fieldToRevalidate]
      const errorMessage = validation?.(value)
      if (errorMessage) {
        const expected = typeValidation[fieldToRevalidate]?.name
        const field = fieldToRevalidate.toString()
        throw RevalidateError(errorMessage, value, expected, field)
      }
    }
    else {
      Object.entries(typeValidation)
        .forEach(([field, validation]: any) => {
          const value = this.props[field as keyof Props]
          const errorMessage = validation(value)
          if (errorMessage) {
            throw RevalidateError(errorMessage, value, validation.name, field)
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

  private onEntityCreate() {
    this?.hooks?.onCreate?.(this as any)
  }
  public ensureBusinessRules() {
    this?.hooks?.rules?.(this as any)
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
    return new Id(`entity@${name?.constructor?.name}:${this.id.value}`)
  }


  protected customizedIsEqual(first: any, second: any) {
    if (first instanceof Date || second instanceof Date) {
      return true;
    }
  }
  public isEqual(other: IEntity<Props>): boolean {
    const thisProps = this['props']
    const otherProps = other['props']
    const currentProps = lodash.cloneDeep(thisProps)
    const providedProps = lodash.cloneDeep(otherProps)
    const equalId = this.id.isEqual(other.id as Id);
    return equalId && lodash.isEqual(currentProps, providedProps);
  }

  private generateOrAssignId(props: Props): Id {
    const { id } = props
    const isAlreadyAnIdInstance = validator.isID(id);
    if (isAlreadyAnIdInstance) return id as Id;
    if (validator.isString(id)) {
      return new Id(id as any)
    }
    return new Id()
  }

  private removeTimestampSignatureFromProps(props: Props) {
    delete props?.createdAt
    delete props?.updatedAt
  }
}
