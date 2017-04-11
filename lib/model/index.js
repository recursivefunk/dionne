
'use strict'

const P = require('bluebird')

module.exports = (bookshelf, knex, tableName) => {
  const utils = require('../db/utils')(knex, tableName)
  return new P((resolve, reject) => {
    knex.schema.hasTable(tableName)
      .then((exists) => {
        if (!exists) {
          knex.schema.createTable(tableName, (t) => {
            t.increments('id').primary()
            t.text('key').notNullable().unique()
            t.json('value').notNullable()
            t.text('setAt').nullable()
            t.text('lastUpdated').nullable()
          })
            .then(onTable)
            .catch((e) => {
              reject(e)
            })
        } else {
          onTable()
        }
      })

    function onTable () {
      const model = bookshelf.Model.extend({
        tableName,
        format: utils.format,
        parse: utils.parse
      })
      resolve(model)
    }
  })
}
