import { AssertSchema } from "./entity-validation";


export const EntityDefaultOnValidationError = (key: string, value: any) => {
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

export interface VoHooksConfig<Vo, Props> {  
  transformBeforeCreate?: (props: Props) => Props
  onCreate?: (entity: Vo) => void
  errorMessage?: (key: any) => string

  Type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
  Max?: number 
  Min?: number
  RegExp?: RegExp
  Nullable?: boolean
  Enum?: any[]
}

export function VoHooks<Vo, Props>(config: VoHooksConfig<Vo, Props>) {
  return config
}
