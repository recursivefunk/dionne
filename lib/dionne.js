'use strict'

const P = require('bluebird')
const async = require('async')
const _ = require('lodash')
const component = require('stampit')
const dbu = require('./db/utils')

module.exports = (ContextModel, bookshelf, table, connOpts) => {
  const initResolver = P.pending()

  const unset = (model) => {
    return new P((resolve, reject) => {
      if (model) {
        model.destroy()
          .then(() => resolve())
          .catch((e) => reject(e))
      } else {
        resolve()
      }
    })
  }

  const _api = component({
    methods: {

      /**
       * Deletes the value at the specified key if it exists
       *
       */
      del (key) {
        return this._knex(table).del()
      },

      /**
       * Destroy the DB connection
       *
       * @deprecated
       *
       */
      destroy () {
        return this._knex.destroy()
      },

      setAll (itemsMap) {
        return new P((resolve, reject) => {
          let items

          const setPropVal = (obj, callback) => {
            const key = Object.keys(obj)[ 0 ]
            this.set(key, obj[ key ])
              .then(() => callback())
              .catch(callback)
          }
          const map = _.omit(itemsMap, _.isFunction)
          items = Object.keys(map).map((key) => {
            let o = {}
            o[key] = map[key]
            return o
          })

          async.each(items, setPropVal, (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })
      },

      persistCtx () {
        return this.setAll(this._data)
      },

      getAll (keys) {
        return new P((resolve, reject) => {
          const getKey = (key) => {
            return new P((y, n) => {
              this.get(key)
                .then((item) => {
                  let obj = {}
                  obj[ key ] = item
                  y(obj)
                }).catch((err) => n(err))
            })
          }

          P.map(keys, getKey)
            .then((maps) => {
              const ret = maps.reduce((prev, next) => {
                const key = Object.keys(next)[0]
                prev[key] = next[key]
                return prev
              }, {})
              resolve(ret)
            }).catch((err) => reject(err))
        })
      },

      get (key) {
        const self = this
        const query = { key }
        return new P((resolve, reject) => {
          self._knex(table)
            .where(query)
            .then((results) => {
              let data
              let value
              if (results[ 0 ]) {
                data = self._utils.parse(results[ 0 ])
                value = data.value
              }
              resolve(value)
            }).catch((err) => reject(err))
        })
      },

      set (key, data, ttl) {
        const self = this
        const query = { key: key }
        return new P((resolve, reject) => {
          if (!data) {
            process.nextTick(() => reject(new Error('Invalid data')))
          } else {
            performSet()
          }

          function onSave (result) {
            const model = result[ 0 ]
            let toSave
            if (model) {
              model.value = data
              return self._utils.save(query, model)
            } else {
              toSave = {
                key,
                value: data
              }
              if (typeof ttl === 'number') {
                toSave.ttl = ttl
              }
              return self._utils.insert(toSave)
            }
          } // end onSave()

          function performSet () {
            self._knex(table)
              .where(query)
              .then(onSave)
              .then((result) => {
                const data = self._utils.parse(result[ 0 ])
                let obj = {}
                if (typeof data.ttl === 'number') {
                  setTimeout(function () {
                    self.del(data.key)
                  }, ttl)
                }

                obj[ key ] = data.value
                resolve(obj)
              }).catch(function (err) {
                reject(err)
              })
          } // end performSet()
        })
      }
    }
  })
  .refs({
    _knex: bookshelf.knex,
    _table: table,
    _utils: dbu(bookshelf.knex, table),
    _connOpts: connOpts
  }).create()

  ContextModel.collection()
    .fetch()
    .then((foundItems) => {
      async.each(foundItems.models, expiredIfNeeded, (err) => {
        if (err) {
          initResolver.reject(err)
        } else {
          initResolver.resolve(_api)
        }
      })

      function expiredIfNeeded (item, callback) {
        if (item.isExpired()) {
          unset(item).finally(callback)
        } else {
          process.nextTick(callback)
        }
      }
    })

  process.nextTick(() => initResolver.resolve(_api))

  return initResolver.promise
}
