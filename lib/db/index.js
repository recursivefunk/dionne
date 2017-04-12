
'use strict'

const P = require('bluebird')
const Model = require('../model')
const dbFactory = require('./factory')

module.exports = (opts, bookshelf) => {
  opts = opts || {}
  const url = opts.url
  const appName = opts.appName || 'app'

  if (!bookshelf) {
    bookshelf = dbFactory(url)
  }

  const knex = bookshelf.knex
  const table = `${appName}_kj`

  return new P((resolve, reject) => {
    Model(bookshelf, knex, table)
      .then((model) => resolve([ model, bookshelf, table, opts ]))
      .catch((err) => reject(err))
  })
}
