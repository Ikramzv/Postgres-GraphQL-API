import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
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
        
        const payload = {
            id: u.id,
            email: u.email,
            username: u.username
        }
        const accessToken = generateAccessToken(payload)
        const refreshToken = generateRefreshToken(payload)
        
        req.session.userId = u.id
        req.session.accessToken = accessToken
        req.session.refreshToken = refreshToken
        
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

    @Mutation(() => String)
    async refreshAccessToken(
        @Ctx() { req }: MyContext
    ) {
        const { refreshToken, accessToken } = req.session
        const decodedAccessToken = jwt_decode(accessToken as string)
        if(Date.now() > (decodedAccessToken as any).exp) {
            jwt.verify(refreshToken as string,process.env.JWT_REFRESH_SECRET, (err,data) => {
                if(err) return err
                delete (data as any).iat
                const payload = {
                    ...data as any,
                }
                const newRefreshToken = generateRefreshToken(payload)
                const newAccessToken = generateAccessToken(payload)
                
                req.session.accessToken = newAccessToken
                req.session.refreshToken = newRefreshToken 
            })
        }

        return ""
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

const generateAccessToken = (payload: any) => {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: 60 * 5 })
}

const generateRefreshToken = (payload: any) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET)
}


export default AuthResolver