import { EntityValidation } from "./entity-validation";

export interface HooksConfig<Aggregate, Props> {
  validationSchema?: EntityValidation<Props>
  transformBeforeCreate?: (props: Props) => Props
  onChange?: (entity: Aggregate, snapshot: any) => void
  onCreate?: (entity: Aggregate) => void
  rules?: (props: Props) => void
  validation?: (props: Props) => void
}

export function Hooks<Aggregate, Props>(config: HooksConfig<Aggregate, Props>) {
  return config
} 