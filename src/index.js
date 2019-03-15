import { watch } from 'rollup'
import nanoid from 'nanoid'

export default function watchNext(config, cb) {
  const watcher = watch(config)
  if (cb) watcher.on('event', cb)

  const id = nanoid()
  watcher.id = id
  process.emit('rollup-watch:start', id)

  const resolves = {
    START: [],
    BUNDLE_START: [],
    BUNDLE_END: [],
    END: [],
    FATAL: [],
    ERROR: [],
  }
  const rejects = []
  let done = false

  const closeWatcher = watcher.close
  watcher.close = () => {
    if (!done) {
      process.emit('rollup-watch:close', id)
      eventHandler({ code: 'CLOSE' })
    }

    return closeWatcher()
  }

  const eventHandler = ({ code, ...value }) => {
    // do not resurrect if done
    done = done || ['FATAL', 'CLOSE'].includes(code)

    // do not include event code in value
    const tuple = { value, done }

    if (code === 'CLOSE') {
      // resolve all events with { done }
      // on watcher.close()
      Object.values(resolves)
        .flat()
        .forEach(fn => fn({ done }))
    } else {
      // if event is from watcher
      // - resolves for watcher.next('FATAL')
      resolves[code].forEach(fn => fn(tuple))
      resolves[code] = []
    }

    if (['FATAL', 'CLOSE'].includes(code)) {
      // should reject on FATAL or ERROR
      // - will not reject for watcher.next('FATAL'),
      //   since those promises have already resolved
      rejects.forEach(fn => fn(tuple))
      // make sure watcher is closed
      closeWatcher()
    }
  }

  watcher.on('event', eventHandler)

  watcher.next = nextCode => {
    if (!resolves[nextCode]) {
      // cannot register invalid event code
      throw new TypeError(
        `${nextCode} is not a valid event code`,
      )
    }

    return done
      ? // if already done, resolve immediately
        Promise.resolve({ done })
      : // if not done
        new Promise((resolve, reject) => {
          if (nextCode) {
            // if code is defined, resolve for that event
            resolves[nextCode].push(resolve)
          } else {
            // if code is undefined, resolve for any event
            Object.values(resolves).forEach(rs =>
              rs.push(resolve),
            )
          }

          // add to rejects regardless
          rejects.push(reject)
        })
  }

  return watcher
}
