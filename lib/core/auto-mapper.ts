
import Validator from "../utils/validator";
import { Id } from "./ids";

export class AutoMapper<Props> {

	/**
	 * @description Transform a value object into a simple value.
	 * @param valueObject as instance.
	 * @returns an object or a value object value.
	 */
	valueObjectToObj(valueObject: any): { [key in keyof Props]: any } {
		const value = valueObject._value

		if (typeof value !== "object" || value === null || value instanceof Date) return value;

		const obj = Object.entries(value as any)
			.reduce((accumulator, [key, instance]) => {
				if (instance instanceof Array) {
					accumulator[key] = instance.map((item) => {
						if (Validator.isValueObject(item))
							return item?.value
						else
							return item
					})
				}
				else {
					if ( Validator.isValueObject(instance))
						accumulator[key] = (instance as any)?.value
					else if ((instance as any) instanceof Id) {
						accumulator[key] = (instance as any)?._value
					}
					else
						accumulator[key] = instance;
				}


				return accumulator
			}, {} as { [Parameters in keyof Props]: Props[Parameters] })


		return obj
	}

	/**
	 * @description Transform a entity into a simple object.
	 * @param entity instance.
	 * @returns a simple object.
	 */
	entityToObj(entity: any)  {

		const initialValues: any = { id: entity?.id?._value };

		const obj = Object.entries(entity.props)
			.reduce((accumulator, [key, instance]) => {
				if (key === "id") return accumulator;

				if (instance instanceof Array) {
					accumulator[key] = instance.map((item) => {
						if (Validator.isValueObject(item))
							return item?.value
						else if (Validator.isEntity(item))
							return item?.toPrimitives?.()
						else
							return item
					})
				}
				else {
					if (Validator.isValueObject(instance)) {
						accumulator[key] = (instance as any)?.value
					}
					else if (Validator.isEntity(instance)) {
						accumulator[key] = (instance as any)?.toPrimitives?.()
					}
					else if ((instance as any) instanceof Id) {
						accumulator[key] = (instance as any)?._value
					}
					else {
						accumulator[key] = instance
					}
				}
				return accumulator
			}, initialValues)

		return obj
	}
}