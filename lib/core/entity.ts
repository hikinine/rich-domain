import { EntityMapperPayload, EntityProps, IEntity, IExtends, UID } from "../types";
import validator from "../utils/validator";
import { EntityAssert } from "./assert";
import ID from "./id";
import ValueObject from "./value-object";

export class Entity<Props extends EntityProps> implements IEntity<Props> {
	protected _id: UID<string>;
	protected props: Props
	protected assert: EntityAssert<Props>;
	private _extends: IExtends = "Entity";

	constructor(props: Props) {
		this._id = Entity.generateOrBuildID(props?.id);
		props.id = this._id
		const now = Date.now()
		props.createdAt = new Date(props.createdAt || now)
		props.updatedAt = new Date(props.updatedAt || now)
		this.props = props
		this.assert = new EntityAssert<Props>(props)
	}

	get extends() {
		return this._extends
	}
	get createdAt() {
		return this.props?.createdAt;
	}
	get updatedAt() {
		return this.props?.updatedAt;
	}
	get id(): UID<string> {
		return this._id;
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



	public toObject(): { [key in keyof Props]: any } & EntityMapperPayload {
		const self = this as any
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
			else {
				obj[key] = instance
			}

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

	static generateOrBuildID(id?: UID<string>): UID<string> {
		const isID = validator.isID(id);
		const isStringOrNumber = validator.isString(id) || validator.isNumber(id);
		const newId = isStringOrNumber ? ID.create(id) : isID ? id : ID.create();
		return newId!
	}
}

export default Entity;
