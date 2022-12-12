import { Arg, Args, ArgsType, Field, FieldResolver, Mutation, Query, Resolver, Root } from "type-graphql";
import PostEntity from "../entities/Post.entity";
import UserEntity from "../entities/User.entity";

@ArgsType()
class PostArgs {
    @Field(() => String)
    title: string

    @Field(() => String)
    description: string
}

@Resolver(() => PostEntity)
class PostResolver {
    @FieldResolver(() => UserEntity)
    async user (
        @Root() post: PostEntity
    ) {
        console.log(post)
        const user = await UserEntity.query(`
            SELECT * FROM users u WHERE u.id = '${post.userId}'
        `)

        return user[0]
    }

    @Query(() => [PostEntity])
    async posts (): Promise<PostEntity[]> {
        const posts = await PostEntity.query(`
            SELECT * FROM posts p
        `)

        return posts
    }

    @Query(() => PostEntity)
    async post(
        @Arg("id",() => String) postId: string
    ): Promise<PostEntity> {
        const post = await PostEntity.query(`
            SELECT * FROM posts p WHERE p.id = '${postId}'
        `)

        return post
    }

    @Mutation(() => PostEntity)
    async createPost (
        @Args(() => PostArgs) args: PostArgs
    ) {
        const { title , description } = args

        const post = await PostEntity.query(`
            INSERT INTO posts (
                id , title, description, "userId"
            ) VALUES (
                DEFAULT , '${title}' , '${description}' , 'f379eb88-f310-4b31-add4-37296ad73b81'
            ) RETURNING *
        `)
                
        return post[0]
    }
}

export default PostResolver