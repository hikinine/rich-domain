

export const EntityDefaultOnValidationError = (key: string, value: any) => {
  return `DR01 | Falha na validação do campo '${key}'. Valor recebido: ${value}.`
}
interface Schema {
  parse: () => any
  safeParse: () => {
    success: boolean
    data?: any
    error?: any
  }
}
export interface HooksConfig<Aggregate, Props> {
  schema?: Schema
  transformBeforeCreate?: (props: Props) => Props
  onChange?: (entity: Aggregate, snapshot: any) => void
  onCreate?: (entity: Aggregate) => void
  rules?: (props: Props) => void
}

export function Hooks<Aggregate, Props>(config: HooksConfig<Aggregate, Props>) {
  return config
}

export interface VoHooksConfig<Props> {
  schema?: Schema
  transformBeforeCreate?: (props: Props) => Props
  rules?: (props: Props) => void
}

export function VoHooks<Props>(config: VoHooksConfig<Props>) {
  return config
}
