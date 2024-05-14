import { DomainError } from "./errors"

export const RevalidateError = (
  errorMessage: string,
  value: any,
  expected: string,
  field?: string
) => {
  return new DomainError(`Erro 422. ${errorMessage}`, {
    property: `${field}`,
    value,
    received: typeof value === 'object'
      ? value?.isEntity
        ? value?.constructor?.name
        : value?.isValueObject
          ? value?.constructor?.name
          : 'Object'
      : typeof value
    ,
    expected,
  })
}
