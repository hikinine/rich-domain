import lodash from "lodash"
import Validator from "../../utils/validator"
import { ApplicationLevelError, DomainError } from "../errors"
import { EntityProps, HistorySubscribe, IEntity, IEntityMetaHistory, IValueObject, SnapshotCallbacks, SnapshotInput } from "../interface/types"
import { Snapshot } from "./history-snapshot"

export class EntityMetaHistory<T extends EntityProps> implements IEntityMetaHistory<T> {
  public initialProps: T
  public snapshots: Snapshot<T>[]
  private callbacks?: SnapshotCallbacks<T>
  public onChange: Array<(snapshot: Snapshot<T>) => void> = []

  constructor(
    props: T,
    callbacks?: SnapshotCallbacks<T>
  ) {
    this.initialProps = lodash.cloneDeep(props)
    this.snapshots = []
    this.callbacks = callbacks
  }

  public addSnapshot(data: SnapshotInput<T>) {
    const snapshot = new Snapshot<T>({
      props: null as unknown as T, //lodash.cloneDeep(data.props),
      trace: {
        updatedAt: data.trace.updatedAt,
        update: data.trace.update,
        fieldKey: data.trace.fieldKey,
        instanceKey: data.trace.instanceKey,
        instanceId: data.trace.instanceId,
      },

    });


    if (!data.trace.action) {
      snapshot.trace.from = data.trace.from
      snapshot.trace.to = data.trace.to
    }
    else {
      snapshot.trace.action = data.trace.action
    }

    if (typeof data.trace.position !== 'undefined') {
      snapshot.trace.position = data.trace.position
    }
    this.snapshots.push(snapshot)

    if (this.callbacks?.onAddedSnapshot) {
      this.callbacks.onAddedSnapshot(snapshot)
    }
    if (this.onChange.length) {
      this.onChange.forEach((callback) => {
        callback(snapshot)
      })
    }
  }

  public deepWatch(
    rootEntity: IEntity<any>,
    onChangeCallback: (entity: IEntity<any>, snapshot: Snapshot<any>) => void,
    childrenEntity?: IEntity<any>,
  ) {
    const entityTarget = childrenEntity ?? rootEntity;
    const currentProps = entityTarget?.['props']
    Object.entries(currentProps).forEach(([key, _value]: any) => {
      const value = _value as IEntity<any> | IEntity<any>[]
      if (Array.isArray(value)) {
        value.forEach((currentValue) => {
          if (currentValue?.isEntity && currentValue?.history) {
            currentValue.history.onChange.push((snapshot: Snapshot<T>) => {
              const clonedSnapshot = lodash.cloneDeep(snapshot)
              clonedSnapshot.fromDeepWatch = true
              clonedSnapshot.deepWatchPath = key
              onChangeCallback(rootEntity, clonedSnapshot)
            })
            entityTarget.history?.deepWatch(rootEntity, onChangeCallback, currentValue)
          }
        })
      }

      else if (value?.isEntity && value?.history) {
        value.history.onChange.push((snapshot: Snapshot<T>) => {
          const clonedSnapshot = lodash.cloneDeep(snapshot)
          clonedSnapshot.fromDeepWatch = true
          clonedSnapshot.deepWatchPath = key
          onChangeCallback(rootEntity, clonedSnapshot)
        })
        entityTarget.history?.deepWatch(rootEntity, onChangeCallback, value)
      }
    })
  }

  public getSnapshotFromUpdatedKey(key: any) {
    return this.snapshots.filter(
      (snapshot) => {
        if (snapshot.trace.update === key) {
          return true
        }

        const splitted = snapshot.trace.update.split('.')
        return splitted.includes(key as string)
      }
    )
  }

  public hasChange(key: string) {
    return this.snapshots.some(
      (snapshot) => {
        if (snapshot.trace.update === key) {
          return true
        }

        const splitted = snapshot.trace.update.split('.')
        return splitted.includes(key as string)
      }
    )
  }

  public subs<E extends IEntity<T>>(
    entity: E,
    onChange: (snapshot: Snapshot<T>, ...rest: IEntity<any>[]) => any,
    parents: IEntity<any>[] = [],
    result: any[] = []
  ) {
    const history = entity.history

    if (!(entity.isEntity)) {
      throw new DomainError('Entity is not an entity', entity)
    }
    if (!history) {
      throw new DomainError('History is not enabled for this entity', entity)
    }

    const currentResult = history.snapshots.map((snapshot) => onChange(snapshot, ...parents))
    result.push(...currentResult)


    Object.values(entity['props']).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((possibleEntity) => {
          if (possibleEntity?.isEntity) {
            const partial = possibleEntity.history.subs(possibleEntity, onChange, [...parents, entity])
            result.push(...partial)
          }
        })
      }
      else if ((value as any)?.isEntity) {
        const partial = (value as any).history.subs(value, onChange, [...parents, entity])
        result.push(...partial)
      }

    })

    return result
  }


  public subscribe<E extends IEntity<T>>(
    entity: E | E[],
    subscribeProps: HistorySubscribe<T>,
    initialProps?: E[],
  ) {
    if (!entity) {
      throw new DomainError('History is not enabled for this entity', entity)
    }

    if (typeof subscribeProps !== 'object') {
      throw new ApplicationLevelError('Subscribe props must be an object', subscribeProps)
    }

    const onChange = subscribeProps['onChange'];

    if (typeof onChange === 'function') {
      if (Array.isArray(entity)) {
        const { toCreate, toDelete, toUpdate } = this.resolve(initialProps ?? [], entity)
        const trace = entity.map(e => e.history.snapshots.map((snapshot) => snapshot.trace)).flat()
        onChange({ entity, toCreate, toUpdate, toDelete }, trace)
      }
      else {
        const trace = entity.history.snapshots.map((snapshot) => snapshot.trace)
        onChange({ entity }, trace)
      }
    }

    Object.entries(subscribeProps).forEach((entries) => {
      const [key, value] = entries;
      if (key === 'onChange') return
      if (typeof value !== 'object') return

      if (!Array.isArray(entity)) {
        const nextEntity = entity['props'][key]
        const nextInitialProps = entity.history.initialProps[key]

        if (nextEntity?.isEntity) {
          return this.subscribe(nextEntity, value, nextInitialProps)
        }

        if (nextEntity?.isValueObject) {
          const trace = entity.history.snapshots.map((snapshot) => snapshot.trace)
          const onChange = value?.['onChange']
          if (trace.length && typeof onChange === 'function') {
            onChange(
              { entity: nextEntity },
              trace
            )
          }
          return

        }

        if (Array.isArray(nextEntity)) {
          const everyPropIsEntity = nextEntity.every((prop) => prop?.isEntity)
          if (everyPropIsEntity) {
            return this.subscribe(nextEntity, value, nextInitialProps)
          }

          const everyPropIsValueObject = nextEntity.every((prop) => prop?.isValueObject)
          if (everyPropIsValueObject) {
            const { toCreate, toDelete, toUpdate } = this.resolve(nextInitialProps, nextEntity)
            const trace = entity.history.snapshots.map((snapshot) => snapshot.trace)
            const onChange = value?.['onChange']
            if (trace.length && typeof onChange === 'function') {
              onChange(
                { entity: nextEntity, toCreate, toUpdate, toDelete },
                trace
              )
            }
          }
        }
      }

      else {
        const nextEntity = entity.flatMap((entity) => entity['props'][key])
        const nextInitialProps = entity.flatMap((entity) => entity.history.initialProps[key])

        const isEntity = nextEntity.every((entity) => entity?.isEntity)
        if (isEntity) {
          return this.subscribe(nextEntity, value, nextInitialProps)
        }

        const isValueObject = nextEntity.every((entity) => entity?.isValueObject)

        if (isValueObject) {
          const { toCreate, toDelete, toUpdate } = this.resolve(nextInitialProps, nextEntity)
          const trace = entity.map(e => e.history.snapshots.map((snapshot) => snapshot.trace)).flat()

          const onChange = value?.['onChange']
          if (trace.length && typeof onChange === 'function') {
            onChange(
              { entity: nextEntity, toCreate, toUpdate, toDelete },
              trace
            )
            return;
          }
        }
      }


    })
  }

  protected deepSearchSnapshots(entity: IEntity<T>, key: keyof T) {
    const propertyOfKey = entity?.['props']?.[key] as any

    if (!propertyOfKey) {
      return []
    }

    if (Array.isArray(propertyOfKey)) {
      const everyPropIsEntity = propertyOfKey.every((prop) => prop?.isEntity)
      if (!everyPropIsEntity) {
        return this.getSnapshotFromUpdatedKey(key)
      }

      return propertyOfKey.map((prop) => prop.history.snapshots).flat()
    }

    if (!propertyOfKey?.isEntity) {
      return this.getSnapshotFromUpdatedKey(key)
    }

    const history: EntityMetaHistory<T> = propertyOfKey.history

    if (!(history instanceof EntityMetaHistory)) {
      throw new DomainError('History is not enabled for this entity ->' + key?.toString())
    }

    return history.snapshots
  }

  public resolve<T>(
    initialValues: T[],
    currentValues: T[]
  ): {
    toCreate: T[],
    toDelete: T[],
    toUpdate: T[],
  } {
    const { toCreate, toUpdate } = this.resolveEachPropsToUpsert(initialValues, currentValues)
    return {
      toCreate,
      toUpdate,
      toDelete: this.resolveEachPropsToDelete(initialValues, currentValues),
    }
  }

  private resolveEachPropsToDelete<T>(
    initialValues: T[],
    currentValues: T[]
  ) {
    return initialValues.reduce((acc, initialValue) => {
      const found = currentValues.find((value) => {
        if (Validator.isValueObject(value)) {
          return value.isEqual(initialValue as any);
        }
        else if (Validator.isEntity(value) || Validator.isAggregate(value)) {
          return value.isEqual(initialValue as any)
            || value.id.isEqual((initialValue as any)?.id)
        }
        else {
          return value === initialValue
        }
      })

      if (!found) {
        acc.push(initialValue)
      }
      return acc;

    }, [] as T[])
  }

  private resolveEachPropsToUpsert<T>(
    initialValues: T[],
    currentValues: T[]
  ) {
    return currentValues.reduce((acc, currentValue) => {
      let shouldUpdate = false;
      const found = initialValues.find((initialValue) => {
        if (Validator.isValueObject(initialValue)) {
          return initialValue.isEqual(currentValue as IValueObject<unknown>);
        }
        else if (Validator.isEntity(initialValue) || Validator.isAggregate(initialValue)) {
          const sameID = initialValue.id.isEqual((currentValue as IEntity<EntityProps>).id)
          const sameProps = initialValue.isEqual(currentValue as IEntity<EntityProps>)

          if (sameID && !sameProps) {
            shouldUpdate = true;
          }

          return sameID
        }
        else {
          return initialValue === currentValue
        }
      })

      if (found && shouldUpdate) {
        acc.toUpdate.push(currentValue)
      }
      if (!found) {
        acc.toCreate.push(currentValue)
      }

      return acc;
    }, {
      toCreate: [] as T[],
      toUpdate: [] as T[]
    })
  }
}