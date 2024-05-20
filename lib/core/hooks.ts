
import { EntityProps, ISnapshot, Optional, Primitives } from "./types"

type HookTypeValidationCallback = (value: any) => Optional<string>
type HookTypeValidation<Props> = {
  [K in keyof Props]: HookTypeValidationCallback; 
} 
export type WithoutEntityProps<T> = Omit<T, keyof EntityProps>
export type HookConfigInput<Entity, Props> = {
  typeValidation?: HookTypeValidation<WithoutEntityProps<Props>>
  onChange?: (entity: Entity, snapshot: ISnapshot<Props>) => void
  onCreate?: (entity: Entity) => void
  rules?: (data: Entity) => void
}
export class EntityHook<Entity, Props> {
  public isHooksConfig = true
  public typeValidation?: HookTypeValidation<WithoutEntityProps<Props>>
  public onChange?: (entity: Entity, snapshot: ISnapshot<Props>) => void
  public onCreate?: (entity: Entity) => void
  public rules?: (data: Entity) => void

  constructor(config: HookConfigInput<Entity, Props>) {
    this.typeValidation = config.typeValidation
    this.onChange = config.onChange
    this.onCreate = config.onCreate
    this.rules = config.rules
  }
}

type VoHookConfigInput<Props> = {
  typeValidation?: VoHookTypeValidation<Props>
  rules?: (data: Props) => void

}
type VoHookTypeValidation<Props> = Props extends Primitives
  ? HookTypeValidationCallback
  : { [key in keyof WithoutEntityProps<Props>]: HookTypeValidationCallback }
export class VoHooks<Props> {
  public isVoHookConfig = true;
  public isHooksConfig = true
  public typeValidation?: VoHookTypeValidation<Props>
  public rules?: (data: Props) => void

  constructor(config: VoHookConfigInput<Props>) {
    this.typeValidation = config.typeValidation
    this.rules = config.rules
  }
}