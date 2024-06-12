import { EntityProps, ISnapshot, SnapshotTrace } from "../interface/types";

export class Snapshot<T extends EntityProps> implements ISnapshot<T> {
  props: T;
  trace: SnapshotTrace;

  constructor(input: {
    props: T;
    trace: SnapshotTrace;
  }) {
    this.props = input.props;
    this.trace = input.trace
  }

  hasChange(key: any): boolean {
    return this.trace.update.split('.').includes(key as string); 
  }
   
  get timestamp(): Date {
    return this.trace.updatedAt;
  }
}
