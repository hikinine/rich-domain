
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

export interface IEntity<Props extends EntityProps> {
	isEntity: boolean 
	id: IdImplementation 
	createdAt: Date
	updatedAt: Date | null
	history: IEntityMetaHistory<Props> | null 
	/**
	@deprecated
	*/
	getRawProps(): Readonly<Props>
	revalidate(fieldToRevalidate?: keyof  WithoutEntityProps<Props>): void
	ensureBusinessRules(): void
	clone(): IEntity<Props>
	isEqual(entity?: IEntity<Props>): boolean
	toPrimitives(): Readonly<AutoMapperSerializer<Props>>
	/** 
	 * return primitives of the entity
	 */
	toJSON(): Readonly<AutoMapperSerializer<Props>>
	hashCode(): IdImplementation
	isNew(): boolean
	subscribe(props: HistorySubscribe<Props>): void
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
	hasChange(key: UnresolvedPaths<T>): boolean
	getSnapshotFromUpdatedKey(key: any): ISnapshot<T>[]
	subscribe<E extends IEntity<T>>(entity: E, subscribeProps: HistorySubscribe<T>): void
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

export interface ISnapshot<T> {
	props: T,
	trace: SnapshotTrace
	get timestamp(): Date
	hasChange(key: UnresolvedPaths<T>): boolean
}

export type SnapshotCallbacks<T> = {
	onAddedSnapshot?: (snapshot: ISnapshot<T>) => void
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
			entity: TKey
		}
		: { entity: TKey },
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
  

type UnresolvedPaths<T> = T & any
export type Paths<T> = WithoutUndefined<WithoutDot<IPaths<T>>>
export type IPaths<T> = T extends object
	? {
		[K in keyof T]:
		T[K] extends IValueObject<any>
		? `${Exclude<K, symbol>}${"" | `.${Paths<T[K]['props']>}`}` 
		: T[K] extends IEntity<any>
		? `${Exclude<K, symbol>}${"" | `.${Paths<ReturnType<T[K]['getRawProps']>>}`}`
		: T[K] extends Array<any> 
		? `${Exclude<K, symbol>}${"" | `.${Paths<T[K][0]['props']>}`}` 
		: null extends T[K] 
		? K
		: ''
	}[keyof T]
	: never

export type Leaves<T> = T extends object ? { [K in keyof T]:
	`${Exclude<K, symbol>}${Leaves<T[K]> extends never ? "" : `.${Leaves<T[K]>}`}`
}[keyof T] : never
 
type WithoutDot<T> = T extends `${infer P}.` ? P : T
type WithoutUndefined<T> =  T extends `${infer P}.undefined` ? P : T

 