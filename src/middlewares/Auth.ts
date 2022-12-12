import { NextFn, ResolverData } from "type-graphql";

export default async ({ info , root }: ResolverData , next: NextFn) => {
    return next()
}