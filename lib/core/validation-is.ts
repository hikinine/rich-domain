import { isDate, isEmail, isFloat, isLength, isUUID } from 'validator'

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
 
export const is = { 

  optional(callback: (args: any) => string | undefined) {
    return function Optional(value: any) {
      if (value === null || value === undefined) {
        return
      }
      return callback(value)
    }
  },  
  arrayOf(callback: (args: any) => string | undefined) {
    return function ArrayOf(value: any[]) {
      if (!Array.isArray(value)) {
        return 'Tipo de valor inválido.'
      }
      const result = value.findIndex(v => callback(v))
      if (result > -1) {
        return callback(value[result])
      }
    }
  },

  enumOf(enumInstance: any) {
    return function EnumOf(value: any) {
      const enumValues = Object.values(enumInstance)
      if (!enumValues.includes(value) ) {
        return 'Valor enum inválido. Disponível: ' + enumValues.join(', ')
      }
    }
  },

  in(values: any[]) {
    return function In(value: any) {
      if (!values.includes(value)) {
        return 'Valor inválido. Disponível: ' + values.join(', ')
      }
    }
  },

  defined() {
    return function AnyType(value: any) {
      if (value === null || value === undefined) {
        return 'Tipo de valor inválido.'
      }
    }
  },

  anyType() {
    return function AnyType(value?: any) {
      value;
      return
    }
  },

  uuid() {
    return function UUID(value: string) {
      if (typeof value !== 'string') {
        return 'Tipo de valor inválido.'
      }
      if (!isUUID(value)) {
        return 'UUID inválido.'
      } 
    }
  },
  string(min?: number, max?: number) {
    return function String(value: string) {
      if (typeof value !== 'string' || !isLength(value, { min: min ?? 0, max })) {
        return `Esperava receber um valor de texto válido. ` + LengthLog(min, max)
      }
    }
  },

  email() {
    return function Email(value: string) {
      if (typeof value !== 'string' || !isEmail(value)) {
        return 'Email inválido.'
      }
    }
  },
  number(min?: number, max?: number) {
    return function Number(value: string) {
      if (typeof value !== 'number' || !isFloat(String(value), { max, min })) {
        return `Esperava receber um número válido. ` + LengthLog(min, max)
      }
    }
  },

  date() {
    return function Date(value: any) {
      if (!isDate(value)) {
        return `Esperava receber uma data válida.`
      }
    }
  },

  integer(min?: number, max?: number) {
    return function Integer(value: string) {
      if (typeof value !== 'number' || !isFloat(String(value), { max, min })) {
        return `Esperava receber um número válido. ` + LengthLog(min, max)
      }
    }
  },

  boolean() {
    return function Boolean(value: boolean) {
      if (typeof value !== 'boolean') {
        return 'Tipo de valor inválido. Esperava receber um valor booleano.'
      }
    }
  },


  instanceof(type: any) {
    if (!type) {
      throw new TypeError('O tipo de instância não foi definido. (is.instanceof)')
    }
    return function InstanceOf(value: any) {
      if (!(value instanceof type)) {
        return 'Tipo de valor inválido.'
      }
    }
  }

}  