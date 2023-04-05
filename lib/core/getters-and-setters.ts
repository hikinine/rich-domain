import { IGettersAndSetters, IHistory, IParentName, ISettings } from "../types";
import util, { Utils } from "../utils/util";
import validator, { Validator } from "../utils/validator";
import History from "./history";
import ID from "./id";

/**
 * @description defines getter and setter to all domain instances.
 */
export class GettersAndSetters<Props> implements IGettersAndSetters<Props> {
	private readonly _MetaHistory: IHistory<Props>;
	protected validator: Validator = validator;
	protected static validator: Validator = validator;
	protected util: Utils = util;
	protected static util: Utils = util;
	private parentName: IParentName = 'ValueObject';

	protected config: ISettings = { disableGetters: false, disableSetters: false };

	constructor(protected props: Props, parentName: IParentName, config?: ISettings) {
		GettersAndSetters.validator = validator;
		GettersAndSetters.util = util;
		this.validator = validator;
		this.util = util;
		this.config.disableGetters = !!config?.disableGetters;
		this.config.disableSetters = !!config?.disableSetters;
		this._MetaHistory = new History({
			props: Object.assign({}, { ...this.props }),
			action: 'create',
		});
		this.parentName = parentName;
	}

	private snapshotSet() {
		if (typeof this._MetaHistory !== 'undefined') {
			this._MetaHistory.snapshot({
				action: 'update',
				props: Object.assign({}, { ...this.props }),
				ocurredAt: new Date(),
				token: ID.short()
			});
		}
	}

	protected	validation(_value: any, _key?: any): boolean;
	protected	validation(_value: any, _key: any): boolean;
 protected	validation<Key extends keyof Props>(_value: Props[Key], _key: Key): boolean { return true };

	protected get<Key extends keyof Props>(key: Key) {
		if (this.config.disableGetters) {
			return null as unknown as Props[Key]
		};
		return this.props[key];
	}

	/**
	 * 
	 * @param key the property you want to set.
	 * @returns to function asking the value you want to set.
	 */
	protected set<Key extends keyof Props>(key: Key) {
		return {
			/**
			 * @description The value is only applied if pass on validation.
			 * @param value the value you want to apply.
			 * @param validation function to validate the value before apply. The value will be applied only if to pass on validation.
			 * @example 
			 * (value: PropValue) => boolean;
			 * @returns returns "true" if the value has changed and returns "false" if the value has not changed.
			 */
			to: (value: Props[Key], validation?: (value: Props[Key]) => boolean): boolean => {
				const instance = Reflect.getPrototypeOf(this);
				if (this.config.disableSetters) {
					return false;
				};
				if (typeof validation === 'function') {
					if (!validation(value)) {
						return false;
					};
				}

				const canUpdate = this.validation(value, key);
				if (!canUpdate) {
					return false;
				}

				if (key === 'id' && this.parentName === 'Entity') {
					if (this.validator.isString(value) || this.validator.isNumber(value)) {
						this['_id'] = ID.create(value);
						this['props']['id'] = this['_id'].value();
						if (this.parentName === 'Entity') {
							this['props'] = Object.assign({}, { ...this['props'] }, { updatedAt: new Date() });
						}
						this.snapshotSet();
						return true;
					}
					if (this.validator.isID(value)) {
						this['_id'] = value as unknown as ID<string>;
						this['props']['id'] = this['_id'].value();
						if (this.parentName === 'Entity') {
							this['props'] = Object.assign({}, { ...this['props'] }, { updatedAt: new Date() });
						}
						this.snapshotSet();
						return true;
					}
				}
				this.props[key] = value;
				if (this.parentName === 'Entity') {
					this['props'] = Object.assign({}, { ...this['props'] }, { updatedAt: new Date() });
				}
				this.snapshotSet();
				return true;
			}
		}
	}
	/**
	 * 
	 * @param key the property you want to set.
	 * @param value the value to apply to the key.
	 * @param validation function to validate the value before apply. The value will be applied only if to pass.
	 * @returns returns "true" if the value has changed and returns "false" if the value has not changed.
	 */
	protected change<Key extends keyof Props>(key: Key, value: Props[Key], validation?: (value: Props[Key]) => boolean): boolean {
		const instance = Reflect.getPrototypeOf(this);
		if (this.config.disableSetters) {
			return false;
		};

		if (typeof validation === 'function') {
			if (!validation(value)) {
					return false;
			};
		}
		const canUpdate = this.validation(value, key);
		if (!canUpdate) {
			return false;
		}
		if (key === 'id' && this.parentName === 'Entity') {
			if (this.validator.isString(value) || this.validator.isNumber(value)) {
				this['_id'] = ID.create(value);
				this['props']['id'] = this['_id'].value();
				if (this.parentName === 'Entity') {
					this['props'] = Object.assign({}, { ...this['props'] }, { updatedAt: new Date() });
				}
				this.snapshotSet();
				return true;
			}
			if (this.validator.isID(value)) {
				this['_id'] = value as unknown as ID<string>;
				this['props']['id'] = this['_id'].value();
				if (this.parentName === 'Entity') {
					this['props'] = Object.assign({}, { ...this['props'] }, { updatedAt: new Date() });
				}
				this.snapshotSet();
				return true;
			}
		}
		this.props[key] = value;
		if (this.parentName === 'Entity') {
			this['props'] = Object.assign({}, { ...this['props'] }, { updatedAt: new Date() });
		}
		this.snapshotSet();
		return true;
	}

}

export default GettersAndSetters;
