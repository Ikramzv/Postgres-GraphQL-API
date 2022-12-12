import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import Redis from 'ioredis'
import path from 'path'
import { buildSchema } from 'type-graphql'
import { DataSource } from 'typeorm'
import { MyContext } from './types'

const main = async() => {
    const redisServer = new Redis()
    const app = express()
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [path.join(__dirname, '../dist/resolvers' , '/*.resolver.js')],
        }),
        context: ({ req , res }): MyContext => ({ redis: redisServer , req , res }), 
        plugins: [
            ApolloServerPluginLandingPageGraphQLPlayground()
        ]
    })

    const dataSource = new DataSource({
        type: 'postgres',
        username: 'postgres',
        password: 'ikram123',
        database: 'media_app',
        synchronize: true,
        logging: true,
        entities: [path.join(__dirname, '../dist/entities' , '/**/*.js')],
        migrations: [],
    })
    await dataSource.initialize()
    // await dataSource.runMigrations()
    
    await apolloServer.start()
    apolloServer.applyMiddleware({
        app,
        cors: ({ 
            origin: true,
            credentials: true
        })
    })
    
    app.get('/' , (req,res) => {
        res.send("App is running succesefully, LET'S GO === ! ")
    })

    app.listen(process.env.PORT || 4000 , () => {
        console.log('App is running')
    })

}

main().then(() => {
    console.log('MAIN FUNCTION')
}).catch((err) => console.log("======= MAIN ERROR ======" , err))