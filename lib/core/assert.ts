import ValueObject from "./value-object";


export class EntityAssert<Props> {
  private props: Props;
  private _key?: keyof Props;
  private stateRequired: boolean
  private instanceError: typeof Error = Error

  constructor(props: Props) {
    this.stateRequired = true
    this.props = props
  }

  private get value() {
    if (this._key) {
      return this.props[this._key];
    }
    return null;
  }

  throws(instanceError: typeof Error) {
    this.instanceError = instanceError
    return this  as Pick<EntityAssert<Props>, "key">;
  }

  key(keyName: keyof Props) {
    this._key = keyName
    this.stateRequired = false;
    return this as Pick<EntityAssert<Props>, "isRequired" | "nullable">;
  }

  nullable() {
    this.stateRequired = false
    return this as Pick<EntityAssert<Props>, "instanceOf">;
  }
  isRequired() {
    this.stateRequired = true
    return this as Pick<EntityAssert<Props>, "instanceOf">;
  }

  instanceOf(
    entityAndException: [
      typeof ValueObject<any> | any,
      string?
    ]
  ) {

    const [constructor, exception] = entityAndException

    if (!this.value) {
      if (this.stateRequired) {
        throw new this.instanceError(exception)
      }
    }

    if (!(this.value instanceof constructor)) {
      throw new this.instanceError(exception)
    }

    return this as Pick<EntityAssert<Props>, "key">;
  }
}