import bcrypt from 'bcrypt';
import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import UserEntity from "../entities/User.entity";
import { LoginUserArgs, RegisterUserArgs, UserOrError } from "../inputs/inputs";
import { MyContext } from "../types";

@Resolver()
class AuthResolver {
    @Mutation(() => UserOrError)
    async login (
        @Arg('options' , () => LoginUserArgs) options: LoginUserArgs,
        @Ctx() { req }: MyContext
    ): Promise<UserOrError> {
        const { email , password } = options
        const user: UserEntity[] = await UserEntity.query(`
            SELECT * FROM users u WHERE u.email = '${email}'
        `)
        if(!user.length) return {
            error: {
                title: "email",
                description: "User is not found with that email"
            },
            data: null
        } 
        const u = user[0]
        const isValid = await bcrypt.compare(password , u.password)
        if(!isValid) return {
            data: null,
            error: {
                title: "password",
                description: "Password is not correct"
            }
        }  
        
        req.session.userId = u.id
        
        return {
            data: u,
            error: null
        }
    }

    @Mutation(() => UserEntity , { nullable: true })
    async register (
        @Arg("options" , () => RegisterUserArgs) options: RegisterUserArgs
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
    async logout (
        @Ctx() { req , res } : MyContext
    ) {
        const { session } = req
        try {
            session.destroy((err) => {
                if(err) return err
            })
            res.clearCookie("uid")
            return true
        } catch (error) {
            return false
        }
    }
}

export default AuthResolver