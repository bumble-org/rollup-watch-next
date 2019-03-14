import { watch } from 'rollup'
import nanoid from 'nanoid'

export default function watchNext(config, cb) {
  const watcher = watch(config)

  const resolves = {
    START: [],
    BUNDLE_START: [],
    BUNDLE_END: [],
    END: [],
    FATAL: [],
    ERROR: [],
  }
  const rejects = []

  const eventHandler = event => {
    const tuple = { value: event, done: event.code === 'FATAL' }

    resolves[event.code].forEach(fn => fn(tuple))
    resolves[event.code] = []

    if (tuple.done) {
      rejects.forEach(fn => fn(tuple))
      watcher.close()
    }
  }

  if (cb) watcher.on('event', cb)
  watcher.on('event', eventHandler)

  watcher.next = code =>
    new Promise((resolve, reject) => {
      resolves[code].push(resolve)
      rejects.push(reject)
    })

  const id = nanoid()
  watcher.id = id

  const closeWatcher = watcher.close
  let closed = false
  watcher.close = () => {
    if (!closed) {
      process.emit('rollup-watch:close', id)
      closed = true
    }

    return closeWatcher()
  }

  process.emit('rollup-watch:start', id)

  return watcher
}
