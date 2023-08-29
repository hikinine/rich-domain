import lodash from "lodash"
import Validator from "../utils/validator"
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

export class Snapshot {
  public timestamp?: Date
  public trace: SnapshotTrace
  constructor(snapshot: SnapshotsData<any>) {
    this.timestamp = snapshot.timestamp
    this.trace = snapshot.trace
  }

  public hasChange(key: string) {
    const relationships = key.split('.');
    const updateKeys = this.trace.update.split('.');
    if (updateKeys.length === 1) {
      const [singleKey] = updateKeys
      return relationships.includes(singleKey)
    }
    else {
      return relationships.every((key) => updateKeys.includes(key));
    }
  }
}
export type SnapshotCallbacks = {
  onAddedSnapshot?: (snapshot: Snapshot) => void
}
export class EntityMetaHistory<T>{
  public initialProps: T
  public snapshots: SnapshotsData<T>[]
  private callbacks?: SnapshotCallbacks

  constructor(props: T, callbacks?: SnapshotCallbacks) {
    this.initialProps = lodash.cloneDeep(props)
    this.snapshots = []
    this.callbacks = callbacks
  }

  public addSnapshot(data: SnapshotsData<T>) {
    const snapshot: SnapshotsData<T> = {
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
      this.callbacks.onAddedSnapshot(new Snapshot(snapshot))
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
      let shouldUpdate = false;
      const found = initialValues.find((a) => {
        if (Validator.isValueObject(a)) {
          return a.isEqual(currentValue as any);
        }
        else if (Validator.isEntity(a) || Validator.isAggregate(a)) {

          const sameID = a.id.value === (currentValue as any).id?.value;
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