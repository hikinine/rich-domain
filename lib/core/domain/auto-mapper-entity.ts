
import { AutoMapperSerializer, EntityProps, IEntity } from "../interface/types";
import Validator from "../utils/validator";
import { Id } from "./ids";

export class AutoMapperEntity {
	entityToObj<Props extends EntityProps>(entity: IEntity<Props>): AutoMapperSerializer<Props> {
		const props = entity['props']
		const initialValues = {
			id: entity.id.value,
			createdAt: entity.createdAt ?? null,
			updatedAt: entity.updatedAt ?? null
		}

		return Object.entries(props)
			.reduce((accumulator, [key, instance]) => {
				if (key === "id") return accumulator;

				if (instance instanceof Array) {
					accumulator[key] = instance.map((item) => {
						if (Validator.isValueObject(item))
							return item.toPrimitives()
						else if (Validator.isEntity(item) || Validator.isAggregate(item))
							return item.toPrimitives()
						else if (item instanceof Id)
							return item.value
						else
							return item
					})
				}
				else {
					if (Validator.isValueObject(instance))
						accumulator[key] = instance.toPrimitives()
					else if (Validator.isEntity(instance) || Validator.isAggregate(instance))
						accumulator[key] = instance.toPrimitives()
					else if (instance instanceof Id)
						accumulator[key] = instance.value
					else
						accumulator[key] = instance
				}
				return accumulator
			}, initialValues as AutoMapperSerializer<Props>)

	}
}