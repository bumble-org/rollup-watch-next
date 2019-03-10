import { watchAsync } from '../../src/index'
import config from '../fixtures/basic/rollup.config'

describe('watchAsync', () => {
  test('does not crash', () => {
    const watcher = watchAsync(config, jest)
    const event = watcher('END')
  })
})
