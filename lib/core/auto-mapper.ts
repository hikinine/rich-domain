
import { EntityMapperPayload } from "./types";

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
						if (item?.constructorName === "ValueObject")
							return item?._value
						else
							return item
					})
				}
				else {
					if ((instance as any)?.constructorName === "ValueObject")
						accumulator[key] = (instance as any)?._value
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
	entityToObj(entity: any): { [key in keyof Props]: any } & EntityMapperPayload {

		const initialValues: any = { id: entity?.id?._value };
		
		const obj = Object.entries(entity.props)
			.reduce((accumulator, [key, instance]) => {
				if (key === "id") return accumulator;

				if (instance instanceof Array) {
					accumulator[key] = instance.map((item) => {
						if (item.constructorName === "ValueObject")
							return item?._value
						else if (item.constructorName === "Entity")
							return item?.toPrimitives?.()
						else
							return item
					})
				}
				else {
					if ((instance as any)?.constructorName === "ValueObject") {
						accumulator[key] = (instance as any)?._value
					}
					else if ((instance as any).constructorName === "Entity") {
						accumulator[key] = (instance as any)?.toPrimitives?.()
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