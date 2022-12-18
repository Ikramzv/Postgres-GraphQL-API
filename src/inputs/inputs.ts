import { Field, InputType, ObjectType } from "type-graphql"
import UserEntity from "../entities/User.entity"

@InputType()
export class RegisterUserArgs {
    @Field(() => String)
    username: string

    @Field(() => String)
    email: string

    @Field(() => String)
    password: string

    @Field(() => String)
    image: string
}

@InputType()
export class LoginUserArgs {
    @Field(() => String)
    email: string

    @Field(() => String)
    password: string
}

// Additional object types

@ObjectType()
export class Error {
    @Field(() => String)
    title: string
    @Field(() => String)
    description: string
}

@ObjectType()
export class UserOrError {
    @Field(() => Error , { nullable: true })
    error: Error | null
    @Field(() => UserEntity , { nullable: true })
    data: UserEntity | null    
}