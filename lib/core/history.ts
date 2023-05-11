
export type Snapshots<T> = {
  props: T,
  timestamp: Date,
  trace: {
    update: string,
    position?: number,
    from: any,
    to: any,
    
  },
}
export class EntityMetaHistory<T>{

  public restartOnFinish: boolean
  public returnCurrentOnReversion: boolean
  public initialProps: T
  public snapshots: Snapshots<T>[]
  
  constructor(props: T) {
    this.restartOnFinish = false
    this.returnCurrentOnReversion = true 
    this.initialProps = Object.assign({}, {...props})
    this.snapshots = [  ]
  }

  public addSnapshot(props: T, update: any, from: any, to: any, position?: number) {
    const snapshot: Snapshots<T> = {
      timestamp: new Date(),
      props: JSON.parse(JSON.stringify(props)),
      trace: { update,  from,   to, }, 
    };

    if (typeof position !== 'undefined') {
      snapshot.trace.position = position
    }
    this.snapshots.push(snapshot)
  }
  
}