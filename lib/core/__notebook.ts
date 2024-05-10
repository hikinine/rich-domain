import { Entity } from "."
import { VoHooksConfig } from "./hooks"
import { Id } from "./ids"
import { EntityProps } from "./types"
import { is } from "./validation-is"
import { ValueObject } from "./value-object"
 

type AddressProps = {
  street: string
  number: number
  city: string
  state: string
  country: string
  zipCode: string
}

interface UserProps extends EntityProps {
  name: string
  email: string
  age: Age 
  profile: Profile
  profiles: Profile[]
  addresses: Address[]
}

interface ProfileProps extends EntityProps {
  bio: string
  birthday: Date
  profile: Profile
  address: Address
  addresses: Address[]
}


class Age extends ValueObject<number> {
  static hooks: VoHooksConfig<number> = {
    typeValidation: is.Number(5, 255)
  }
}
class Address extends ValueObject<AddressProps> {
  static hooks: VoHooksConfig<AddressProps> = {
    typeValidation: {
      city: is.String(2, 255),
      country: is.String(2, 255),
      number: is.Number(1, 255),
      state: is.String(2, 255),
      street: is.String(2, 255),
      zipCode: is.String(8, 8)
    }
  }
}

class Profile extends Entity<ProfileProps> {
  protected static hooks = {
    typeValidation: {
      address: is.InstanceOf(Address),
      addresses: is.Array.InstanceOf(Address),
      bio: is.String(2, 255),
      birthday: is.Date()
    }
  }
}

class User extends Entity<UserProps> { 
  protected static hooks = { 
    typeValidation: { 
      age: is.InstanceOf(Age),
      email: is.Email(),
      name: is.String(2, 255)
    }, 
  } 


  get age(): Age {
    return this.props.age
  }
}

const user = new User({
  age: new Age(20),
  id: new Id('2'),
  name: 'Paulo',
  email: 'paulo@gmail.com',
  addresses: [
    new Address({ city: 'São Paulo', country: 'Brasil', number: 123, state: 'SP', street: 'Rua 1', zipCode: '12345678', })
  ],
  profile: new Profile({
    profile: {} as any,
    address: new Address({ city: 'São Paulo', country: 'Brasil', number: 123, state: 'SP', street: 'Rua 1', zipCode: '12345678', }),
    addresses: [
      new Address({ city: 'São Paulo', country: 'Brasil', number: 123, state: 'SP', street: 'Rua 1', zipCode: '12345678', })
    ],
    bio: 'Bio', 
    birthday: new Date(),
    id: new Id('1'),
    createdAt: new Date(),
  }),
  profiles: [],

})  
 user.age.revalidate()