import { AssertSchema } from "./entity-validation";


export const defaultOnValidationError = (key: string, value: any) => {
  return `DR01 | Falha na validação do campo '${key}'. Valor recebido: ${value}.`
}
export interface HooksConfig<Aggregate, Props> {
  schema?: AssertSchema<Props>
  transformBeforeCreate?: (props: Props) => Props
  onChange?: (entity: Aggregate, snapshot: any) => void
  onCreate?: (entity: Aggregate) => void
  rules?: (props: Props) => void
  onValidationError?: (key: string, value: any) => string
}

export function Hooks<Aggregate, Props>(config: HooksConfig<Aggregate, Props>) {
  return config
} 