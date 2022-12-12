import bcrypt from 'bcrypt';
import { Arg, Args, ArgsType, Field, Mutation, Query, Resolver } from "type-graphql";
import SaveEntity from '../entities/Save.entity';
import UserEntity from "../entities/User.entity";


@ArgsType()
class RegisterUserArgs {
    @Field(() => String)
    username: string

    @Field(() => String)
    email: string

    @Field(() => String)
    password: string

    @Field(() => String)
    image: string
}

@Resolver(() => UserEntity)
class UserResolver {
    @Query(() => UserEntity)
    async getUser (
        @Arg("id") userId: string
    ) {
        const user = await UserEntity.query(`
            SELECT * FROM users u WHERE u.id == '${userId}'
        `)

        return user
    }

    @Mutation(() => UserEntity , { nullable: true })
    async register (
        @Args(() => RegisterUserArgs) options: RegisterUserArgs
    ) {
        const password = await bcrypt.hash(options.password , 12)
        const user = await UserEntity.query(`
            INSERT INTO users (
                id , username , email , password , image
            ) VALUES (
                DEFAULT , '${options.username}' , '${options.email}' , '${password}' , '${options.image}'
            ) ON CONFLICT DO NOTHING RETURNING *
        `)

        return user[0] ?? null
    }


    @Mutation(() => Boolean)
    async savePost(
        @Arg("postId" , () => String) postId: string,
        @Arg("userId" , () => String) userId: string 
    ): Promise<Boolean> {
        try {
            await SaveEntity.query(`
                INSERT INTO saves (id,"postId","userId") VALUES ( DEFAULT , '${postId}' , '${userId}' )
            `)
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