import { IAdapter, ISettings, IValueObject } from "../types";
import AutoMapper from "./auto-mapper";
import GettersAndSetters from "./getters-and-setters";

export class ValueObject<Props> extends GettersAndSetters<Props> implements IValueObject<Props> {
	protected autoMapper: AutoMapper<Props>;
	constructor(props: Props, config?: ISettings) {
		super(props, 'ValueObject', config);
		this.autoMapper = new AutoMapper();
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
		const args = [this.props, this.config];
		const obj = Reflect.construct(instance!.constructor, args);
		return obj;
	}

	toObject<T>(adapter?: IAdapter<this, T>): T {
		if (adapter && typeof adapter?.build === 'function') return adapter.build(this).value();
		return this.autoMapper.valueObjectToObj(this) as unknown as T;
	}

	protected set<Key extends keyof Props>(key: Key): {
		to: (value: Props[Key], validation?: ((value: Props[Key]) => boolean) | undefined) => boolean;
	} {
		return super.set(key);
	}

	change<Key extends keyof Props>(key: Key, value: Props[Key], validation?: ((value: Props[Key]) => boolean) | undefined): boolean {
		return super.change(key, value, validation);
	}

	get value(): Props {
		return this.props
	}
}

export default ValueObject;
