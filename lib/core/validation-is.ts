import { isDate, isEmail, isFloat, isLength } from 'validator'

const LengthLog = (min?: number, max?: number) => {
  if (typeof min !== 'number' && typeof max !== 'number') {
    return ''
  }
  if (typeof min === 'number' && typeof max === 'number') {
    return `Intervalo permitido: ${min} - ${max}.`
  }

  if (typeof min === 'number') {
    return `Valor mínimo permitido: ${min}.`
  }

  if (typeof max === 'number') {
    return `Valor máximo permitido: ${max}.`
  }
}
class ArrayOf {
  static String(minLength?: number, maxLength?: number) {
    return function ArrayOfString(value: string[]) {
      const validator = is.String(minLength, maxLength)
      if (!Array.isArray(value)) {
        return 'Tipo de valor inválido.'
      }
      const result = value.findIndex(v => validator(v))
      if (result > -1) {
        return validator(value[result])
      }
    }
  }

  static Number(min?: number, max?: number) {
    return function ArrayOfNumber(value: any[]) {
      const validator = is.Number(min, max)
      if (!Array.isArray(value)) {
        return 'Tipo de valor inválido.'
      }
      const result = value.findIndex(v => validator(v))
      if (result > -1) {
        return validator(value[result])
      }
    }
  }

  static Boolean() {
    return function ArrayOfBoolean(value: boolean[]) {
      const validator = is.Boolean()
      if (!Array.isArray(value)) {
        return 'Tipo de valor inválido.'
      }
      const result = value.findIndex(v => validator(v))
      if (result > -1) {
        return validator(value[result])
      }
    }
  }

  static Integer(min?: number, max?: number) {
    return function ArrayOfInteger(value: any[]) {
      const validator = is.Integer(min, max)
      if (!Array.isArray(value)) {
        return 'Tipo de valor inválido.'
      }
      const result = value.findIndex(v => validator(v))
      if (result > -1) {
        return validator(value[result])
      }
    }
  }

  static Date() {
    return function ArrayOfDate(value: any[]) {
      const validator = is.Date()
      if (!Array.isArray(value)) {
        return 'Tipo de valor inválido.'
      }
      const result = value.findIndex(v => validator(v))
      if (result > -1) {
        return validator(value[result])
      }
    }
  }
  static InstanceOf(type: any) {
    return function ArrayOfInstanceOf(value: any[]) {
      const validator = is.InstanceOf(type)
      if (!Array.isArray(value)) {
        return 'Tipo de valor inválido.'
      }
      const result = value.findIndex(v => validator(v))
      if (result > -1) {
        return validator(value[result])
      }
    }
  }

}
class NullOr {
  static String(min?: number, max?: number) {
    return function String(value: string) {
      if (value === null || value === undefined) return
      return is.String(min, max)(value)
    }
  }

  static Email() {
    return function Email(value: string) {
      if (value === null || value === undefined) return
      return is.Email()(value)
    }
  }

  static Number(min?: number, max?: number) {
    return function Number(value: string) {
      if (value === null || value === undefined) return
      return is.Number(min, max)(value)
    }
  }

  static Date() {
    return function Date(value: any) {
      if (value === null || value === undefined) return
      return is.Date()(value)
    }
  }

  static Integer(min?: number, max?: number) {
    return function Integer(value: string) {
      if (value === null || value === undefined) return
      return is.Integer(min, max)(value)
    }
  }

  static Boolean() {
    return function Boolean(value: boolean) {
      if (value === null || value === undefined) return
      return is.Boolean()(value)
    }
  }

  static InstanceOf(type: any) {
    return function InstanceOf(value: any) {
      if (value === null || value === undefined) return
      return is.InstanceOf(type)(value)
    }
  }
  
}
export class is {
  static NullOr = NullOr
  static Array = ArrayOf
  static String(min?: number, max?: number) {
    return function String(value: string) {
      if (typeof value !== 'string' || !isLength(value, { min: min ?? 0, max })) {
        return `Esperava receber um valor de texto válido. ` + LengthLog(min, max)
      }
    }
  }

  static Email() {
    return function Email(value: string) {
      if (typeof value !== 'string' || !isEmail(value)) {
        return 'Email inválido.'
      }
    }
  }

  static Number(min?: number, max?: number) {
    return function Number(value: string) {
      if (typeof value !== 'number' || !isFloat(String(value), { max, min })) {
        return `Esperava receber um número válido. ` + LengthLog(min, max)
      }
    }
  }

  static Date() {
    return function Date(value: any) {
      if (!isDate(value)) {
        return `Esperava receber uma data válida.`
      }
    }
  }

  static Integer(min?: number, max?: number) {
    return function Integer(value: string) {
      if (typeof value !== 'number' || !isFloat(String(value), { max, min })) {
        return `Esperava receber um número válido. ` + LengthLog(min, max)
      }
    }
  }

  static Boolean() {
    return function Boolean(value: boolean) {
      if (typeof value !== 'boolean') {
        return 'Tipo de valor inválido. Esperava receber um valor booleano.'
      }
    }
  }


  static InstanceOf(type: any) {
    return function InstanceOf(value: any) {
      if (!(value instanceof type)) {
        return 'Tipo de valor inválido.'
      }
    }
  }

}