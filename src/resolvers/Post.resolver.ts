import { Arg, Args, ArgsType, Ctx, Field, FieldResolver, Mutation, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import CommentEntity from "../entities/Comment.entity";
import PostEntity from "../entities/Post.entity";
import UserEntity from "../entities/User.entity";
import auth from "../middlewares/Auth";
import { MyContext } from "../types";

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

    @FieldResolver(() => [String])
    async likes() {

    }

    @FieldResolver(() => [CommentEntity])
    async comments(
        @Root() post: PostEntity
    ) {
        const comment = await CommentEntity.query(`
            SELECT c.* FROM comments c WHERE c."postId" = '${post.id}'
        `)

        return comment
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

    @Mutation(() => Boolean)
    @UseMiddleware(auth)
    async deletePost(

    ) {

    }

    @Mutation(() => PostEntity)
    async updatePost() {}

    @Mutation(() => PostEntity)
    async like() {}

    @Mutation(() => CommentEntity)
    @UseMiddleware(auth)
    async comment(
        @Arg("postId" , () => String) postId: string,
        @Arg("comment", () => String) comment: string ,
        @Ctx() { req }: MyContext
    ) {
        const { userId } = req.session
        const newComment = await CommentEntity.query(`
            INSERT INTO comments (id,"userId","postId",comment)
            VALUES (
                DEFAULT ,
                '${userId}',
                '${postId}',
                '${comment}'
            ) RETURNING *
        `)

        return newComment[0]
    }
}

export default PostResolver