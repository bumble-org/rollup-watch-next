import { watch } from 'rollup'

const CODES = {
  START: 'START',
  BUNDLE_START: 'BUNDLE_START',
  BUNDLE_END: 'BUNDLE_END',
  END: 'END',
  FATAL: 'FATAL',
  ERROR: 'ERROR',
}

function watchAsync(config, jest) {
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
    resolves[event.code].forEach(fn => fn(event))
    resolves[event.code] = []

    if (event.code === CODES.FATAL) {
      rejects.forEach(fn => fn(event))
    }
  }

  if (jest) watcher.on('event', jest.fn(eventHandler))
  else watcher.on('event', eventHandler)

  return code =>
    new Promise((resolve, reject) => {
      resolves[code].push(resolve)
      rejects.push(reject)
    })
}

export { watchAsync, CODES }
