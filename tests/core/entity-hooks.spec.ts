import { DomainError, Entity, HooksConfig, Id } from "../../lib/core"
import { EntityProps } from "../../lib/core/types"
import { is } from "../../lib/core/validation-is"
import { Age } from "./mocks/entity"

describe('entity hooks', () => {
  let userProps: UserProps
  interface UserProps extends EntityProps {
    name: string
    email: string
    age: Age
  }

  class User extends Entity<UserProps> {
    protected hooks = new HooksConfig<User, UserProps>({
      typeValidation: {
        name: is.String(2, 255),
        email: is.Email(),
        age: is.InstanceOf(Age),
      },
      rules: (user) => {
        console.log('rules was called', user)
      }
    })

    get email() {
      return this.props.email
    }

    public changeEmail(email: string) {
      this.props.email = email
    }
  }

  beforeEach(() => {
    userProps = {
      id: new Id(),
      age: new Age(25),
      email: 'paulo.artlab@gmail.com',
      name: 'Paulo Santana'
    }
  })
  describe('hook behaviors', () => {
    it('should execute revalidate method', () => {
      const newEmail = 'register@gmail.com'
      const user = new User(userProps)
      user.changeEmail(newEmail)

      expect(user.email).toEqual(newEmail)
    })

    it('when rules is defined, should execute it on create', () => {
      const spy = jest.spyOn(User.prototype['hooks'], 'rules')
      const user = new User(userProps)
      expect(user).toBeInstanceOf(User)
      expect(spy).toBeCalledTimes(1)

      user.ensureBusinessRules()
      expect(spy).toBeCalledTimes(2)

    })

    it('should spy on revalidate method and check if it was executed', () => {
      const spy = jest.spyOn(User.prototype, 'revalidate')
      const user = new User(userProps)
      expect(spy).toBeCalledTimes(1)
      expect(spy).toBeCalledWith()
      user.changeEmail('456@gmail.com')
      expect(spy).toBeCalledTimes(2)
      expect(spy).toBeCalledWith('email')
      user.changeEmail('123@gmail.com')
      expect(spy).toBeCalledTimes(3)
      expect(spy).toBeCalledWith('email')
    })

    it('when change email with invalid email, should throw an error', () => {
      const user = new User(userProps)
      expect(() => user.changeEmail('invalid-email')).toThrow(DomainError)
    })

  })
})