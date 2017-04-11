
'use strict'

const Knex = require('knex')
const Bookshelf = require('bookshelf')
let bookshelf

module.exports = (url) => {
  const knex = Knex({ // jshint ignore:line
    client: 'pg',
    connection: url
  })

  if (!knex.client.config.connection) {
    throw Error(`Trouble connecting to '${url}'`)
  }

  bookshelf = Bookshelf(knex) // jshint ignore: line

  return bookshelf
}
