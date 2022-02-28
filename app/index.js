require('dotenv').config()

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT || 3000

// middlewares:
app.use(bodyParser.json())
app.use(cors())

// routes:
require('./routes')(app)

app.listen(port, () => {
    console.log('Task Management API is listening on port: ' + port)
})