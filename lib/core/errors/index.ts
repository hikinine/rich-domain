export class DomainError extends Error {
  constructor(
    public readonly message: string,
    public readonly metadata?: any
  ) { 
    super(message)
  }
}

export class HttpError {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly metadata?: any
  ) { }
}

export class ApplicationLevelError extends Error {
  constructor(
    public readonly message: string,
    public readonly metadata?: any
  ) { 
    super(message)
  }
}

export class RepositoryError {
  constructor(
    public readonly message: string,
    public readonly metadata?: any
  ) { }
}

