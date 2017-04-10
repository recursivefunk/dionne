
'use strict'

const Knex = require('knex')
const Bookshelf = require('bookshelf')
let bookshelf

module.exports = (dbUrl) => {
  const knex = Knex({ // jshint ignore:line
    client: 'pg',
    connection: dbUrl
  })

  bookshelf = Bookshelf(knex) // jshint ignore: line

  return bookshelf
}
