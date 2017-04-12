## Dionne Davenport

[![circle-status](https://circleci.com/gh/recursivefunk/dionne-davenport.png?circle-token=b071c5f82e8c33880dc87eb169d67434c65531b0)](https://circleci.com/gh/recursivefunk/dionne-davenport/)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](http://standardjs.com)

![](http://i.imgur.com/yh2In1R.gif)

Essentially hstore with JSON val

```
$ npm install dionne-davenport --save
```

Basic setting/getting

```javascript
const Dionne = require('dionne-davenport')
const opts = {
  appName: 'myApp',
  url: process.env.DATABASE_URL
}
const store = await Dionne(opts)
await store.set('as', 'if')
const result = await store.get('as')
console.log(result) // 'if'
```

Batch setting/getting

```javascript
const items = {
  foo: 'bar',
  ping: {
    beep: [ 'boop', 'bop' ]
  }
}
await store.setAll(items)
const result = await store.getAll(Object.keys(items))
console.log(result)
/*
{
  foo: 'bar',
  ping: {
    beep: [ 'boop', 'bop' ]
  }
}
*/
```

Deletion

```javascript
let item
await store.set('delMe', 'foo')
item = await store.get('delMe')
console.log('delMe') // foo

await store.del('delMe')
item = await store.get('delMe')
console.log(item) // undefined
```


### Tests
Create your test PostgresSQL database and user and create a test.env file for environment constiables

```
$ createuser myApp
$ createdb myApp
$ echo "DATABASE_URL=postgres://myApp:Ffoodk@localhost:5432/myApp" >> test/test.env
$ echo "NODE_ENV=test" >> test/test.env
$ echo "APP_NAME=appName" >> test/test.env
$ npm test
```
