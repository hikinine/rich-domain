
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
export class EntityMetaHistory<T>{

  public initialProps: T
  public snapshots: Snapshots<T>[]

  constructor(props: T) {
    this.initialProps = Object.assign({}, { ...props })
    this.snapshots = []
  }

  public hasChange(key: string) {
    return this.snapshots.some(
      (snapshot) => snapshot.trace.update === key
    )
  }

  public addSnapshot(data: Snapshots<T>) {
    const snapshot: Snapshots<T> = {
      timestamp: new Date(),
      props: JSON.parse(JSON.stringify(data.props)),
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
  }

}