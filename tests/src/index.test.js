import watch from '../../src/index'
import config from '../fixtures/basic/rollup.config'
import replace from 'replace-in-file'
import git from 'simple-git/promise'

describe('watchAsync', () => {
  let watcher

  afterEach(async () => {
    watcher.close()
    jest.clearAllMocks()

    return git().checkout(['HEAD', 'tests/fixtures/basic'])
  })

  test('does not crash', async () => {
    const spy = jest.fn()

    watcher = watch(config, spy)

    await watcher.next('END')

    expect(spy).toBeCalledTimes(4)
  })

  test('updates on file change', async () => {
    const spy = jest.fn()

    watcher = watch(config, spy)

    await watcher.next('END')

    expect(spy).toBeCalledTimes(4)

    replace({
      files: 'tests/fixtures/basic/entry.js',
      from: 'add',
      to: 'subtract',
    })

    await watcher.next('END')

    expect(spy).toBeCalledTimes(8)
  })

  test('emits start event', async () => {
    const spy = jest.fn()

    process.on('rollup-watch-next:start', spy)

    watcher = watch(config)

    watcher.close()
    await watcher.next('END')

    expect(spy).toBeCalledWith(watcher.id)
  })

  test('emits close event', async () => {
    const spy = jest.fn()

    process.on('rollup-watch-next:close', spy)

    watcher = watch(config)

    await watcher.next('END')

    watcher.close()

    expect(spy).toBeCalledWith(watcher.id)
  })

  test('emits close event once', async () => {
    const spy = jest.fn()

    watcher = watch(config)

    process.on('rollup-watch-next:close', id => {
      if (id === watcher.id) {
        spy(id)
      }
    })

    await watcher.next('END')

    watcher.close()
    watcher.close()

    expect(spy).toBeCalledTimes(1)
  })
})
