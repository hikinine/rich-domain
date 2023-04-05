import { EntityProps, IEntity, ISettings, UID } from "../types";
import AutoMapper from "./auto-mapper";
import GettersAndSetters from "./getters-and-setters";
import ID from "./id";

export class Entity<Props extends EntityProps> extends GettersAndSetters<Props> implements IEntity<Props> {
	protected _id: UID<string>;
	protected autoMapper: AutoMapper<Props>;
	constructor(props: Props, config?: ISettings) {
		super(Object.assign({}, { createdAt: new Date(), updatedAt: new Date() }, { ...props }), 'Entity', config);
		const isID = this.validator.isID(props?.['id']);
		const isStringOrNumber = this.validator.isString(props?.['id']) || this.validator.isNumber(props?.['id']);
		this._id = isStringOrNumber ? ID.create(props?.['id']) : isID ? props?.['id'] : ID.create();
		this.autoMapper = new AutoMapper();
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

	hashCode(): UID<string> {
		const name = Reflect.getPrototypeOf(this);
		return ID.create(`[Entity@${name?.constructor?.name}]:${this.id.value()}`);
	}

	isNew(): boolean {
		return this.id.isNew();
	}

	clone(): Entity<Props> {
		const instance = Reflect.getPrototypeOf(this);
		const args = [this.props, this.config];
		const entity = Reflect.construct(instance!.constructor, args);
		return entity
	}
	
}

export default Entity;
