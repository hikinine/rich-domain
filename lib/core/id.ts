import { UID } from "../types";
import { UUID } from './crypto';

/**
 * @description Identity to Entity and Aggregates
 * @method create
 * @param value as string
 */
export class ID<T = string> implements UID<T> {
	private _value: string;
	private _isNew: boolean;
	private _createdAt: Date;
	private readonly MAX_SIZE: number = 16;

	private constructor(id?: T) {
		this._createdAt = new Date();
		if (typeof id === 'undefined') {
			const uuid = UUID();
			this._value = uuid;
			this._isNew = true;
			return this;
		}
		const isString = typeof id === 'string';
		this._value = isString ? id as unknown as string : String(id);
		this._isNew = false;
		return this;
	};

	private setAsNew(): void {
		this._isNew = true;
	}

	/**
	 * @description Update id value to a short value one. 16bytes.
	 * @returns instance of ID with short value. 16bytes
	 */
	toShort(): UID<string> {
		let short = '';
		let longValue = this._value;

		if (longValue.length < this.MAX_SIZE) {
			longValue = UUID() + longValue;
		}

		longValue = longValue.toUpperCase().replace(/-/g, '');
		const chars = longValue.split('');

		while (short.length < this.MAX_SIZE) {
			const lastChar = chars.pop();
			short = lastChar + short;
		}
		this._createdAt = new Date();
		this._value = short;
		return this as unknown as UID<string>;
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

	isShort(): boolean {
		return this._value.length === this.MAX_SIZE;
	}

	equal(id: UID<any>): boolean {
		return (typeof this._value === typeof id.value) && ((this._value as any) === id.value);
	}

	deepEqual(id: UID<any>): boolean {
		const A = JSON.stringify(this);
		const B = JSON.stringify(id);
		return A === B;
	}

	cloneAsNew(): UID<string> {
		const newUUID = new ID<string>(this._value);
		newUUID.setAsNew();
		return newUUID;
	}

	clone(): UID<T> {
		return new ID(this._value) as unknown as UID<T>;
	}

	public static short(id?: string | number): UID<string> {
		const _id = new ID(id);
		if (typeof id === 'undefined') _id.setAsNew();
		_id.toShort();
		return _id;
	};

	public static create<T = string | number>(id?: T): UID<string> {
		return new ID(id) as unknown as UID<string>;
	}
}

export default ID;
export const id = ID;
export const Uid = ID.create;
export const Id = ID.create;
