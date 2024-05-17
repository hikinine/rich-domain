import lodash from "lodash"
import { ApplicationLevelError, DomainError } from "."
import Validator from "../utils/validator"
import { EntityProps, HistorySubscribe, IEntity, SnapshotCallbacks, SnapshotsData } from "./types"

export class EntityMetaHistory<T extends EntityProps> {
  public initialProps: T
  public snapshots: SnapshotsData<T>[]
  private callbacks?: SnapshotCallbacks<T>

  constructor(
    props: T,
    callbacks?: SnapshotCallbacks<T>
  ) {
    this.initialProps = lodash.cloneDeep(props)
    this.snapshots = []
    this.callbacks = callbacks
  }

  public addSnapshot(data: SnapshotsData<T>) {
    const snapshot: SnapshotsData<T> = { 
      props: lodash.cloneDeep(data.props),
      trace: {
        updatedAt: data.trace.updatedAt,
        update: data.trace.update
      },
    };

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
  }

  public hasChange(key: string) {
    const relationships = key.split('.');
    return this.snapshots.some(
      (snapshot) => {
        const updateKeys = snapshot.trace.update.split('.');

        if (updateKeys.length === 1) {
          const [singleKey] = updateKeys
          return relationships.includes(singleKey)
        }
        else {
          return relationships.every((key) => updateKeys.includes(key));
        }
      }
    )
  }

  public subscribe<E extends IEntity<T>>(entity: E, subscribeProps: HistorySubscribe<T>) {

    Object.entries(subscribeProps).forEach((props) => {
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


      let currentKeySnapshots: SnapshotsData<T>[]
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


  protected deepSearchSnapshots(entity: IEntity<T>, key: string) {
    const propertyOfKey = entity?.['props']?.[key];

    if (typeof propertyOfKey === 'undefined') {
      return []
    } 

    if (!propertyOfKey?.isEntity) {
      return this.getSnapshotFromUpdatedKey(key)
    }

    const history: EntityMetaHistory<T> = propertyOfKey.history

    if (!(history instanceof EntityMetaHistory)) {
      throw new DomainError('History is not enabled for this entity ->' + key)
    }

    return history.snapshots
  }

  public getSnapshotFromUpdatedKey(key: string) {
    return this.snapshots.filter(
      (snapshot) => snapshot.trace.update === key
    )
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