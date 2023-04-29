export class DomainError {
  constructor(
    public readonly message: string,
    public readonly metadata?: any
  ) { }
}

export class HttpError {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly metadata?: any
  ) { }
}

export class PersistenceError {
  constructor(
    public readonly message: string,
    public readonly metadata?: any
  ) { }
}