import { watch } from 'rollup'
import nanoid from 'nanoid'

import compose from './compose'

const successCodes = [
  'START',
  'BUNDLE_START',
  'BUNDLE_END',
  'END',
]
const errorCodes = ['ERROR', 'FATAL']
const doneCodes = ['FATAL', 'CLOSE']

const createIterator = compose(
  'event',
  {
    /* ----------------- selectors ---------------- */
    resolve: nextCode => ({ code, ...value }) =>
      // If nextCode is undefined and event is success
      (!nextCode && successCodes.includes(code)) ||
      // If nextCode is defined and matches event
      nextCode === code
        ? value
        : null,

    reject: nextCode => ({ code, ...value }) =>
      !errorCodes.includes(nextCode) && errorCodes.includes(code)
        ? value
        : null,

    done: () => ({ code }) => doneCodes.includes(code),

    /* --------------- setup watcher -------------- */
    setup: watcher => {
      // Create watcher id
      const id = nanoid()
      watcher.id = id

      // Emit start event on process
      process.emit('rollup-watch-next:start', id)

      // Wrap close method
      const close = watcher.close
      let closed = false

      watcher.close = (...args) => {
        if (closed) return

        // Call original close method
        close(...args)

        // Emit close event on process
        process.emit('rollup-watch-next:close', id)

        // Emit close event
        watcher.emit('event', { code: 'CLOSE', args })

        closed = true
      }

      return watcher
    },
  },
)

export default function watchNext(config, cb) {
  const watcher = watch(config)
  if (cb) watcher.on('event', cb)

  return createIterator(watcher)
}
