import { IGettersAndSetters, IParentName } from "../types";
import util, { Utils } from "../utils/util";
import validator, { Validator } from "../utils/validator";
import ID from "./id";

export class GettersAndSetters<Props> implements IGettersAndSetters {
	protected static validator: Validator = validator;
	protected util: Utils = util;
	protected static util: Utils = util;
	private parentName: IParentName = 'ValueObject';


	constructor(protected props: Props, parentName: IParentName) {
		GettersAndSetters.util = util;
		this.util = util;
		this.parentName = parentName;
	}
	protected change<Key extends keyof Props>(key: Key, value: Props[Key], validation?: (value: Props[Key]) => boolean): boolean {

		if (typeof validation === 'function') {
			if (!validation(value)) {
				return false;
			};
		}

		if (key === 'id' && this.parentName === 'Entity') {
			if (GettersAndSetters.validator.isString(value) || GettersAndSetters.validator.isNumber(value)) {
				this['_id'] = ID.create(value);
				this['props']['id'] = this['_id'].value();
				if (this.parentName === 'Entity') {
					this['props'] = Object.assign({}, { ...this['props'] }, { updatedAt: new Date() });
				}
				return true;
			}
			if (GettersAndSetters.validator.isID(value)) {
				this['_id'] = value as unknown as ID<string>;
				this['props']['id'] = this['_id'].value();
				if (this.parentName === 'Entity') {
					this['props'] = Object.assign({}, { ...this['props'] }, { updatedAt: new Date() });
				}
				return true;
			}
		}
		this.props[key] = value;
		if (this.parentName === 'Entity') {
			this['props'] = Object.assign({}, { ...this['props'] }, { updatedAt: new Date() });
		}
		return true;
	}

}

export default GettersAndSetters;
