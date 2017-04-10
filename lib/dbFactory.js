
'use strict'

const Knex = require('knex')
const Bookshelf = require('bookshelf')
let bookshelf

module.exports = (dbUrl) => {
  const knex = Knex({ // jshint ignore:line
    client: 'pg',
    connection: dbUrl
  })

  if (!knex.client.config.connection) {
    throw Error(`Trouble connecting to '${dbUrl}'`)
  }

  bookshelf = Bookshelf(knex) // jshint ignore: line

  return bookshelf
}
