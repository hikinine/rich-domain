import { randomUUID } from "crypto";
import { Either, ok } from "./result";
import { IdImplementation } from "./types";

/**
 * @description Identity to Entity and Aggregates
 * @method create
 * @param value as string
 */
export class Id implements IdImplementation{
  private _value: string;
  private _isNew: boolean;
  private _createdAt: Date;

  public static create(id?: string): Either<any, Id> {
    return ok(new Id(id))
  }
  private constructor(id?: string) {
    this._createdAt = new Date();
    
    
    if (typeof id === 'undefined') {
      const uuid = randomUUID()
      this._value = uuid;
      this._isNew = true
    }
    else {
      const isString = typeof id === 'string';
      this._value = isString ? id as unknown as string : String(id);
      this._isNew = false;
    }
  }

  private setAsNew(): void {
    this._isNew = true;
  }

  /**
   * @description Get the id value.
   * @returns id value as string or number.
   */
  get value(): string {
    return this._value;
  }

  isNew(): boolean {
    return this._isNew;
  }

  createdAt(): Date {
    return this._createdAt;
  }

  equal(id: Id): boolean {
    return (typeof this._value === typeof id.value) && ((this._value as any) === id.value);
  }

  deepEqual(id: Id): boolean {
    const A = JSON.stringify(this);
    const B = JSON.stringify(id);
    return A === B;
  }

  cloneAsNew(): Id {
    const newUUID = new Id(this._value);
    newUUID.setAsNew();
    return newUUID;
  }

  clone(): Id {
    return new Id(this._value) as unknown as Id
  }

}