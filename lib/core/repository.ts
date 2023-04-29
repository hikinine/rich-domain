import { BaseAdapter } from "./adapter";
import { BaseAggregate } from "./aggregate";
import { Either } from "./result";


export abstract class ReadRepository<Aggregate extends BaseAggregate<any>> {
  abstract find(): Promise<Either<unknown, Aggregate[]>>
  abstract findById(id: string): Promise<Either<unknown, Aggregate>>
}

export abstract class WriteRepository<Aggregate extends BaseAggregate<any>> {
  abstract create(entity: Aggregate): Promise<Either<unknown, void>>
  abstract update(entity: Aggregate): Promise<Either<unknown, void>>
  abstract delete(id: string): Promise<Either<unknown, void>>
}

export abstract class WriteAndRead<Aggregate extends BaseAggregate<any>> {
  abstract find(): Promise<Either<unknown, Aggregate[]>>
  abstract findById(id: string): Promise<Either<unknown, Aggregate>>

  abstract create(entity: Aggregate): Promise<Either<unknown, void>>
  abstract update(entity: Aggregate): Promise<Either<unknown, void>>
  abstract delete(id: string): Promise<Either<unknown, void>>
}

export abstract class RepositoryImpl<Aggregate extends BaseAggregate<any>> extends WriteAndRead<Aggregate> {
  abstract readonly _adapter: BaseAdapter<Aggregate>;  
}
