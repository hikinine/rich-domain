import { IValueObject } from "../types";
import GettersAndSetters from "./getters-and-setters";

export class ValueObject<Props> extends GettersAndSetters<Props> implements IValueObject<Props> {
	constructor(props: Props) {
		super(props, 'ValueObject');
	}

	isEqual(other: ValueObject<Props>): boolean {
		const currentProps = Object.assign({}, {}, { ...this.props });
		const providedProps = Object.assign({}, {}, { ...other.props });
		delete currentProps?.['createdAt'];
		delete currentProps?.['updatedAt'];
		delete providedProps?.['createdAt'];
		delete providedProps?.['updatedAt'];
		return JSON.stringify(currentProps) === JSON.stringify(providedProps);
	}

	clone(): ValueObject<Props> {
		const instance = Reflect.getPrototypeOf(this);
		const args = [this.props];
		const obj = Reflect.construct(instance!.constructor, args);
		return obj;
	}

	get value(): Props {
		return this.props
	}
}

export default ValueObject;
