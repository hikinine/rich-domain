


export class EntityAssert<Props> {
  private props: Props | null;
  private isDone: boolean
  private internalKeyState?: keyof Props;
  private stateRequired?: boolean
  private stateValidate = { shouldBeRequired: false, notInstanceof: false }
  private errors = [] as {
    message: string,
    metadata: {
      key: string,
      value: any,
      shouldBeRequired: boolean,
      notInstanceof: boolean
    }
  }[]

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

  key(keyName: keyof Props) {
    this.internalKeyState = keyName
    this.stateRequired = false;
    this.stateValidate = {
      shouldBeRequired: false,
      notInstanceof: false
    }
    return this as Pick<EntityAssert<Props>, "isRequired" | "nullable">;
  }

  nullable() {
    this.stateRequired = false
    return this as Pick<EntityAssert<Props>, "instanceOf" | "eachInstanceof">;
  }
  isRequired() {
    this.stateRequired = true
    return this as Pick<EntityAssert<Props>, "instanceOf" | "eachInstanceof">;
  }

  instanceOf(constructor: any) {
    if (!this.value) {
      if (this.stateRequired) {
        this.stateValidate.shouldBeRequired = true
      }
    }
    else if (!(this.value instanceof constructor)) {
      this.stateValidate.notInstanceof = true
    }

    return this as Pick<EntityAssert<Props>, "message">;
  }

  eachInstanceof(constructor: any) {
    if (!Array.isArray(this.value)) {
      this.stateValidate.notInstanceof = true
    }

    for (const value of this.value as Array<any>) {
      if (value) {
        if (this.stateRequired) {
          this.stateValidate.shouldBeRequired = true
        }
      }
      else if (!(this.value instanceof constructor)) {
        this.stateValidate.notInstanceof = true
      }
    }
    
    return this as Pick<EntityAssert<Props>, "message">;
  }


  message(message: string) {
    this.errors.push({
      message,
      metadata: {
        key: this.internalKeyState as string,
        value: this.value,
        shouldBeRequired: this.stateValidate.shouldBeRequired,
        notInstanceof: this.stateValidate.notInstanceof
      }
    })
    return this as Pick<EntityAssert<Props>, "key" | "validate">;
  }


  validate() {
    this.free()
    return {
      hasErrors: () => {
        return this.errors.length > 0
      },

      errors: this.errors
    }
  }


  private free() {
    this.props = null;
    delete this.internalKeyState
    delete this.stateRequired

    if (!this.isDone)
      this.isDone = true
  }
}