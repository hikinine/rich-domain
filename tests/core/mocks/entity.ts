import { ValueObject, VoHookConfig } from "../../../lib/core";
import { is } from "../../../lib/core/validation-is";



export class Age extends ValueObject<number> {
  protected hooks = new VoHookConfig<number>({
    typeValidation: is.Number(0, 120)
  })
}
