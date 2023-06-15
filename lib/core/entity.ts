import lodash from "lodash";
import validator from "../utils/validator";
import { Id } from "./Id";
import { AutoMapper } from "./auto-mapper";
import { EntityValidation } from "./entity-validation";
import { DomainError } from "./errors";
import { EntityMetaHistory } from "./history";
import { HooksConfig, defaultOnValidationError } from "./hooks";
import { proxyHandler } from "./proxy";
import { EntityProps } from "./types";


export interface EntityConfig {
  isAggregate?: boolean
}
export abstract class Entity<Props extends EntityProps> {
  protected static hooks: HooksConfig<Entity<any>, EntityProps>

  public constructorName = "Entity"
  protected _id: Id;
  protected _createdAt: Date = new Date();
  protected _updatedAt: Date = new Date();
  protected props: Props
  protected autoMapper: AutoMapper<Props>
  protected metaHistory: EntityMetaHistory<Props>

  get history() {
    return this.metaHistory
  }
  constructor(input: Props, options?: EntityConfig) {
    const instance = this.constructor as typeof Entity<any>
    const props = instance?.hooks?.transformBeforeCreate?.(input) as Props || input

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
        instance?.hooks?.onChange?.(this as Entity<Props>, snapshot)
      }
    })

    this.internalValidation(instance)
    instance?.hooks.rules?.(props);

    if (!options?.isAggregate) {
      instance?.hooks?.onCreate?.(this as Entity<Props>)
    }
  }

  private internalValidation(instance: typeof Entity<Props>) {
    if (instance?.hooks?.schema) {
      const validator = new EntityValidation(this.props)
      const validation = validator.fromSchema(instance?.hooks?.schema, {
        onError: instance?.hooks?.onValidationError || defaultOnValidationError,
      })

      if (validation.hasErrors()) {
        const [{ message, metadata }] = validation.errors;
        throw new DomainError(message, metadata);
      }
    } 
  }
  // Dispatch Entity Hook Validation
  revalidate() {
    const instance = this.constructor as typeof Entity<any>
    this.internalValidation(instance)
  }

  //Dispatch Entity Hook  Rules
  ensureBusinessRules() {
    const instance = this.constructor as typeof Entity<any>
    instance?.hooks?.rules?.(this.props);
  }

  revalidateAndEnsureBusinessRules() {
    this.revalidate()
    this.ensureBusinessRules()
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
    this._createdAt = new Date(props.createdAt || now)
    this._updatedAt = new Date(props.updatedAt || now)

    delete props?.createdAt
    delete props?.updatedAt
  }
}