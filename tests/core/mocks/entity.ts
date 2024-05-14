import { ValueObject, VoHooks } from "../../../lib/core";
import { is } from "../../../lib/core/validation-is";



export class Age extends ValueObject<number> {
  protected static hooks = new VoHooks<number>({
    typeValidation: is.Number(0, 120)
  })
 
}
