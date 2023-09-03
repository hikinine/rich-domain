import { Snapshot } from "./history"


export const EntityDefaultOnValidationError = (key: string, value: any) => {
  return `DR01 | Falha na validação do campo '${key}'. Valor recebido: ${value}.`
}
export interface HooksConfig<Aggregate, Props> {
  validation?: (props: Props) =>  { message?: string, success?: boolean }
  transformBeforeCreate?: (props: Props) => Props
  onChange?: (entity: Aggregate, snapshot: Snapshot) => void
  onCreate?: (entity: Aggregate) => void
  rules?: (data: Aggregate) => void
}

export function Hooks<Aggregate, Props>(config: HooksConfig<Aggregate, Props>) {
  return config
}

export interface VoHooksConfig<Props> {
  validation?: (props: Props) =>  { message?: string, success?: boolean }
  transformBeforeCreate?: (props: Props) => Props
  rules?: (data: Props) => void
}

export function VoHooks<Props>(config: VoHooksConfig<Props>) {
  return config
}
