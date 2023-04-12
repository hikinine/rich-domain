import { IExtends, IValueObject } from "../types";

export abstract class ValueObject<Value> implements IValueObject<Value> {
	protected _value: Value
	private _extends: IExtends = "ValueObject"

	
	static transform: (props: any) => void
	static validate: (props: any) => void

	constructor(value: Value) {
		const instance = this.constructor as typeof ValueObject<Value>
		instance?.transform?.(value);
		instance?.validate?.(value)

		this._value = value
	}

	get extends() {
		return this._extends
	}
	get value(): Value {
		return this._value
	}

	valueIsEqual(value: Value): boolean {
		if (typeof value === "object" && (typeof this.value === "object")) {
			const serializedA = JSON.stringify(this.value);
			const serializedB = JSON.stringify(value);
			return serializedA === serializedB;
		}
		else {
			return this.value === value
		}
	}
	isEqual(other: ValueObject<Value>): boolean {
		const value = other.value;
		
		if (typeof value === "object" && (typeof this.value === "object")) {
			const serializedA = JSON.stringify(this.value);
			const serializedB = JSON.stringify(value);
			return serializedA === serializedB;
		}
		else {
			return this.value === value
		}
	}

	clone(): ValueObject<Value> {
		const instance = Reflect.getPrototypeOf(this);
		const args = [this._value];
		const obj = Reflect.construct(instance!.constructor, args);
		return obj;
	}


}

export default ValueObject;
