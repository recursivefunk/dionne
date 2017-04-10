
'use strict'

const ctx = require('./lib/ctx')
const db = require('./lib/db')

module.exports = (config, bookshelf) => {
  return db(config, bookshelf).spread(ctx)
}
