
'use strict'

const Knex = require('knex')
const Bookshelf = require('bookshelf')
let bookshelf

module.exports = (url) => {
  const client = getClient(url)
  const knex = Knex({
    client,
    connection: url
  })

  if (!knex.client.config.connection) {
    throw Error(`Trouble connecting to '${url}'`)
  }

  bookshelf = Bookshelf(knex)

  return bookshelf
}

function getClient(url) {
  if (url.indexOf('postgresql://') > -1) {
    return 'pg'
  } else if (url.indexOf('mysql://') > -1) {
    return 'mysql'
  } else {
    throw Error(`Can't connect to '${url}'`)
  }
}
