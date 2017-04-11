
'use strict'

require('leaked-handles')

const test = require('ava')
const appStore = require('../index')
const DB = require('../lib/db')
const check = require('check-types')
const env = require('./helpers/env')

const opts = {
  appName: env.appName,
  url: env.url
}

const tearDown = (store, t) => {
  return store.destroy()
}

/**
 * Empty the database table of any lingering data
 * from previous tests
 *
 */
test.before(async t => {
  const db = await DB(opts)
  const knex = db[1].knex
  const table = db[2]
  console.log(`Cleaning '${table}' table...`)
  await knex(table).del()
})

test('simple set/get', async t => {
  let store
  let item
  store = await appStore(opts)
  item = await store.get('fooz')
  t.is(undefined, item)
  await store.set('fooz', 'booz')
  item = await store.get('fooz')
  t.is(item, 'booz')
})

test('batch setting/getting', async t => {
  let store
  let itemMap

  const data = {
    foo: 'bar',
    bar: 'baz',
    bam: 12,
    arr: [ 1, 2, 3 ]
  }

  store = await appStore(opts)
  await store.setAll(data)
  itemMap = await store.getAll(Object.keys(data))

  t.truthy(itemMap.foo, 'foo prop is good.')
  t.is(itemMap.foo, data.foo, 'itemMap.foo matches data.foo.')

  t.truthy(itemMap.bar, 'bar prop is good')
  t.is(itemMap.bar, data.bar, 'itemMap.bar matches data.bar')

  t.truthy(itemMap.bam, 'bam prop is good')
  t.is(itemMap.bam, data.bam, 'itemMap.bar matches data.bar')

  itemMap.arr.forEach((el, index) => {
    t.truthy(
      el,
      data.arr[ index ],
      `itemMap.arr[${index}] matches data.arr[${index}]`
    )
  })
  // ensure data types are preserved
  t.is(typeof itemMap.bam, 'number', 'itemMap.bam is still a number')

  t.is(
    true, check.array(itemMap.arr), 'itemMap.arr is still an array'
  )
  await tearDown(store, t)
})

test('delete key', async (t) => {
  let item
  const store = await appStore(opts)

  await store.set('delMe', 'foo')
  item = await store.get('delMe')
  t.is(typeof item, 'string', 'string saved correctly')
  t.is(item, 'foo', 'Object key is as it should be')
  await store.del('delMe')
  item = await store.get('delMe')
  t.falsy(item, 'Deleted item has been deleted')
  await tearDown(store, t)
})

// test('ttl functionality', async (t) => {
//   let item
//   const store = await appStore(opts)
//
//   await store.set('beep', 'boop', 500)
//   item = await store.get('beep')
//   t.truthy(item, 'The item was successfully set')
//   t.is(item, 'boop', `The item's value is as expected`)
//
//   await (() => {
//     return new P((resolve, reject) => {
//       setTimeout(() => {
//         store.get('beep')
//           .then((fetched) => {
//             t.falsy(fetched, 'The fetched item should be undefined by now')
//             resolve()
//           })
//           .catch((err) => reject(err))
//       }, 1000)
//     })
//   })()
//   await tearDown(store, t)
// })
