import lodash from "lodash"
import { ApplicationLevelError, DomainError } from "."
import Validator from "../utils/validator"
import { Snapshot } from "./history-snapshot"
import { EntityProps, HistorySubscribe, IEntity, IEntityMetaHistory, SnapshotCallbacks, SnapshotInput } from "./types"

export class EntityMetaHistory<T extends EntityProps> implements IEntityMetaHistory<T> {
  public initialProps: T
  public snapshots: Snapshot<T>[]
  private callbacks?: SnapshotCallbacks<T>
  public onChange?: (snapshot: Snapshot<T>) => void

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

    if (typeof this.onChange === 'function') {
      this.onChange(snapshot)
    }

    if (this.callbacks?.onAddedSnapshot) {
      this.callbacks.onAddedSnapshot(snapshot)
    }
  }

  public deepWatch<E extends IEntity<T>>(
    entity: E,
    callback: (entity: E, snapshot: Snapshot<T>) => void
  ) {
    Object.values(entity).forEach((value: any) => {
      if (!value?.history) return
      
      if (value?.isEntity) {
        value.history.onChange = (snapshot: Snapshot<T>) => {
          callback(entity, snapshot)
        }
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item?.isEntity) {
            item.history.onChange = (snapshot: Snapshot<T>) => {
              callback(entity, snapshot)
            }
          }
        })
      }
    })
  }

  public getSnapshotFromUpdatedKey(key: keyof T) {
    return this.snapshots.filter(
      (snapshot) => snapshot.trace.update === key
    )
  }

  public hasChange(key: keyof T) {
    return this.snapshots.some(
      (snapshot) => snapshot.trace.update === key
    )
  }

  public subscribe<E extends IEntity<T>>(entity: E, subscribeProps: HistorySubscribe<T>) {
    Object.entries(subscribeProps).forEach((props: any) => {
      const [key, callback] = props
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

      let currentKeySnapshots: Snapshot<T>[]
      currentKeySnapshots = this.getSnapshotFromUpdatedKey(key);

      if (!currentKeySnapshots.length) {
        currentKeySnapshots = this.deepSearchSnapshots(entity, key)
      }

      if (currentKeySnapshots.length < 1) {
        return
      }

      const traces = currentKeySnapshots.map((snapshot) => snapshot.trace)
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
        callback(currentProps, traces)
        return
      }
      const resolvedValues = entity.history?.resolve(
        initialProps,
        currentProps
      )

      callback({ ...resolvedValues, currentProps }, traces)
    })
  }

  protected deepSearchSnapshots(entity: IEntity<T>, key: keyof T) {
    const propertyOfKey = entity?.['props']?.[key];

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
      const found = currentValues.find((a) => {
        if (Validator.isValueObject(a)) {
          return a.isEqual(initialValue as any);
        }
        else if (Validator.isEntity(a) || Validator.isAggregate(a)) {
          return a.isEqual(initialValue as any)
            || a.id.isEqual((initialValue as any)?.id)
        }
        else {
          return a === initialValue
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
      const found = initialValues.find((a) => {
        if (Validator.isValueObject(a)) {
          return a.isEqual(currentValue as any);
        }
        else if (Validator.isEntity(a) || Validator.isAggregate(a)) {
          const sameID = a.id.value === (currentValue as any).id.value;
          const sameProps = a.isEqual(currentValue as any)

          if (sameID && !sameProps) shouldUpdate = true;

          return sameID
        }
        else {
          return a === currentValue
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