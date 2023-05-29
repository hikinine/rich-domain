import { Entity, Id, ValueObject } from ".";

describe("vo", () => {

  interface AuthProps {
    password: Password
  }
  class Password extends ValueObject<string> { }
  class Auth extends ValueObject<AuthProps> { }
  class Name extends ValueObject<string> { }

  interface AProps {
    id?: Id
    name: Name
    auth: Auth
  }
  class A extends Entity<AProps> { }
  it("should be true", () => {
    const entity = new A({
      name: new Name("hiki9"),
      auth: new Auth({
        password: new Password("1234567")
      })
    })

    console.log(JSON.stringify((entity as any).props, null, 2))
    console.log(entity.toPrimitives())
    expect(true).toBe(true);
  })
})