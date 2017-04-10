
'use strict'

const P = require('bluebird')
const ContextModel = require('../models/contextModel')
const dbFactory = require('./dbFactory')

module.exports = (opts, bookshelf) => {
  opts = opts || {}
  const dbUrl = opts.dbUrl
  const appName = opts.appName || 'app'

  if (!bookshelf) {
    bookshelf = dbFactory(dbUrl)
  }

  const knex = bookshelf.knex
  const table = `${appName}_kj`

  return new P((resolve, reject) => {
    ContextModel(bookshelf, knex, table)
      .then((model) => resolve([ model, bookshelf, table, opts ]))
      .catch((err) => reject(err))
  })
}
