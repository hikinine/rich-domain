
import { AutoMapper } from "./auto-mapper";
import { DomainError } from "./errors";
import { VoHooksConfig } from "./hooks";

export abstract class ValueObject<Value> {
  protected static hooks: VoHooksConfig<any> = {}


  public constructorName = "ValueObject"
  protected _value: Value
  protected autoMapper: AutoMapper<Value>

  constructor(input: Value) {
    const instance = this.constructor as typeof ValueObject<any>
    const value = instance?.hooks?.transformBeforeCreate?.(input) as Value || input

    this._value = value
    this.autoMapper = new AutoMapper<Value>()


    this.revalidate();
    instance?.hooks?.rules?.(this as ValueObject<Value>)
  }

  public revalidate() {
    const instance = this.constructor as typeof ValueObject<any>
    
    if (instance?.hooks?.schema) {
      const result = instance.hooks.schema.safeParse(this._value)

      if (!result.success) {
        throw new DomainError('')
      }
    }
  }

  get value(): { [Parameters in keyof Value]: any } | Value {
    return this.autoMapper.valueObjectToObj(this)
  }

  public isEqual(other: ValueObject<Value>): boolean {
    const value = other.value;

    if (typeof value === "object" && (typeof this.value === "object")) {
      const serializedA = JSON.stringify(this.value);
      const serializedB = JSON.stringify(value);
      return serializedA === serializedB;
    }
    else {
      return this.value === value
    }
  }

  public clone(): ValueObject<Value> {
    const instance = Reflect.getPrototypeOf(this);
    const args = [this._value];
    const obj = Reflect.construct(instance!.constructor, args);
    return obj;
  }
}

