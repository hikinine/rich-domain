import validator from "../utils/validator";
import { Id } from "./Id";
import { AutoMapper } from "./auto-mapper";
import { EntityProps } from "./types";


export abstract class Entity<Props extends EntityProps> {
  public constructorName = "Entity"
  protected _id: Id;
  protected props: Props
  protected autoMapper: AutoMapper<Props>

  constructor(props: Props) {
    this.transformAndValidate(props)
    this.registerTimestampSignature(props)
    this.autoMapper = new AutoMapper<Props>()

    const id = this.generateOrAssignId(props)
    this._id = id;
    props.id = id;

    this.props = props
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
  
  public enforceBusinessRules() {
    const instance = this.constructor as typeof Entity<Props>
    instance?.validate?.(this.props)
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
    return new Id(`[Entity@${name?.constructor?.name}]:${this.id.value}`);
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
    const newId = isString ? new Id(id as any) : isID ? id : new Id();
    return newId! as Id
  }

  private transformAndValidate(props: Props) {
    const instance = this.constructor as typeof Entity<Props>
    instance?.transform?.(props);
    instance?.validate?.(props)
  }

  private registerTimestampSignature(props: Props) {
    const now = Date.now()
    props.createdAt = new Date(props.createdAt || now)
    props.updatedAt = new Date(props.updatedAt || now)
  }

  protected static transform: (props: any) => void
  protected static validate: (props: any) => void
}