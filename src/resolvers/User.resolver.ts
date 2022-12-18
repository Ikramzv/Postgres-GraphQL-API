import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import PostEntity from "../entities/Post.entity";
import SaveEntity from '../entities/Save.entity';
import UserEntity from "../entities/User.entity";
import { MyContext } from '../types';


@Resolver(() => UserEntity)
class UserResolver {

    @Query(() => UserEntity , { nullable: true })
    async getUser (
        @Arg("id" , () => String , { nullable: true }) userId: string,
        @Arg("email" , () => String , { nullable: true }) email: string
    ) {
        let user
        if(userId) {
            user = await UserEntity.query(`
                SELECT * FROM users u WHERE u.id = '${userId}'
            `)
        } else if(email) {
            user = await UserEntity.query(`
                SELECT * FROM users u WHERE u.email = '${email}'
            `)
        }

        return user[0] ?? null
    }

    @Query(() => UserEntity , { nullable: true })
    async callMe (
        @Ctx() { req } : MyContext
    ) {
        const { session } = req
        if(!session.userId) return null
        const user = await UserEntity.query(`
            SELECT * FROM users u WHERE u.id = '${session.userId}'
        `)
        return user[0]
    }

    @Query(() => [PostEntity])
    async savedPosts (
        @Ctx() { req } : MyContext
    ) {
        const { session } = req
        if(!session.userId) return
        const { userId } = session
        const posts = await SaveEntity.query(`
            SELECT "postId" , p.* FROM saves s 
            LEFT JOIN posts p ON p.id = s."postId" 
            WHERE s."userId" = $1
        ` , [userId])

        console.log(posts)

        return posts
    }

    @Mutation(() => Boolean)
    async savePost(
        @Arg("postId" , () => String) postId: string,
        @Ctx() { req }: MyContext
    ): Promise<Boolean> {
        const { session: { userId } } = req
        if(!userId) return false
        try {
            await SaveEntity.query(`
                INSERT INTO saves (id,"postId","userId") VALUES ( DEFAULT , $1 , $2 )
            ` , [postId ,  userId])
            return true
        } catch (error) {
            return false
        }
    }

    @Mutation(() => Boolean)
    async unsavePost(
        @Arg("postId" , () => String) postId: string,
        @Arg("userId" , () => String) userId: string
    ) {
        try {
            const deleted = await SaveEntity.query(`
                DELETE FROM saves s WHERE s."postId" = '${postId}' AND s."userId" = '${userId}'
            `)
            if(deleted[1] === 0) return false // Nothing deleted
            return true
        } catch (error) {
            return false
        }
    }
    

}

export default UserResolver