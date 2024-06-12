import { VoHooks } from "../../../lib/core/domain/hooks";
import { is } from "../../../lib/core/domain/validation-is";
import { ValueObject } from "../../../lib/core/domain/value-object";



export class Age extends ValueObject<number> {
  protected static hooks = new VoHooks<number>({
    typeValidation: is.number(0, 120)
  })
 
}
