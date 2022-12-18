declare namespace NodeJS {
    interface ProcessEnv {
        POSTGRES_PASSWORD: string
        POSTGRES_USERNAME: string
        POSTGRES_DATABASE: string
        SESSION_SECRET: string
    }
}
