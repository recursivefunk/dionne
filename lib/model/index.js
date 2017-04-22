
'use strict'

const P = require('bluebird')
const getUtils = require('../db/utils')

module.exports = (bookshelf, knex, tableName) => {
  const utils = getUtils(knex, tableName)
  return new P((resolve, reject) => {
    // Check to see if the table already exists.
    // If it does not, create it
    knex.schema.hasTable(tableName)
      .then((exists) => {
        if (!exists) {
          knex.schema.createTable(tableName, (t) => {
            t.increments('id').primary()
            t.text('key').notNullable().unique()
            t.jsonb('value').notNullable()
            t.text('set_at').nullable()
            t.text('last_updated').nullable()
          })
            .then(onTable)
            .then(() => resolve())
            .catch((e) => reject(e))
        } else {
          onTable().then(() => resolve())
        }
      })

    function onTable () {
      return new P((y, n) => {
        const model = bookshelf.Model.extend({
          tableName,
          format: utils.format,
          parse: utils.parse
        })
        y(model)
      })
    }
  })
}
