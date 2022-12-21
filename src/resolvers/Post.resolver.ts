import { Arg, Args, ArgsType, Ctx, Field, FieldResolver, InputType, Mutation, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import CommentEntity from "../entities/Comment.entity";
import LikesEntity from "../entities/Likes.entity";
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

@InputType()
class UpdateArgs {
    @Field(() => String)
    postId: string

    @Field(() => String, { nullable: true })
    title: string

    @Field(() => String, { nullable: true })
    description: string
}

@Resolver(() => PostEntity)
class PostResolver {
    @FieldResolver(() => UserEntity)
    async user (
        @Root() post: PostEntity
    ) {
        const user = await UserEntity.query(`
            SELECT * FROM users u WHERE u.id = '${post.userId}'
        `)

        return user[0]
    }

    @FieldResolver(() => [String])
    async likes(
        @Root() post: PostEntity
    ) {
        const likes: {userId: string}[] = await LikesEntity.query(`
            SELECT "userId" FROM likes l WHERE l."postId" = '${post.id}'
        `)
        
        return likes.map((item) => item.userId)
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
    @UseMiddleware(auth)
    async createPost (
        @Args(() => PostArgs) args: PostArgs,
        @Ctx() { req }: MyContext
    ) {
        const { title , description } = args

        const post = await PostEntity.query(`
            INSERT INTO posts (
                id , title, description, "userId"
            ) VALUES (
                DEFAULT , '${title}' , '${description}' , '${req.session.userId}'
            ) RETURNING *
        `)
                
        return post[0]
    }

    @Mutation(() => Boolean)
    @UseMiddleware(auth)
    async deletePost(
        @Arg("postId", () => String) postId: string,
        @Ctx() { req }: MyContext
    ) {
        const post: PostEntity[] = await PostEntity.query(`
            SELECT * FROM posts p WHERE p.id = '${postId}'
        `)
        if(!post[0]) throw new Error("Couldn't found such a post with the given id")
        if(post[0].userId !== req.session.userId) throw new Error("Unauthorized")
    
        await post[0].remove()

        return true
    }

    @Mutation(() => PostEntity)
    async updatePost(
        @Arg("options", () => UpdateArgs) options: UpdateArgs,
        @Ctx() { req }: MyContext
    ) {
        const { postId, ...others } = options
        const post = await PostEntity.query(`
            SELECT * FROM posts p WHERE p.id = '${postId}'
        `)
        if(!post[0]) throw new Error("Couldn't found such a post with the given id")
        if(post[0].userId !== req.session.userId) throw new Error("Unauthorized")
        
        const definedArgs = Object.keys(others).reduce((initial , key: any) => {
            if(!(others as any)[key]) return initial ;
            if(initial) initial += "," 
            initial += `${key} = '${(others as any)[key]}'`
            return initial
        } , "")

        const updatedPost = await PostEntity.query(`
            UPDATE posts SET ${definedArgs} WHERE id = '${postId}' RETURNING *
        `)
        return updatedPost[0][0]
    }

    @Mutation(() => String)
    @UseMiddleware(auth)
    async like(
        @Arg("postId" , () => String) postId: string,
        @Ctx() { req }: MyContext
    ) {
        const { userId } = req.session
        const likedPost = await LikesEntity.query(`
            SELECT * FROM likes l WHERE l."postId" = '${postId}' AND l."userId" = '${userId}'
        `)
        let result;
        if(!likedPost[0]) {
            await LikesEntity.query(`
                INSERT INTO likes (id,"postId","userId") 
                VALUES ( DEFAULT, '${postId}', '${userId}' )
            `)
            result = "liked"
        } else {
            await LikesEntity.query(`
                DELETE FROM likes WHERE "postId" = '${postId}' AND "userId" = '${userId}'
            `)
            result = "unliked"
        }
        
        return result
    }

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