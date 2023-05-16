
export type AssertSchema<T> = [keyof T, "nullable" | "required", "one" | "each", any, string][]

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

  fromSchema<T>(schema: AssertSchema<T>, onMessage: (friendlyProp: string, value: any) => string) {
    for (const row of schema) {
      const [key, type, ammount, constructor, friendlyProp] = row

      const stateRequired = type === "required"
      const stateEach = ammount === "each"
      const value = (this.props as any)[key as string]

      if (!stateEach) {
        if (!value) {
          if (stateRequired) {
            this.errors.push({
              message: onMessage(friendlyProp as string, value),
              metadata: {
                key: key as string,
                value: value,
                shouldBeRequired: true,
                notInstanceof: false
              }
            })
          }

        }
        else if (!(value instanceof constructor)) {
          this.errors.push({
            message: onMessage(friendlyProp as string, value),
            metadata: {
              key: key as string,
              value: value,
              shouldBeRequired: false,
              notInstanceof: true
            }
          })
        }
      }
      else {
        if (!Array.isArray(value)) {
          this.errors.push({
            message: `Internal Error. The property ${key as string} should be an array`,
            metadata: {} as any
          });
          continue;
        }

        for (const currentValue of value as Array<any>) {
          if (!currentValue) {
            if (stateRequired) {
              this.errors.push({
                message: onMessage(friendlyProp as string, value),
                metadata: {
                  key: key as string,
                  value: currentValue,
                  shouldBeRequired: true,
                  notInstanceof: false
                }
              })
            }
          }
          else if (!(currentValue instanceof constructor)) {
            this.errors.push({
              message: onMessage(friendlyProp as string, value),
              metadata: {
                key: key as string,
                value: currentValue,
                shouldBeRequired: false,
                notInstanceof: true
              }
            })
          }
        }
      }


    }
    return this.validate()
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