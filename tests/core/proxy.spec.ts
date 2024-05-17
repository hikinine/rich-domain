
import { Entity, Id, ValueObject } from "../../lib/core";
import { EntityProps } from "../../lib/core/types";

describe('entity proxy', () => {
  class Age extends ValueObject<number> { }
  class Username extends ValueObject<string> { }
  class Title extends ValueObject<string> { }
  class Content extends ValueObject<string> { }
  class Password extends ValueObject<string> { }

  interface ProfileProps {
    name: Username
    age: Age
    office: string
  }
  interface PostMetaProps extends EntityProps {
    likes: number
    views: number
  }

  interface PostProps extends EntityProps {
    title: Title
    postMeta: PostMeta
    content: Content
    additional: string
  }
  interface AuthProps extends EntityProps {
    password: Password
  }

  class CustomSettings extends ValueObject<string> { }
  interface UserProps extends EntityProps {
    profile: Profile
    posts: Post[]
    auth: Auth
    status: boolean
    customSettings: CustomSettings[]
  }

  class User extends Entity<UserProps> {

    public toggleStatus() {
      this.props.status = !this.props.status

    }

    public changePassword(password: string) { 
      this.auth.changePassword(password)
    }

    public changePostTitle(postId: Id, title: string) {
      const post = this.posts.find(p => p.id.isEqual(postId))
      if (!post) {
        throw new Error('Post not found')
      }
      post.changeTitle(title)
    }

    public newPost(post: Post) {
      this.props.posts.push(post)
    }

    public addCustomSetting(setting: CustomSettings) {
      this.props.customSettings.push(setting)
    }

    public removeCustomSetting(setting: CustomSettings) {
      this.props.customSettings.splice(this.props.customSettings.indexOf(setting), 1)
    }

    public changePositionZeroOfCustomSetting(newSetting: CustomSettings) {
      this.props.customSettings[5] = newSetting
    }

    get customSettings() {
      return this.props.customSettings
    }

    get status() {
      return this.props.status
    }
    get profile() {
      return this.props.profile
    }
    get posts() {
      return this.props.posts
    }
    get auth() {
      return this.props.auth
    }
  }
  class Profile extends ValueObject<ProfileProps> {
    get name() {
      return this.props.name
    }
    get age() {
      return this.props.age
    }
    get office() {
      return this.props.office
    }
  }
  class Post extends Entity<PostProps> {

    public changeTitle(title: string) {
      this.props.title = new Title(title)
    }
    get title() {
      return this.props.title
    }
    get postMeta() {
      return this.props.postMeta
    }
    get content() {
      return this.props.content
    }
    get additional() {
      return this.props.additional
    }
  }
  class Auth extends Entity<AuthProps> {
    changePassword(password: string) {
      this.props.password = new Password(password)
    }

    get password() {
      return this.props.password
    }
  }
  class PostMeta extends Entity<PostMetaProps> {
    public likeIt() {
      this.props.likes++
    }

    get likes() {
      return this.props.likes
    }
    get views() {
      return this.props.views
    }
  }


  let user: User

  beforeEach(() => {
    user = new User({
      id: new Id(),
      status: true,
      profile: new Profile({
        name: new Username('Paulo'),
        age: new Age(25),
        office: 'developer'
      }),
      customSettings: [
        new CustomSettings('settings-default'),
        new CustomSettings('settings-2'),
        new CustomSettings('settings-3'),
        new CustomSettings('settings-4'),
        new CustomSettings('settings-5'),
        new CustomSettings('settings-6'),
        new CustomSettings('settings-7'),
      ],
      posts: [
      ],
      auth: new Auth({
        id: new Id(),
        password: new Password('123456')
      })
    })
  })

  it('should create a new entity', () => {
    expect(user).toBeInstanceOf(User)
    expect(user.auth).toBeInstanceOf(Auth)
    expect(user.profile).toBeInstanceOf(Profile)

    expect(user.profile.name.value).toBe('Paulo')
    expect(user.profile.age.value).toBe(25)
    expect(user.profile.office).toBe('developer')
    expect(user.auth.password.value).toBe('123456')


    user.newPost(
      new Post({
        id: new Id(),
        title: new Title('title2'),
        postMeta: new PostMeta({
          id: new Id(),
          likes: 0,
          views: 0
        }),
        content: new Content('content2'),
        additional: 'additional2'
      })

    )

    user.changePassword('1234567')
    user.changePassword('abcdefg')
    user.changePostTitle(user.posts[0].id, 'new title')


    let props = {
      status: user.status
    } as any

    user.toggleStatus()
    console.log('⭐⭐⭐⭐⭐⭐⭐') 
    console.log(user.customSettings)
    user['props'].customSettings.pop()
    user['props'].customSettings.shift()
    user['props'].customSettings.unshift(new CustomSettings('settings-1'))
    user['props'].customSettings.slice(0, 2)
    user['props'].customSettings.fill(new CustomSettings('settings-2'))
    user['props'].customSettings.push(new CustomSettings('settings-8'))
    console.log(user.customSettings)
    console.log(user.history.snapshots.map(s => s.trace))
    console.log(user.posts.map(p => p.history.snapshots.map(s => s.trace)))
    user.subscribe({
      customSettings: (customSettings) => { 
      },
      auth: (auth) => {
        props.auth = {
          where: {
            id: auth.id
          },
          update: {
            password: auth.password.value
          }
        }

        auth.subscribe({

        })
      },

      posts: (posts) => {
        posts.currentProps.forEach(post => {
          post.subscribe({
            postMeta: postMeta => {
              console.log('mudei postMeta', postMeta)
            }
          })
        })
      }
    })
  })



  it('proxies', () => {
    console.log('after user create')
    user.changePassword('1234567')
  })
})