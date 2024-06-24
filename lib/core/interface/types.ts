
export type Primitives = string | number | boolean | null | undefined

export interface EntityProps {
	id: IdImplementation,
	createdAt?: Date,
	updatedAt?: Date
}

type Omit_<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type MakeOptional<T, K extends keyof T> = Omit_<T, K> & Partial<Pick<T, K>>
export type EntityInput<Props extends EntityProps, T extends keyof Props> = MakeOptional<Props, T>


export interface IdImplementation {
	value: string;
	longValue: string;
	isNew(): boolean;
	setAsNew(): void;
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

export type WithoutEntityProps<T> = Omit<T, keyof EntityProps>
export interface EntityMapperPayload {
	id: string
	createdAt: Date
	updatedAt: Date
}

export interface EventPublisher<AggregateType> {
	publish(event: IDomainEvent<AggregateType>): void | Promise<void>;
}

export type EntityCompareResult = {
	different: string[],
	missing_from_first: string[],
	missing_from_second: string[]
}
export interface IEntity<Props extends EntityProps> {
	isEntity: boolean
	id: IdImplementation
	createdAt: Date | null
	updatedAt: Date | null
	history: IEntityMetaHistory<Props>
	/**
	@deprecated
	*/
	getRawProps(): Readonly<Props>
	revalidate(fieldToRevalidate?: keyof WithoutEntityProps<Props>): void
	ensureBusinessRules(): void
	clone(): IEntity<Props>
	compare(entity?: IEntity<Props>): EntityCompareResult
	isEqual(entity?: IEntity<Props>): boolean
	toPrimitives(): Readonly<AutoMapperSerializer<Props>>
	/** 
	 * return primitives of the entity
	 */
	toJSON(): Readonly<AutoMapperSerializer<Props>>
	hashCode(): IdImplementation
	isNew(): boolean
	subscribe(props: HistorySubscribe<Props, this>): void
}

export interface IAggregate<Props extends EntityProps> extends IEntity<Props> {
	isAggregate: boolean
	addEvent(domainEvent: IDomainEvent<Props>, replace?: DomainEventReplaceOptions): void
	clearEvents(): void
	removeEvent(eventName: string): void
	getEvents<T = IDomainEvent<Props>>(eventName?: string): T[]
	hasEvent(eventName: string): boolean
	dispatch(eventName: string, eventPublisher: EventPublisher<Props>): Promise<void>
}

export type IValueObject<T> = {
	isValueObject: boolean
	props: Readonly<T>
	/**
	 * @deprecated
	 */
	getRawProps(): Readonly<T>
	revalidate(): void
	toPrimitives(): Readonly<AutoMapperSerializer<T>>
	isEqual(value?: IValueObject<T>): boolean
	clone(): IValueObject<T>
}


export type IEntityMetaHistory<T extends EntityProps> = {
	initialProps: T
	snapshots: ISnapshot<T>[]
	addSnapshot(data: SnapshotInput<T>): void
	hasChange(key: string): boolean
	getSnapshotFromUpdatedKey(key: any): ISnapshot<T>[]
	subscribe<E extends IEntity<T>>(entity: E, subscribeProps: HistorySubscribe<T>, initialProps?: E[]): void
	onChange: Array<(snapshot: ISnapshot<T>) => void>
	deepWatch(
		entity: IEntity<any>,
		callback: (entity: IEntity<any>, snapshot: ISnapshot<T>) => void,
		childrenEntity?: IEntity<any>
	): void
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
	instanceId?: string,
	instanceKey: string,
	fieldKey: string,
	update: string,
	position?: number,
	action?: string
	from?: any,
	to?: any,
}

export type SnapshotInput<T> = {
	props: T,
	trace: SnapshotTrace
}
export type ISnapshotAggregate = {
	aggregateName: string
	actionName: string
}
export interface ISnapshot<T> {
	readonly props: T,
	trace: SnapshotTrace
	fromDeepWatch: boolean
	deepWatchPath: string | null
	get timestamp(): Date
	hasChange(key: string): boolean
}

export type SnapshotCallbacks<T> = {
	onAddedSnapshot?: (snapshot: ISnapshot<T>) => void
}

export type WithDate<T> = T & {
	createdAt: Date,
	updatedAt?: Date
}

export type SelfHistoryProp<Props, OmitProps> = {
	onChange: Omit<Props, keyof OmitProps>
}

export type HistorySubscribe<
	Props,
	Entity = Props,
	KeysToExtract extends keyof Props = ExtractEntityAndValueObjectKeys<Props>,
	OmitProps = Pick<Props, KeysToExtract>,
	ResolvedProps = OmitProps | SelfHistoryProp<Props, OmitProps>
> = {
		[key in keyof ResolvedProps]?:
		key extends 'onChange'
		? HistorySubscribeCallback<Entity>
		: HistorySubscribe<
			ResolvedProps[key] extends IEntity<any>
			? ReturnType<ResolvedProps[key]['getRawProps']>
			: ResolvedProps[key] extends IValueObject<any>
			? ResolvedProps[key]['props']
			: ResolvedProps[key] extends Array<IEntity<any>>
			? ReturnType<ResolvedProps[key][number]['getRawProps']>
			: ResolvedProps[key] extends Array<IValueObject<any>>
			? ResolvedProps[key][number]['props']
			: never,

			ResolvedProps[key] extends DomainEntityAggregateOrValueObject
			? ResolvedProps[key]
			: never
		>

	}

export type HistorySubscribeCallback<TKey> = (
	resolvedValues: TKey extends Array<any>
		? {
			toCreate: TKey,
			toUpdate: TKey,
			toDelete: TKey,
			entity: TKey
		}
		: { entity: TKey },
	trace: SnapshotTrace[]
) => void

type ExtractKeysOfValueType<T, K> = { [I in keyof T]: T[I] extends K ? I : T[I] extends Readonly<K> ? I : never }[keyof T];

type DomainEntityAggregateOrValueObject =
	| IEntity<any>
	| IAggregate<any>
	| Array<any>
	| Array<IEntity<any>>
	| Array<IAggregate<any>>
	| Omit<IValueObject<NotPrimitive>, 'props' | 'getRawProps' | 'toPrimitives'>
	| Array<Omit<IValueObject<NotPrimitive>, 'props' | 'getRawProps' | 'toPrimitives'>>
	| (null | IEntity<any>)
	| (null | IAggregate<any>)
	| (null | Array<any>)
	| (null | Array<IEntity<any>>)
	| (null | Array<IAggregate<any>>)
	| (null | Array<Omit<IValueObject<NotPrimitive>, 'props' | 'getRawProps' | 'toPrimitives'>>)
	| (null | Array<Array<any>>)
	| (null | Array<Array<IEntity<any>>>)
	| (null | Array<Array<IAggregate<any>>>)
	| (null | Array<Array<Omit<IValueObject<NotPrimitive>, 'props' | 'getRawProps' | 'toPrimitives'>>>)


export type ExtractEntityAndValueObjectKeys<T> = ExtractKeysOfValueType<T, DomainEntityAggregateOrValueObject>

export type NotPrimitive = object | Array<any>

export interface EntityConfig extends BaseAggregateConfig {
	isAggregate?: boolean
}
export interface BaseAggregateConfig {
	/**
	 * Prevent the history tracker to be created.
	 * That means that the entity will not have the history of changes.
	 * @default false
	 */
	preventHistoryTracker?: boolean
	/**
	 * It's useful only on development mode.
	 * Every time that entity is mutated, @type {ISnapshot} will deepClone the props state to ensure
	 * that you have the time based props before it changed.
	 * @default false
	 */
	onSnapshotAddedDeepClonePropsState?: boolean
}
 

 