export type Either<Error, Result> = Fail<Error, Result> | Ok<Error, Result>;
export type PromiseEither<Error, Result> = Promise<Either<Error, Result>>;

export class Fail<Error, Result> {
  readonly _value: Error;

  constructor(value: Error) {
    this._value = value;
  }

  public getValue(): Error {
    return this._value;
  }
  isFail(): this is Fail<Error, Result> {
    return true;
  }

  isSuccess(): this is Ok<Error, Result> {
    return false;
  }
}

export class Ok<Error, Result> {
  private readonly _value: Result;

  constructor(value: Result) {
    this._value = value;
  }

  public getValue(): Result {
    return this._value;
  }
  isFail(): this is Fail<Error, Result> {
    return false;
  }

  isSuccess(): this is Ok<Error, Result> {
    return true;
  }
}

export const fail = <Error, Result>(l: Error): Either<Error, Result> => {
  return new Fail(l);
};

export const ok = <Error, Result>(a?: Result): Either<Error, Result> => {
  return new Ok<Error, Result>(a!);
};

export const combine = <Error, Result>(results: Either<Error, Result>[]): Either<Error[], Result[]> => {
  const errors: Error[] = [];
  const values: Result[] = [];

  for (const result of results) {
    if (result.isFail()) {
      errors.push(result.getValue());
    } else {
      values.push(result.getValue());
    }
  }

  if (errors.length > 0) {
    return fail(errors);
  } else {
    return ok(values);
  }
};