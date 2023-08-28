
import lodash from "lodash";
import { AutoMapper } from "./auto-mapper";
import { DomainError } from "./errors";
import { VoHooksConfig } from "./hooks";
export abstract class ValueObject<Value> {
  protected static hooks: VoHooksConfig<any> = {}


  public constructorName = "ValueObject"
  protected _value: Value
  protected autoMapper: AutoMapper<Value>

  constructor(input: Value) {
    this.autoMapper = new AutoMapper<Value>();

    const instance = this.constructor as typeof ValueObject<any>
    const value = instance?.hooks?.transformBeforeCreate?.(input) as Value || input
    this._value = this.validation(value);

    instance?.hooks?.rules?.(this as ValueObject<Value>)
  }

  private validation(value: Value): Value {
    const instance = this.constructor as typeof ValueObject<any>

    if (!instance?.hooks?.schema) {
      return value
    }

    const result = instance.hooks.schema.safeParse(value)

    if (!result.success) {
      throw new DomainError('Falha de validação.', result.error)
    }

    return result.data
  }

  public revalidate() {
    this.validation(this._value)
  }

  get value(): { [Parameters in keyof Value]: any } | Value {
    return this.autoMapper.valueObjectToObj(this)
  }
  protected customizedIsEqual(first: any, second: any) {
    if (first instanceof Date || second instanceof Date) {
      return true;
    }
  }
  public isEqual(other: ValueObject<Value>): boolean {
    const currentProps = lodash.cloneDeep(this.value)
    const providedProps = lodash.cloneDeep(other.value)
    return lodash.isEqual(currentProps, providedProps);
  }

  public clone(): ValueObject<Value> {
    const instance = Reflect.getPrototypeOf(this);
    const args = [this._value];
    const obj = Reflect.construct(instance!.constructor, args);
    return obj;
  }
}

