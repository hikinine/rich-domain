


export class EntityAssert<Props> {
  private props: Props | null;
  private isDone: boolean
  private internalKeyState?: keyof Props;
  private stateRequired?: boolean
  private instanceError?: typeof Error = Error

  constructor(props: Props) {
    this.stateRequired = true
    this.isDone = false
    this.props = props
  }

  private get value() {
    if (this.internalKeyState) {
      return (this.props as Props)[this.internalKeyState];
    }
    return null;
  }

  throws(instanceError: typeof Error | any) {
    this.instanceError = instanceError
    return this as Pick<EntityAssert<Props>, "key">;
  }

  key(keyName: keyof Props) {
    this.internalKeyState = keyName
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
      any,
      string?
    ]
  ) {

    const [constructor, exception] = entityAndException

    if (!this.value) {
      if (this.stateRequired) {
        throw new this.instanceError!(exception)
      }
    }

    else if (!(this.value instanceof constructor)) {
      throw new this.instanceError!(exception)
    }

    return this as Pick<EntityAssert<Props>, "key" | "free">;
  }

  free() {
    this.props = null;
    delete this.internalKeyState
    delete this.stateRequired
    delete this.instanceError

    if (!this.isDone)
      this.isDone = true
  }
}