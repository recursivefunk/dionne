
'use strict'

const check = require('check-types')

const stringIt = (val) => {
  if (check.array(val)) {
    return JSON.stringify(val)
  } else {
    return val.toString()
  }
}

const parseIt = (data) => {
  try {
    const val = JSON.parse(data)
    return val
  } catch (e) {
    return data
  }
}

module.exports = (knex, table) => {
  const helpers = {
    insert (data) {
      const toSave = helpers.format(data, true)
      return knex(table)
        .returning('*')
        .insert(toSave)
    },

    save (criteria, data) {
      const toSave = helpers.format(data)
      return knex(table)
        .where(criteria)
        .update({
          last_updated: toSave.last_updated,
          value: toSave.value
        }, '*')
    },

    parse (attrs) {
      let data
      if (typeof attrs.value.val === 'string') {
        data = parseIt(attrs.value.val)
      } else {
        data = attrs.value
      }
      attrs.value = data
      return attrs
    },

    format (attrs, isNew) {
      if (attrs.key) {
        attrs.key = attrs.key.trim()
      }

      if (typeof attrs.value === 'function') {
        attrs = {}
        return attrs
      }

      if (attrs.value) {
        const tmpVal = attrs.value
        let val
        if (typeof tmpVal === 'object' && !check.array(tmpVal)) {
          val = tmpVal
        } else {
          val = {
            val: stringIt(tmpVal)
          }
        }
        attrs.value = val
      }

      const now = new Date().toISOString()

      if (isNew) {
        attrs.set_at = now
      }

      attrs.last_updated = now

      return attrs
    }
  }
  return Object.create(helpers)
}
