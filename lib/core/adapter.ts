import { Either } from "./result";

export abstract class BaseAdapter<From, To> {
  public abstract build(data: From): Either<any ,To>
}