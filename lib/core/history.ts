export class EntityMetaHistory<T>{

  public restartOnFinish: boolean
  public returnCurrentOnReversion: boolean
  public initialProps: T
  public snapshots: {
    props: T,
    timestamp: Date,
    trace: {
      update: string,
      from: any,
      to: any,
    },
    debug: string
  }[]
  
  constructor(props: T) {
    this.restartOnFinish = false
    this.returnCurrentOnReversion = true 
    this.initialProps = Object.assign({}, {...props})
    this.snapshots = [  ]
  }

  public addSnapshot(props: T, update: any, from: any, to: any, ref: any) {
    this.snapshots.push({
      timestamp: new Date(),
      props: JSON.parse(JSON.stringify(props)),
      trace: { update,  from,   to, },
      debug: `${ref?.hashCode?.()?.value} updated key: '${update}'. From: '${from}' to: '${to}'`
    })
  }
  
}