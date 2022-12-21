import { NextFn, ResolverData } from "type-graphql";
import { MyContext } from "../types";

const auth = async ({ info , root, context }: ResolverData<MyContext> , next: NextFn) => {
    const { req } = context
    
    if(!req.session.userId) return new Error("not authenticated")

    return await next()
}

export default auth