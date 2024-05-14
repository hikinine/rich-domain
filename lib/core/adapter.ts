
export abstract class BaseAdapter<From, To> {
  public abstract build(data: From, ...rest: any[]): To | Promise<To>
}
