const credentials = {
    dialect: 'postgres',
    dialectOptions: {
        useUTC: true,
    },
    logging: console.log,
    timezone: 'UTC',
    pool: {
        max: 5,
        min: 0,
        idle: 10000,
        acquire: 60 * 60 * 1000
    }
}

if (process.env.NODE_ENV == 'production') {
    credentials.url = process.env.DATABASE
} else {
    credentials.username = process.env.DB_USER
    credentials.password = process.env.DB_PASS
    credentials.database = process.env.DB_NAME
    credentials.host = process.env.DB_HOST
    credentials.port = process.env.DB_PORT
}

module.exports = credentials