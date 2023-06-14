
import { AutoMapper } from "./auto-mapper";

export abstract class ValueObject<Value> {
  public constructorName = "ValueObject"
  protected _value: Value
  protected autoMapper: AutoMapper<Value>

  constructor(input: Value) {
    const instance = this.constructor as typeof ValueObject<any>
    const value = instance?.transform?.(input);
    instance?.validation?.( value)
    instance?.rules?.(value)

    this._value = value
    this.autoMapper = new AutoMapper<Value>()

  }

  protected static validation(props?: any): any {
    return props
  }
  protected static transform(props: any): any {
    return props
  }
  protected static rules(props: any): any {
    return props
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

