import { EntityMapperPayload, EntityProps, IEntity, UID } from "../types";
import { EntityAssert } from "./assert";
import GettersAndSetters from "./getters-and-setters";
import ID from "./id";
import ValueObject from "./value-object";

export class Entity<Props extends EntityProps> extends GettersAndSetters<Props> implements IEntity<Props> {
	protected _id: UID<string>;
	protected assert: EntityAssert<Props>;

	constructor(props: Props) {
		super(Object.assign({}, { createdAt: new Date(), updatedAt: new Date() }, { ...props }), 'Entity');
		const isID = GettersAndSetters.validator.isID(props?.['id']);
		const isStringOrNumber = GettersAndSetters.validator.isString(props?.['id']) || GettersAndSetters.validator.isNumber(props?.['id']);
		this._id = isStringOrNumber ? ID.create(props?.['id']) : isID ? props?.['id'] : ID.create();

		this.assert = new EntityAssert<Props>(props)
	}

	isEqual(other: Entity<Props>): boolean {
		const currentProps = Object.assign({}, {}, { ...this.props });
		const providedProps = Object.assign({}, {}, { ...other.props });
		delete currentProps?.['createdAt'];
		delete currentProps?.['updatedAt'];
		delete providedProps?.['createdAt'];
		delete providedProps?.['updatedAt'];
		const equalId = this.id.equal(other.id);
		const serializedA = JSON.stringify(currentProps);
		const serializedB = JSON.stringify(providedProps);
		const equalSerialized = serializedA === serializedB;
		return equalId && equalSerialized;
	}

	get id(): UID<string> {
		return this._id;
	}

	public toObject(): { [key in keyof Props]: any } & EntityMapperPayload {
		const self =  this as any
		const obj = {} as any

		obj["id"] = self?.id?.value;

		for (const key in self.props) {
			if (key === "id") continue;
			if (key === "createdAt") continue;
			if (key === "updatedAt") continue;
			
			const instance = self.props[key];
			if (instance instanceof ValueObject)
				obj[key] = instance.value;
			else if (instance instanceof Entity)
				obj[key] = instance.toObject()
			else
				obj[key] = instance

		}

		obj["createdAt"] = self.props?.createdAt;
		obj["updatedAt"] = self.props?.updatedAt;
		return obj
	}

	hashCode(): UID<string> {
		const name = Reflect.getPrototypeOf(this);
		return ID.create(`[Entity@${name?.constructor?.name}]:${this.id.value}`);
	}

	isNew(): boolean {
		return this.id.isNew();
	}

	clone(): Entity<Props> {
		const instance = Reflect.getPrototypeOf(this);
		const args = [this.props];
		const entity = Reflect.construct(instance!.constructor, args);
		return entity
	}

}

export default Entity;
