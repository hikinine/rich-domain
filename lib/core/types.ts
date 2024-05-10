 

export interface EntityProps {
	id: IdImplementation,
	createdAt?: Date,
	updatedAt?: Date
}

export interface IdImplementation {
	value: string;
	isNew(): boolean;
	isEqual(id: IdImplementation): boolean;
	cloneAsNew(): IdImplementation;
	clone(): IdImplementation;
}

export type DomainEventReplaceOptions = 'REPLACE_DUPLICATED' | 'UPDATE' | 'KEEP';

export interface IDomainEvent<T> {
	aggregate: T;
	createdAt: Date;
	eventName: string
}

export interface EntityMapperPayload {
	id: string
	createdAt: Date
	updatedAt: Date
}

export interface EventPublisher<AggregateType> {
	publish(event: IDomainEvent<AggregateType>): void | Promise<void>;
}

export interface IEntity<Props> {
	isEntity: boolean
	id: IdImplementation
	createdAt: Date
	updatedAt: Date | null
	history: IEntityMetaHistory<Props>

	getRawProps(): Props
	revalidate(): void
	ensureBusinessRules(): void
	clone(): IEntity<Props>
	isEqual(entity: IEntity<Props>): boolean
	toPrimitives(): AutoMapperSerializer<Props>
	hashCode(): IdImplementation
	isNew(): boolean
}
export type IValueObject<T> = {
	isValueObject: boolean
	props: T
	getRawProps(): T
	revalidate(): void
	toPrimitives(): AutoMapperSerializer<T>
	isEqual(value: IValueObject<T>): boolean
	clone(): IValueObject<T>
}

export type IEntityMetaHistory<T> = {
	initialProps: T
	snapshots: SnapshotsData<T>[]
	addSnapshot(data: SnapshotsData<T>): void
	hasChange(key: string): boolean
	resolve <T>(initialValues: T[], currentValue: T[]): {
		toCreate: T[],
		toUpdate: T[],
		toDelete: T[],
	}
}
type SerializerEntityReturnType<ThisEntity extends IEntity<any>> = ReturnType<ThisEntity['getRawProps']>
type SerializerValueObjectReturnType<ThisValueObject extends IValueObject<any>> = ReturnType<ThisValueObject['getRawProps']>

export type AutoMapperSerializer<Props> = {
	[key in keyof Props]:
	Props[key] extends IValueObject<any>
	? AutoMapperSerializer<SerializerValueObjectReturnType<Props[key]>>
	: Props[key] extends IEntity<any>
	? AutoMapperSerializer<SerializerEntityReturnType<Props[key]>> & EntityMapperPayload
	: Props[key] extends Array<any>
	? Array<
		AutoMapperSerializer<ReturnType<Props[key][0]['getRawProps']>>
		& (
			Props[key][0] extends IEntity<any>
			? EntityMapperPayload
			: {}
		)
	>
	: string
}


export type SnapshotTrace = {
  update: string,
  position?: number,
  action?: string
  from?: any,
  to?: any,
}

export type SnapshotsData<T> = {
  props: T,
  timestamp?: Date,
  trace: SnapshotTrace,
}

export type ISnapshot = {
	timestamp?: Date
	trace: SnapshotTrace
	hasChange(key: string): boolean
}

export type SnapshotCallbacks = {
  onAddedSnapshot?: (snapshot: ISnapshot) => void
}