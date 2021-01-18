const database = require('mysql')
const dbConfig = require('./config/db')
const connection = database.createConnection(dbConfig)

module.exports = connection