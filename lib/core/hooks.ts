 
import { EntityProps, ISnapshot } from "./types"


export const EntityDefaultOnValidationError = (key: string, value: any) => {
  return `DR01 | Falha na validação do campo '${key}'. Valor recebido: ${value}.`
}

type Optional<T> = void | T
type WithoutEntityProps<T> = Omit<T, keyof EntityProps>
export interface HooksConfig<Props extends EntityProps> {
  typeValidation?: {
    [key in keyof WithoutEntityProps<Props>]: (value: any) => Optional<string>
  }
  onChange?: (entity: any, snapshot: ISnapshot) => void
  onCreate?: (entity: any) => void
  rules?: (data: any) => void
}

export function Hooks<Props extends EntityProps>(config: HooksConfig<Props>) {
  return config
}

type Primitives = string | number | boolean | null | undefined
export interface VoHooksConfig<Props> {
  typeValidation?:
  Props extends Primitives
    ? (value: any) => Optional<string>
    : {
      [key in keyof Props]: (value: any) => Optional<string>
    }
  rules?: (data: Props) => void
}

