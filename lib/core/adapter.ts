
export abstract class BaseAdapter<From, To> {
  public abstract build(data: From): To | Promise<To>
}