# rollup-watch-next

Extend `rollup.watch` with a convenient async iterator API, and emit watch start and close events to `process`.

# Installation

```sh
npm i rollup-watch-next -D
```

# Usage

```js
import watch from 'rollup-watch-next'
import config from './rollup.config'
```

## Use `rollup.watch` as an Async Iterator

```js
const watcher = watch(config)

const { value } = await watcher.next('END')

console.log('Bundle complete')
```

## Emit events to `process`

```js
process.on('rollup-watch:start', id => {
  console.log('rollup.watch has started')
})
process.on('rollup-watch:close', id => {
  console.log('rollup.watch has closed')
})

const watcher = watch(config)
// 'rollup.watch has started'

console.log('watcher id', watcher.id)

watcher.close()
// 'rollup.watch has closed'
```

# API

`rollup-watch-next` simply extends Rollup's native watch export with a `next` method.

## `watcher.next([eventCode])`

Type: `string`

Use like an async iterator. Takes one of the following event codes:

```javascript
await watcher.next('START')
await watcher.next('BUNDLE_START')
await watcher.next('BUNDLE_END')
await watcher.next('END')
await watcher.next('ERROR')
await watcher.next('FATAL')
```

Returns: `Promise<{value, done}>`

Resolves with the next event value that matches `eventCode`. Rejects if `'FATAL'` occurs, unless `eventCode === 'FATAL'.` Does not reject with `'ERROR'`.
