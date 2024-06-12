import { Entity } from "../../lib/core/domain/entity";
import { EntityMetaHistory } from "../../lib/core/domain/history";
import { Id } from "../../lib/core/domain/ids";
import { DomainError } from "../../lib/core/errors";
import { EntityInput, EntityProps } from "../../lib/core/interface/types";
import { Age } from "./mocks/entity";


describe('entity test', () => {
  let userProps: UserProps

  interface UserProps extends EntityProps {
    name: string
    email: string
    age: Age
  }

  type UserInput = EntityInput<UserProps, 'email'>

  class User extends Entity<UserProps, UserInput> {
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
      email: 'teste@gmail.com',
      name: 'Paulo'
    }
  })

  describe('default behavior and methods ', () => {

    it('should create a new entity', () => {
      new User({
        id: new Id(),
        age: new Age(25),
        name: 'Paulo'
      })
      const user = new User(userProps)
      expect(user).toBeInstanceOf(User)
      expect(user).toBeInstanceOf(Entity)
      user.history.hasChange('')
    })

    it('should throw an domain error', () => {
      const user = new User(userProps)
      expect(() => user.getRawProps()).toThrow(DomainError)
    })


    it('should return an hashCode', () => {
      const user = new User(userProps)
      expect(user.hashCode()).toBeInstanceOf(Id)
      expect(user.hashCode().value).toEqual(
        `entity@User:${user.id.value}`
      )
    })

    it('with new Id, entity should be new', () => {
      const user = new User(userProps)
      expect(user.isNew()).toBeTruthy()
    })


    it('with new default Id, entity should be new', () => {
      const user = new User({ ...userProps, id: new Id() })
      expect(user.isNew()).toBeTruthy()
    })

    it('with provided id, entity should be not new', () => {
      const user = new User({ ...userProps, id: new Id('already-exists') })
      expect(user.isNew()).toBeFalsy()
    })
  })

  describe('default props', () => {
    it('should have default props', () => {
      const user = new User(userProps)
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.id).toBeInstanceOf(Id)
    })

    it('should have default props with custom values', () => {
      const user = new User(userProps)
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.id).toBeInstanceOf(Id)
    })

    it('should have the same id as the props', () => {
      const user = new User(userProps)
      expect(user.id).toEqual(userProps.id)
      expect(user.id.value).toEqual(userProps.id.value)
      expect(user.id.isEqual(userProps.id as Id)).toBeTruthy()
    })
  })

  describe('compare entities', () => {
    it('should be ok with 2 users with same props', () => {
      const user1 = new User(userProps)
      const user2 = new User(userProps)
      expect(user1.isEqual(user2)).toBeTruthy()
    })

    it('should be flasy with 2 users with different props', () => {
      const user1 = new User(userProps)
      const user2 = new User({ ...userProps, name: 'John' })
      expect(user1.isEqual(user2)).toBeFalsy()
    })

    it('should be flasy with 2 users with same props and different IDS', () => {
      const user1 = new User(userProps)
      const user2 = new User({ ...userProps, id: new Id() })
      expect(user1.isEqual(user2)).toBeFalsy()
    })

    it('should be true with same props and different createdAt | updatedAt', () => {
      const user1 = new User({
        ...userProps,
        createdAt: new Date(Date.now() - 50000),
      })
      const user2 = new User({
        ...userProps,
        createdAt: new Date(Date.now() - 90000),
      })

      const user3 = new User({
        ...userProps,
        updatedAt: new Date(Date.now() - 50000),
      })

      const user4 = new User({
        ...userProps,
        updatedAt: new Date(Date.now() - 90000),
      })

      expect(user1.isEqual(user2)).toBeTruthy()
      expect(user3.isEqual(user4)).toBeTruthy()
      expect(user1.isEqual(user3)).toBeTruthy()
      expect(user2.isEqual(user4)).toBeTruthy()
    })

    it('should clone a user and then compare', () => {
      const user = new User(userProps)
      const clonedUser = user.clone()
      expect(user.isEqual(clonedUser)).toBeTruthy()
    })
  })

  describe('toPrimitives', () => {
    it('should return a primitive object', () => {
      const user = new User(userProps)
      const userPrimitives = user.toPrimitives()
      expect(userPrimitives).not.toEqual(userProps)

      expect(userProps.age).toBeInstanceOf(Age)
      expect(typeof userPrimitives.age).toBe('number')
    })

    it('should return a primitive object with default values', () => {
      const user = new User(userProps)
      const userPrimitives = user.toPrimitives()
      expect(userPrimitives.createdAt).toBeInstanceOf(Date)
      expect(userPrimitives.updatedAt).toBeNull()
    })
  })


  describe('history', () => {
    it('should have a history', () => {
      const user = new User(userProps)
      expect(user.history).toBeInstanceOf(EntityMetaHistory)
      expect(user.history.initialProps).toEqual(userProps)
    })

    it('should register an snapshot when some mutate was made', () => {
      const user = new User(userProps)
      user.changeEmail('paulo@gmail.com')
      expect(user.history.snapshots.length).toBe(1)
      expect(user.history.initialProps.email).not.toEqual(user.email)
      expect(user.history.hasChange('email')).toBeTruthy()

      expect(user.history.hasChange('name')).toBeFalsy()
    })


  })

})