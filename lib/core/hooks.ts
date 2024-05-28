
import { EntityProps, ISnapshot, Primitives } from "./types"


type DefaultValuesValidation<Props, Input, InputRequiredProps = Required<WithoutEntityProps<Input>>> = {
  [key in keyof InputRequiredProps]:
  | Primitives
  | ((currentValue: InputRequiredProps[key] | undefined, props: Props) => InputRequiredProps[key])
}

type HookTypeValidationCallback = (value: any) => string | void | undefined 
type HookTypeValidation<Props> = {
  [K in keyof Props]: HookTypeValidationCallback;
}
export type WithoutEntityProps<T> = Omit<T, keyof EntityProps>

export type HookConfigInput<Entity, Props, Input = Props> = {
  typeValidation?: HookTypeValidation<WithoutEntityProps<Props>>
  onChange?: (entity: Entity, snapshot: ISnapshot<Props>) => void
  onCreate?: (entity: Entity) => void
  rules?: (data: Entity) => void
  defaultValues?: DefaultValuesValidation<Props, Input>
}

type Values<T> = T[keyof T];

type OptionalKeys<T> = Values<{
  [K in keyof T]: {} extends Pick<T, K> ? K : never;
}>;

type GetOnlyOptional<T> = Pick<T, OptionalKeys<T>>;


export class EntityHook<Entity, Props, InputLikeProps = Props, Input = GetOnlyOptional<InputLikeProps>> {
  public isHooksConfig = true
  public typeValidation?: HookTypeValidation<WithoutEntityProps<Props>>
  public onChange?: (entity: Entity, snapshot: ISnapshot<Props>) => void
  public onCreate?: (entity: Entity) => void
  public rules?: (data: Entity) => void
  public defaultValues?: DefaultValuesValidation<Props, Input>

  constructor(config: HookConfigInput<Entity, Props, Input>) {
    this.typeValidation = config.typeValidation
    this.onChange = config.onChange
    this.onCreate = config.onCreate
    this.rules = config.rules
    this.defaultValues = config.defaultValues
  }
}

type VoHookConfigInput<Props> = {
  typeValidation?: VoHookTypeValidation<Props>
  rules?: (data: Props) => void
  transformBeforeCreate?: (data: Props) => Props

}
type VoHookTypeValidation<Props> = Props extends Primitives
  ? HookTypeValidationCallback
  : { [key in keyof WithoutEntityProps<Props>]: HookTypeValidationCallback }
export class VoHooks<Props> {
  public isVoHookConfig = true;
  public transformBeforeCreate?: (data: Props) => Props
  public typeValidation?: VoHookTypeValidation<Props>
  public rules?: (data: Props) => void

  constructor(config: VoHookConfigInput<Props>) {
    this.typeValidation = config.typeValidation
    this.rules = config.rules
    this.transformBeforeCreate = config.transformBeforeCreate
  }
}

