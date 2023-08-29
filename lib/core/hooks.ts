import { Snapshot } from "./history"


export const EntityDefaultOnValidationError = (key: string, value: any) => {
  return `DR01 | Falha na validação do campo '${key}'. Valor recebido: ${value}.`
}
interface Schema {
  parse: (data: unknown) => any
  safeParse: (data: unknown) => {
    success: boolean
    data?: any
    error?: any
  }
}
export interface HooksConfig<Aggregate, Props> {
  schema?: Schema
  transformBeforeCreate?: (props: Props) => Props
  onChange?: (entity: Aggregate, snapshot: Snapshot) => void
  onCreate?: (entity: Aggregate) => void
  rules?: (data: Aggregate) => void
}

export function Hooks<Aggregate, Props>(config: HooksConfig<Aggregate, Props>) {
  return config
}

export interface VoHooksConfig<Props> {
  schema?: Schema
  transformBeforeCreate?: (props: Props) => Props
  rules?: (data: Props) => void
}

export function VoHooks<Props>(config: VoHooksConfig<Props>) {
  return config
}
