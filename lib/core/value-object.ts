
import { AutoMapper } from "./auto-mapper";
import { DomainError } from "./errors";
import { VoHooksConfig } from "./hooks";

export abstract class ValueObject<Value> {
  protected static hooks: VoHooksConfig<ValueObject<any>, any> = {}


  public constructorName = "ValueObject"
  protected _value: Value
  protected autoMapper: AutoMapper<Value>

  constructor(input: Value) {
    const instance = this.constructor as typeof ValueObject<any>
    const value = instance?.hooks?.transformBeforeCreate?.(input) as Value || input

    this._value = value
    this.autoMapper = new AutoMapper<Value>()


    this.__validate();
    instance?.hooks?.onCreate?.(this as ValueObject<Value>)
  }

  public revalidate() {
    this.__validate()
  }
  protected __validate() {
    const instance = this.constructor as typeof ValueObject<any>
    const errorMessage = instance?.hooks?.errorMessage?.(this.value)
    
    if (instance?.hooks?.Nullable) {
      if (this.value === null || this.value === undefined) {
        return
      }
    }

    if (instance?.hooks?.Type && (typeof this.value !== instance?.hooks?.Type)) {
      throw new DomainError(
        errorMessage || `VO01 | O tipo do valor não é ${instance?.hooks?.Type}`
      )
    }

    if (typeof instance?.hooks?.Max === "number" || typeof instance?.hooks?.Min === "number") {

      if (typeof this.value === "number") {
        const max = instance?.hooks?.Max

        if (max && this.value > max) {
          throw new DomainError(
            errorMessage || `VO01 | O valor '${this.value}' não pode ser maior que ${max}.`
          )
        }

        const min = instance?.hooks?.Min
        if (min && this.value < min) {
          throw new DomainError(
            errorMessage || `VO01 | O valor '${this.value}' não pode ser menor que ${min}.`
          )
        }

      }

      else if (typeof this.value === "string") {
        const max = instance?.hooks?.Max

        if (max && this.value.length > max) {
          throw new DomainError(
            errorMessage || `VO01 | O valor '${this.value}' não pode ter mais que ${max} caracteres.`
          )
        }

        const min = instance?.hooks?.Min
        if (min && this.value.length < min) {
          throw new DomainError(
            errorMessage || `VO01 | O valor '${this.value}' não pode ter menos que ${min} caracteres.`
          )
        }
      }

      else if (  Array.isArray(this.value)) {
        const max = instance?.hooks?.Max

        if (max && this.value.length > max) {
          throw new DomainError(
            errorMessage || `VO01 | A lista não pode ter mais que ${max} itens.`
          )
        }

        const min = instance?.hooks?.Min
        if (min && this.value.length < min) {
          throw new DomainError(
            errorMessage || `VO01 | A lista não pode ter menos que ${min} itens.`
          )
        }
      }

    }

    if (instance?.hooks?.RegExp) {
      if (typeof this.value !== "string") {
        throw new DomainError(
          errorMessage || `VO01 | Recebido RegExp e Valor diferente de string.`
        )
      }

      if (!instance?.hooks?.RegExp.test(this.value)) {
        throw new DomainError(
          errorMessage || `VO01 | O valor '${this.value}' não é válido.`
        )
      }
    }

    if (instance?.hooks?.Enum) {
      if (!instance?.hooks?.Enum.includes(this.value)) {
        throw new DomainError(
          errorMessage || `VO01 | O valor '${this.value}' não é válido. Os valores válidos são: ${instance?.hooks?.Enum.join(", ")}.`
        )
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

