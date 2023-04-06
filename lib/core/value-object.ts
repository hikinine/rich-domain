import { IExtends, IValueObject } from "../types";

export class ValueObject<Value> implements IValueObject<Value> {
	protected _value: Value
	private _extends: IExtends = "ValueObject"
	constructor(value: Value) {
		this._value = value
	}

	get extends() {
		return this._extends
	}
	get value(): Value {
		return this._value
	}
	
	isEqual(other: ValueObject<Value>): boolean {
		const currentProps = Object.assign({}, {}, { ...this._value });
		const providedProps = Object.assign({}, {}, { ...other._value });
		delete currentProps?.['createdAt'];
		delete currentProps?.['updatedAt'];
		delete providedProps?.['createdAt'];
		delete providedProps?.['updatedAt'];
		return JSON.stringify(currentProps) === JSON.stringify(providedProps);
	}

	clone(): ValueObject<Value> {
		const instance = Reflect.getPrototypeOf(this);
		const args = [this._value];
		const obj = Reflect.construct(instance!.constructor, args);
		return obj;
	}


}

export default ValueObject;
