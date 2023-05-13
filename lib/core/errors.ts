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

export class ApplicationLevelError {
  constructor(
    public readonly message: string,
    public readonly metadata?: any
  ) { }
}

export class RepositoryError {
  constructor(
    public readonly message: string,
    public readonly metadata?: any
  ) { }
}

