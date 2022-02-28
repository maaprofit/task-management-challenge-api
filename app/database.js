module.exports = {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: true,
    pool: {
        max: 5,
        min: 0,
        idle: 10000,
        acquire: 60 * 60 * 1000
    }
};