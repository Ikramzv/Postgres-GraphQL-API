import { Request, Response } from 'express'
import { Session } from 'express-session'
import Redis from 'ioredis'

export interface MyContext {
    req: Request & { session: Session & { [key: string]: any , userId?: any } }
    res: Response
    redis: Redis
}