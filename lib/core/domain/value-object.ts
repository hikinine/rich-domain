
import lodash from "lodash";
import { deepFreeze } from "../../utils/deep-freeze";
import { AutoMapperSerializer, IValueObject } from "../interface/types";
import { AutoMapperValueObject } from "./auto-mapper-value-object";
import { VoHooks } from "./hooks";
import { RevalidateError } from "./revalidate-error";

export abstract class ValueObject<Props> implements IValueObject<Props> {
  protected static hooks: VoHooks<any>;
  protected static autoMapper: AutoMapperValueObject = new AutoMapperValueObject();
  public props: Readonly<Props>
  public isValueObject: boolean = true

  constructor(input: Props) {
    const instance = this.constructor as typeof ValueObject<Props>
    const props = typeof instance?.hooks?.transformBeforeCreate === 'function'
      ? instance.hooks.transformBeforeCreate(input)
      : input

    this.props = deepFreeze<Props>(props);
    this.revalidate();
  }

  get value() {
    return this.props
  }
  public getRawProps(): Readonly<Props> {
    return this.props
  }

  public toPrimitives(): Readonly<AutoMapperSerializer<Props>> {
    const result = ValueObject.autoMapper.valueObjectToObj(this)
    const frozen = deepFreeze(result)
    return frozen
  }

  public isEqual(other?: IValueObject<Props>): boolean {
    if (!other) return false
    if (!(other instanceof ValueObject)) return false
    if (this === other) return true
    const currentProps = lodash.cloneDeep(this.props)
    const providedProps = lodash.cloneDeep(other.props)
    return lodash.isEqual(currentProps, providedProps);
  }

  public clone(): IValueObject<Props> {
    const instance = Reflect.getPrototypeOf(this);
    const args = [this.props];
    const obj = Reflect.construct(instance!.constructor, args);
    return obj;
  }

  public revalidate() {
    const instance = this.constructor as typeof ValueObject<Props>
    if (instance?.hooks?.typeValidation) {
      if (typeof instance.hooks.typeValidation !== 'object') {
        const value = this.props
        const errorMessage = instance.hooks.typeValidation(value)
        if (errorMessage) {
          const expected = instance.hooks.typeValidation?.name
          const fieldMessage = `. field=${expected}(primitive) instance=${instance?.name}`
          throw RevalidateError(errorMessage +  fieldMessage, value, expected)
        }
      }
      else {
        Object.entries(instance.hooks.typeValidation)
          .forEach(([key, validation]) => {
            const value = this.props[key as keyof Props]
            const errorMessage = validation(value)
            if (errorMessage) {
              const fieldMessage = `. field=${key?.toString()} instance=${instance?.name}`

              throw RevalidateError(errorMessage + fieldMessage, value, validation.name)
            }
          })
      }
    }


    instance?.hooks?.rules?.(this.props)
  }

}

