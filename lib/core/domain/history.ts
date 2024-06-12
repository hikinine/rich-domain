import lodash from "lodash"
import Validator from "../../utils/validator"
import { ApplicationLevelError, DomainError } from "../errors"
import { EntityProps, HistorySubscribe, HistorySubscribeCallback, IEntity, IEntityMetaHistory, IValueObject, Paths, SnapshotCallbacks, SnapshotInput, SnapshotTrace } from "../interface/types"
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
      props: lodash.cloneDeep(data.props),
      trace: {
        updatedAt: data.trace.updatedAt,
        update: data.trace.update
      },
    })

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
              const snapshotUpdateKeys = [key, ...snapshot.trace.update.split('.')]
              const uniqueArrayOfKeysx = [...new Set(snapshotUpdateKeys)]
              snapshot.trace.update = uniqueArrayOfKeysx.join('.')
              onChangeCallback(rootEntity, snapshot)
              rootEntity.history?.snapshots.push(snapshot)
            })
            entityTarget.history?.deepWatch(rootEntity, onChangeCallback, currentValue)
          }
        })
      }

      else if (value?.isEntity && value?.history) {
        value.history.onChange.push((snapshot: Snapshot<T>) => {
          const snapshotUpdateKeys = [key, ...snapshot.trace.update.split('.')]
          const uniqueArrayOfKeysx = [...new Set(snapshotUpdateKeys)]
          snapshot.trace.update = uniqueArrayOfKeysx.join('.')
          onChangeCallback(rootEntity, snapshot)
          rootEntity.history?.snapshots.push(snapshot)
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

  public hasChange(key: Paths<T>) {
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

  public subscribe<E extends IEntity<T>>(entity: E, subscribeProps: HistorySubscribe<T>) {
    if (!entity || !entity.history) {
      throw new DomainError('History is not enabled for this entity', entity?.constructor?.name)
    }
    Object.entries(subscribeProps).forEach((props: any) => {
      const [key, callback] = props as [keyof T, HistorySubscribeCallback<any>]
      if (key === 'self') {
        throw new DomainError('"self" is not implemented yet')
      }
      if (typeof callback !== 'function') {
        throw new ApplicationLevelError(
          'Callback must be a function', {
          entity: entity?.constructor?.name,
          path: key,
          key,
          callback
        })
      }

      let currentKeySnapshots: Snapshot<T>[] = []
      currentKeySnapshots = this.getSnapshotFromUpdatedKey(key);

      if (!currentKeySnapshots.length) {
        currentKeySnapshots = this.deepSearchSnapshots(entity, key)
      }

      if (currentKeySnapshots.length < 1) {
        return
      }

      const traces: SnapshotTrace[] = currentKeySnapshots.map((snapshot) => snapshot.trace) 
      const initialProps = entity?.history?.initialProps[key]
      const currentProps = entity['props'][key]
      if (!initialProps || !currentProps) {
        throw new ApplicationLevelError(
          'Initial or current props not found. Check if the path is correct. Ensure that you have getters implemented.', {
          entity: entity?.constructor?.name,
          path: key,
          key,
          hasInitialProps: !!initialProps,
          hasCurrentProps: !!currentProps
        })
      }

      if (!(Array.isArray(initialProps) && Array.isArray(currentProps))) {
        callback(
          { entity: currentProps }, 
          traces
        )
        return
      }

      if (!entity.history) {
        throw new DomainError('History is not enabled for this entity ->' + key?.toString())
      }

      const resolvedValues = entity.history.resolve(
        initialProps,
        currentProps
      )

      callback(
        {
          entity: currentProps,
          toCreate: resolvedValues.toCreate,
          toDelete: resolvedValues.toDelete,
          toUpdate: resolvedValues.toUpdate,
        }, 
        traces
      )
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
          return (value as IValueObject<any>).isEqual(initialValue as any);
        }
        else if (Validator.isEntity(value) || Validator.isAggregate(value)) {
          return (value as IEntity<any>).isEqual(initialValue as any)
            || (value as IEntity<any>).id.isEqual((initialValue as any)?.id)
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
      const found = initialValues.find((value) => {
        if (Validator.isValueObject(value)) {
          return (value as IValueObject<any>).isEqual(currentValue as any);
        }
        else if (Validator.isEntity(value) || Validator.isAggregate(value)) {
          const sameID = (value as IEntity<any>).id.value === (currentValue as any).id.value;
          const sameProps = (value as IEntity<any>).isEqual(currentValue as any)

          if (sameID && !sameProps) shouldUpdate = true;

          return sameID
        }
        else {
          return value === currentValue
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