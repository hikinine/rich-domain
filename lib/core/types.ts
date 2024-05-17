
export type Primitives = string | number | boolean | null | undefined
export type Optional<T> = void | T

export interface EntityProps {
	id: IdImplementation,
	createdAt?: Date,
	updatedAt?: Date
}


export interface IdImplementation {
	value: string;
	longValue: string;
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

export interface IEntity<Props extends EntityProps> {
	isEntity: boolean
	id: IdImplementation
	createdAt: Date
	updatedAt: Date | null
	history: IEntityMetaHistory<Props> | null
	hooks: never
	/**
	@deprecated
	*/
	getRawProps(): Readonly<Props>
	revalidate(): void
	ensureBusinessRules(): void
	clone(): IEntity<Props>
	isEqual(entity: IEntity<Props>): boolean
	toPrimitives(): Readonly<AutoMapperSerializer<Props>>
	/** 
	 * return primitives of the entity
	 */
	toJSON(): Readonly<AutoMapperSerializer<Props>>
	hashCode(): IdImplementation
	isNew(): boolean
}
export type IValueObject<T> = {
	isValueObject: boolean
	hooks: never
	props: Readonly<T>
	/**
	 * @deprecated
	 */
	getRawProps(): Readonly<T>
	revalidate(): void
	ensureBusinessRules(): void
	toPrimitives(): Readonly<AutoMapperSerializer<T>>
	isEqual(value: IValueObject<T>): boolean
	clone(): IValueObject<T>
}

export type IEntityMetaHistory<T> = {
	initialProps: T
	snapshots: SnapshotsData<T>[]
	addSnapshot(data: SnapshotsData<T>): void
	hasChange(key: string): boolean
	resolve<T>(initialValues: T[], currentValue: T[]): {
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
	updatedAt: Date,
	update: string,
	position?: number,
	action?: string
	from?: any,
	to?: any,
}

export type SnapshotsData<T> = {
	props: T, 
	trace: SnapshotTrace,
}

export type SnapshotCallbacks<T> = {
	onAddedSnapshot?: (snapshot: SnapshotsData<T>) => void
}

export type WithDate<T> = T & {
	createdAt: Date,
	updatedAt?: Date
}

export type SelfHistoryProp<Props, OmitProps> = {
	/**
	 * Self reference to the entity changes
	 * @throws NOT IMPLEMENTED
	 */
	self: Omit<Props, keyof OmitProps>
}

export type HistorySubscribe<
	Props extends EntityProps,
	KeysToExtract extends keyof Props = ExtractEntityAndValueObjectKeys<Props>,
	OmitProps = Pick<Props, KeysToExtract>,
	ResolvedProps = OmitProps | SelfHistoryProp<Props, OmitProps>
> = {
		[key in keyof ResolvedProps]?: HistorySubscribeCallback<ResolvedProps[key]>;
	}

export type HistorySubscribeCallback<TKey> = (
	resolvedValues: TKey extends Array<any>
		? {
			toCreate: TKey,
			toUpdate: TKey,
			toDelete: TKey,
			currentProps: TKey
		}
		: TKey,
	trace: SnapshotTrace[]
) => void

type ExtractKeysOfValueType<T, K> = { [I in keyof T]: T[I] extends K ? I : T[I] extends Readonly<K> ? I : never }[keyof T];
export type ExtractEntityAndValueObjectKeys<T> = ExtractKeysOfValueType<
	T,
	| IEntity<any>
	| Array<any>
	| Array<IEntity<any>>
	| Omit<IValueObject<NotPrimitive>, 'props' | 'getRawProps' | 'toPrimitives'>
	| Array<Omit<IValueObject<NotPrimitive>, 'props' | 'getRawProps' | 'toPrimitives'>>
>

type NotPrimitive = object | Array<any>

export interface EntityConfig extends BaseAggregateConfig {
	isAggregate?: boolean
}
export interface BaseAggregateConfig {
	preventHistoryTracker?: boolean
}