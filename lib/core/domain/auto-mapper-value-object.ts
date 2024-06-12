
import Validator from "../../utils/validator";
import { DomainError } from "../errors";
import { AutoMapperSerializer, IValueObject } from "../interface/types";
import { Id } from "./ids";

export class AutoMapperValueObject {
	public valueObjectToObj<Props>(valueObject: IValueObject<Props>): AutoMapperSerializer<Props> {
		const value = valueObject['props']

		if (!value || typeof value !== "object" || value === null || value instanceof Date) {
			return value as AutoMapperSerializer<Props>
		}

		const obj = Object.entries(value)
			.reduce((accumulator, [key, instance]) => {
				if (instance instanceof Array) {
					accumulator[key] = instance.map((item) => {
						if (Validator.isEntity(item) || Validator.isAggregate(item)) 
							throw new DomainError("Entity cannot be a value object children.")
						if (Validator.isValueObject(item))
							return item.toPrimitives()
						else
							return item
					})
				}
				else {
					if (Validator.isEntity(instance) || Validator.isAggregate(instance)) 
						throw new DomainError("Entity cannot be a value object children.")
					if (Validator.isValueObject(instance))
						accumulator[key] = instance.toPrimitives()
					else if ((instance) instanceof Id) {
						accumulator[key] = instance.value
					}
					else
						accumulator[key] = instance;
				}


				return accumulator
			}, {} as AutoMapperSerializer<Props>)


		return obj
	}
}