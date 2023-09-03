
import lodash from "lodash";
import { AutoMapper } from "./auto-mapper";
import { DomainError } from "./errors";
import { VoHooksConfig } from "./hooks";
export abstract class ValueObject<Value> {
  protected static hooks: VoHooksConfig<any> = {}
  protected static autoMapper: AutoMapper<any> = new AutoMapper<any>();

  protected _value: Value

  constructor(input: Value) {
    const instance = this.constructor as typeof ValueObject<any>
    this._value = instance?.hooks?.transformBeforeCreate?.(input) as Value || input
    
    this.revalidate();
    instance?.hooks?.rules?.(this as ValueObject<Value>)
  }

  private validation(value: Value) {
    const instance = this.constructor as typeof ValueObject<any>

    if (instance?.hooks?.validation) {
      const result = instance.hooks.validation(value)
   
      if (!result?.success) {
        throw new DomainError(result?.message || 'Falha de validação.')
      }
    }
  }

  public revalidate() {
    this.validation(this._value)
  }

  get value():  Value {
    return ValueObject.autoMapper.valueObjectToObj(this)
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

