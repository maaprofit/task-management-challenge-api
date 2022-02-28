module.exports = app => {
    app.use('/tasks', require('./tasks'))
}