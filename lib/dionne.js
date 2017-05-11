'use strict'

const P = require('bluebird')
const async = require('async')
const omit = require('lodash.omit')
const isFunction = require('lodash.isfunction')
const component = require('stampit')
const dbu = require('./db/utils')

const Dionne = component()
  .init((opts, obj) => {
    const instance = obj.instance
    const utils = dbu(opts.bookshelf.knex, opts.table)

    instance.getDb = () => opts.bookshelf.knex
    instance.getTable = () => opts.table
    instance.getUtils = () => utils
    instance.getConnOpts = () => opts.connOpts
  })
  .methods({
    /**
     * Deletes the value at the specified key if it exists
     *
     * @param {string} key
     *
     */
    del (key) {
      return this.getDb()(this.getTable()).del()
    },

    /**
     * Destroy the DB connection
     *
     */
    destroy () {
      return this.getDb().destroy()
    },

    /**
     * Set all items in the map. Only top level keys will be used.
     * Sub objects will me stored as object blobs
     *
     * @param {object} itemsMap
     *
     */
    setAll (itemsMap) {
      return new P((resolve, reject) => {
        let items

        const setPropVal = (obj, callback) => {
          const key = Object.keys(obj)[ 0 ]
          this.set(key, obj[ key ])
            .then(() => callback())
            .catch(callback)
        }
        const map = omit(itemsMap, isFunction)
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

    /**
     * Gets every item stored behind each key
     *
     * @param {string[]} keys An array of string keys
     *
     */
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

    /**
     * Get the item stored with the specified key
     *
     * @param {string} key
     *
     */
    get (key) {
      const self = this
      const query = { key }
      return new P((resolve, reject) => {
        self.getDb()(self.getTable())
          .where(query)
            .then((results) => {
              let data
              let value
              if (results[ 0 ]) {
                data = self.getUtils().parse(results[ 0 ])
                value = data.value
              }
              resolve(value)
            }).catch((err) => reject(err))
      })
    },

    /**
     * Store the data behind the specified key
     *
     * @param {string} key
     * @param {(object|string)} data
     *
     */
    set (key, data) {
      const self = this
      const query = { key }
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
            return self.getUtils().save(query, model)
          } else {
            toSave = {
              key,
              value: data
            }
            return self.getUtils().insert(toSave)
          }
        } // end onSave()

        function performSet () {
          self.getDb()(self.getTable())
            .where(query)
              .then(onSave)
              .then((result) => {
                const data = self.getUtils().parse(result[ 0 ])
                let obj = {}
                obj[ key ] = data.value
                resolve(obj)
              }).catch((err) => reject(err))
        } // end performSet()
      })
    }
  })

module.exports = (Model, bookshelf, table, connOpts) => {
  return new P((resolve, reject) => {
    const opts = {
      Model,
      bookshelf,
      table,
      connOpts
    }
    resolve(Dionne.create(opts))
  })
}
