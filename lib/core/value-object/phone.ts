import { DomainError } from '../domain-error';
import { Either, fail, ok } from '../result';
import { BaseValueObject } from './../value-object';

export interface PhoneProps {
  number: string
  isWhatsapp?: boolean
}

export class Phone extends BaseValueObject<PhoneProps> {
  static phoneNumberRegex = /^\(?\d{2}\)?[- ]?\d{4,5}[- ]?\d{4}$/;
  
  private constructor(props: PhoneProps) {
    super(props);
  }

  protected static transform(props: PhoneProps) {
    return {
      number: props.number,
      isWhatsapp: props.isWhatsapp || false
    }
  }

  public static create(input: PhoneProps): Either<
    | DomainError,
    | Phone
  > {
    const props = this.transform(input);

    if (!(this.phoneNumberRegex.test(props.number))) {
      return fail(new DomainError('Invalid phone number'));
    }
    
    return ok(new Phone(props));
  }

  get isWhatsapp(): boolean { 
    return this.value.isWhatsapp;
  }

  get number(): string {
    return this.value.number;
  }
}