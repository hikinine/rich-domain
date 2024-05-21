import { DomainError, Entity, EntityHook, Id, ValueObject } from "../../lib/core"
import { EntityInputWithOptionals, EntityProps } from "../../lib/core/types"
import { is } from "../../lib/core/validation-is"
import { Age } from "./mocks/entity"

describe('entity hooks', () => {
  let userProps: UserProps

  interface MemeProps {
    a: number
    b: number
  }
  class Meme extends ValueObject<MemeProps> { }
  interface UserProps extends EntityProps {
    name: string
    email: string
    teste: string | null
    age: Age
    post: Posts
    posts: Posts[]
  }
  interface PostProps extends EntityProps {
    title: string
    content: string
    meme: Meme
    memes: Meme[]
  }
  class Posts extends Entity<PostProps> {
    public changeTitle(title: string) {
      this.props.title = title
    }

    get memes() {
      return this.props.memes
    }

    get meme() {
      return this.props.meme
    }

    get title() {
      return this.props.title
    }

    public addMeme(meme: Meme) {
      this.props.meme = meme
    }

    public removeMeme(meme: Meme) {
      this.props.memes = this.props.memes.filter(m => m.isEqual(meme))
    }
  }

  type UserInput = EntityInputWithOptionals<UserProps, 'name' | 'email'>
  class User extends Entity<UserProps, UserInput> {
    protected static hooks = new EntityHook<User, UserProps, UserInput>({
      typeValidation: {
        name: is.string(2, 255),
        email: is.email(),
        age: is.instanceof(Age),
        post: is.instanceof(Posts),
        posts: is.arrayOf(is.instanceof(Posts)),
        teste: is.nullable(is.string(2, 255))
      },
      defaultValues: {
        name: () => 'Paulo Santana',
        email: ''
      }
    })

    get name() {
      return this.props.name
    }

    get age() {
      return this.props.age
    }

    get posts() {
      return this.props.posts
    }

    get post() {
      return this.props.post
    }
    get email() {
      return this.props.email
    }

    public addPost(post: Posts) {
      this.props.posts.push(post)
    }

    public changePostSTitle(posstId: Id, title: string) {
      const post = this.posts.find(p => p.id.isEqual(posstId))
      if (!post) return
      post.changeTitle(title)
    }

    public changeEmail(email: string) {
      this.props.email = email
    }


    public changePostTitle(title: string) {
      this.post.changeTitle(title)
    }

    public pushIntoMemes(meme: Meme) {
      this.post.memes.push(meme)
    }
  }
  beforeEach(() => {
    userProps = {
      id: new Id(),
      posts: [ 
      ],
      age: new Age(25),
      email: 'paulo.artlab@gmail.com',
      teste: 999 as any,
      name: 'Paulo Santana',
      post: new Posts({
        id: new Id(),
        title: 'Post 1', content: 'Content 1',
        meme: new Meme({ a: 1, b: 2 }),
        memes: [new Meme({ a: 3, b: 5 }), new Meme({ a: 6, b: 7 })]
      })
    }
  });
  describe('hook behaviors', () => {
    it('should execute revalidate method', () => { 
       try {
        const newEmail = 'register@gmail.com'
        const user = new User(userProps)
        user.changeEmail(newEmail)
        user.addPost(
          new Posts({
            id: new Id(),
            title: 'Post 2', content: 'Content 2',
            meme: new Meme({ a: 1, b: 2 }),
            memes: [new Meme({ a: 3, b: 5 }), new Meme({ a: 6, b: 7 })]
          })
        )
        user.changePostSTitle(user.posts[0].id, 'Post 1 updated')

        expect(user).toBeInstanceOf(User)
       } catch (error) {
        console.log(error)
       }
    
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