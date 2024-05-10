
import lodash from "lodash";
import { AutoMapperValueObject } from "./auto-mapper-value-object";
import { DomainError } from "./errors";
import { VoHooksConfig } from "./hooks";
import { AutoMapperSerializer, IValueObject } from "./types";

export abstract class ValueObject<Props> implements IValueObject<Props> {
  public isValueObject = true;
  protected static hooks: VoHooksConfig<any>;
  protected static autoMapper = new AutoMapperValueObject();

  public props: Props

  constructor(props: Props) {
    const instance = this.constructor as typeof ValueObject<Props>
    this.props = props
    this.revalidate();
    instance?.hooks?.rules?.(this as ValueObject<Props>)
  }

  public getRawProps(): Props {
    return this.props
  }

  public revalidate() {
    const instance = this.constructor as typeof ValueObject<Props>
    if (instance?.hooks?.typeValidation) {
      if (typeof instance.hooks.typeValidation !== 'object') {
        const value = this.props
        const hasError = instance.hooks.typeValidation(value)
        if (hasError) {
          throw new DomainError(`Erro 422. ${hasError}`, {
            property: `ValueObject.${this.constructor.name}`,
            value,
            received: typeof value === 'object'
              ? value instanceof ValueObject
                ? value.constructor.name
                : typeof value
              : typeof value

            ,
            expected: instance.hooks.typeValidation.name,
          })
        }
        return
      }
      Object.entries(instance.hooks.typeValidation)
        .forEach(([key, validation]) => {
          const value = this.props[key as keyof Props]
          const hasError = validation(value)
          if (hasError) {
            throw new DomainError(`Erro 422. ${hasError}`, {
              property: `${this.constructor.name}.${key}`,
              value,
              received: typeof value === 'object'
                ? value instanceof ValueObject
                  ? value.constructor.name
                  : typeof value
                : typeof value

              ,
              expected: validation.name,
            })
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

