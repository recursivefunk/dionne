
'use strict';

const P = require('bluebird');

module.exports = (bookshelf, knex, tableName) => {
  const resolver = P.pending();
  const utils = require('../lib/dbUtils')(knex, tableName);

  knex.schema.hasTable(tableName)
    .then((exists) => {
      if (!exists) {
        knex.schema.createTable(tableName, (t) => {
          t.increments('id').primary();
          t.text('key').notNullable().unique();
          t.json('value').notNullable();
          t.integer('ttl').nullable();
          t.text('setAt').nullable();
          t.text('lastUpdated').nullable();
        })
          .then(onTable)
          .catch((e) => {
            resolver.reject(e);
          });
      } else {
        onTable();
      }
    });

  function onTable() {
    const model = bookshelf.Model.extend({
      tableName,
      format: utils.format,
      parse: utils.parse,
      isExpired() {
        const ttl = this.get('ttl');
        const setAtStr = this.get('lastUpdated');
        let expired = false;

        if (ttl) {
          const now = new Date();
          const setAt = new Date(setAtStr);
          const expiresRaw = setAt.getTime() + ttl;
          const expires = new Date(expiresRaw);
          if (expires < now) {
            return true;
          }
        }
        return expired;
      }
    });
    resolver.resolve(model);
  }
  return resolver.promise;
};
