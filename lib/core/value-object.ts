
import lodash from "lodash";
import { AutoMapperValueObject } from "./auto-mapper-value-object";
import { VoHookConfig } from "./hooks";
import { RevalidateError } from "./revalidate-error";
import { AutoMapperSerializer, IValueObject } from "./types";

export abstract class ValueObject<Props> implements IValueObject<Props> {
  public isValueObject = true;
  protected abstract hooks: VoHookConfig<Props>;
  protected static autoMapper = new AutoMapperValueObject();s
  public props: Props

  constructor(props: Props) { 
    this.props = props
    this.revalidate(); 
    this.ensureBusinessRules();
  }

  public getRawProps(): Props {
    return this.props
  }

  public ensureBusinessRules() {
    this?.hooks?.rules?.(this.props)
  }

  public revalidate() { 
    if (this?.hooks?.typeValidation) {
      if (typeof this.hooks.typeValidation !== 'object') {
        const value = this.props
        const errorMessage = this.hooks.typeValidation(value)
        if (errorMessage) {
          const expected = this.hooks.typeValidation.name
          throw RevalidateError(errorMessage, value, expected)
        }
      }
      Object.entries(this.hooks.typeValidation)
        .forEach(([key, validation]) => {
          const value = this.props[key as keyof Props]
          const errorMessage = validation(value)
          if (errorMessage) {
            throw RevalidateError(errorMessage, value, validation.name)
          }
        })
    }
  }

  public toPrimitives(): AutoMapperSerializer<Props> {
    return ValueObject.autoMapper.valueObjectToObj(this)
  }

  public isEqual(other: ValueObject<Props>): boolean {
    const currentProps = lodash.cloneDeep(this.props)
    const providedProps = lodash.cloneDeep(other.props)
    return lodash.isEqual(currentProps, providedProps);
  }

  public clone(): ValueObject<Props> {
    const instance = Reflect.getPrototypeOf(this);
    const args = [this.props];
    const obj = Reflect.construct(instance!.constructor, args);
    return obj;
  }
}

