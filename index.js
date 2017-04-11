
'use strict'

const dionne = require('./lib/dionne')
const db = require('./lib/db')

module.exports = (config, bookshelf) => {
  return db(config, bookshelf).spread(dionne)
}
