import { SnapshotTrace, SnapshotsData } from "./types";

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