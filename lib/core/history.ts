import lodash from "lodash"
import Validator from "../utils/validator"
export type SnapshotTrace = {
  update: string,
  position?: number,
  action?: string
  from?: any,
  to?: any,

}
export type Snapshots<T> = {
  props: T,
  timestamp?: Date,
  trace: SnapshotTrace,
}

export type SnapshotCallbacks<T> = {
  onAddedSnapshot?: (snapshot: Snapshots<T>) => void
}
export class EntityMetaHistory<T>{
  public initialProps: T
  public _currentProps: T
  public snapshots: Snapshots<T>[]
  private callbacks?:  SnapshotCallbacks<T>

  constructor(props: T, callbacks?: SnapshotCallbacks<T>) {
    this._currentProps = props;
    this.initialProps = lodash.cloneDeep(props)
    this.snapshots = []
    this.callbacks = callbacks
  }

  public addSnapshot(data: Snapshots<T>) {
    const snapshot: Snapshots<T> = {
      timestamp: new Date(),
      props: lodash.cloneDeep(data.props),
      trace: {
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
  
  get currentProps() {
    return this._currentProps
  }

  public hasChange(key: string) {
    const relationships = key.split('.')

    return this.snapshots.some(
      (snapshot) =>  {
        const updateKeys = snapshot.trace.update.split('.')
        if (updateKeys.length === 1) {
          const [singleKey] = updateKeys
          return relationships.includes(singleKey)
        }
        else {
          for (const multKey of updateKeys) {
            if (relationships.includes(multKey)) {
              return true
            }
          }
          return false;
        }
      }
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

  protected resolveEachPropsToUpsert<T>(
    initialValues: T[],
    currentValues: T[]
  ) {
    return currentValues.reduce((acc, currentValue) => {
      let isEntity = false;
      const found = initialValues.find((a) => {
        if (Validator.isValueObject(a)) {
          return a.isEqual(currentValue as any);
        }
        else if (Validator.isEntity(a) || Validator.isAggregate(a)) {
          const foundEquals = a.isEqual(currentValue as any)
            || a.id.equal((currentValue as any)?.id)

          if (foundEquals) {
            isEntity = true;
          }

          return foundEquals
        }
        else {
          return a === currentValue
        }
      })


      if (found && isEntity) {
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

  protected resolveEachPropsToDelete<T>(
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
            || a.id.equal((initialValue as any)?.id)
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


}