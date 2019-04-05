const useDone = () => {
  let done = false

  return [
    () => done,
    () => {
      done = true
      return done
    },
  ]
}

/**
 * @function composeIteratorFactory
 * eventName : <string>
 *
 * selectors : <Object{ resolve, reject, done, setup }>
 *
 * selectors.(resolve|reject|done) :: nextArg -> (...eventArgs) -> null|value
 *
 *   selectors.resolve should return null if the object is not to be resolved
 *     else the promise will resolve with that value
 *
 *   selectors.reject should return null if the object is not to be rejected
 *     else the promise will reject with the returned value if it did not resolve
 *
 *   selectors.done should return true if the iterator is done
 *
 *   selectors.setup should setup events that will end the iterator
 *
 * eventEmitter : <EventEmitter> Instance of node event emitter
 *
 * nextArg : <anything> Whatever preds.resolve takes as first arg
 */
export default (
  eventName,
  { setup, ...selectors },
) => eventEmitter => {
  const [isDone, setDone] = useDone()

  eventEmitter.next = nextArg =>
    new Promise((resolve, reject) => {
      // just resolve if done
      if (isDone()) return resolve({ done: true })

      // setup selectors
      const shouldResolve = selectors.resolve(nextArg)
      const shouldReject = selectors.reject(nextArg)
      const shouldBeDone = selectors.done(nextArg)

      // define event callback
      const callback = (...args) => {
        const resolveValue = shouldResolve(...args)
        const rejectValue = shouldReject(...args)
        const done = shouldBeDone(...args)

        if (done) {
          setDone()
        }

        if (resolveValue !== null) {
          // cleanup
          eventEmitter.off(eventName, callback)
          // resolve promise
          resolve({ value: resolveValue, done })
        } else if (rejectValue !== null) {
          // cleanup
          eventEmitter.off(eventName, callback)
          // resolve promise
          reject(rejectValue)
        } else if (isDone()) {
          // cleanup
          eventEmitter.off(eventName, callback)
          // resolve promise
          resolve({ done: true })
        }
      }

      // register callback for event
      eventEmitter.on(eventName, callback)
    })

  return setup(eventEmitter)
}
