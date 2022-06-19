class MyPromise {
  static PENDING = 'pending'
  static FULFILLED = 'fulfilled'
  static REJECTED = 'rejected'

  constructor(executor) {
    this.PromiseState = MyPromise.PENDING
    this.PromiseResult = undefined
    // 等待状态时保存成功回调和失败回调数组
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []
    // 在 constructor 中使用箭头函数，不会出现 this 指向错误问题
    const resolve = (result) => {
      // 判断是否处于等待状态，是则改变状态（注意 queueMicrotask 包裹 if，否则状态不能锁定）
      queueMicrotask(() => {
        if (this.PromiseState === MyPromise.PENDING) {
          this.PromiseState = MyPromise.FULFILLED
          this.PromiseResult = result
          // 遍历成功回调数组，执行回调
          this.onFulfilledCallbacks.forEach((callback) => {
            callback(result)
          })
        }
      })
    }
    const reject = (reason) => {
      // 判断是否处于等待状态，是则改变状态（注意 queueMicrotask 包裹 if，否则状态不能锁定）
      queueMicrotask(() => {
        if (this.PromiseState === MyPromise.PENDING) {
          this.PromiseState = MyPromise.REJECTED
          this.PromiseResult = reason
          // 遍历失败回调数组，执行回调
          this.onRejectedCallbacks.forEach((callback) => {
            callback(reason)
          })
        }
      })
    }
    // 抛出异常相当于执行 reject
    try {
      // 传入 executor 函数后立即执行（注意这里不用加 this.）
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }
  // 实现 then 方法
  then(onFulfilled, onRejected) {
    // 参数校验：对于成功回调是函数则执行，不是则接收传入值作为输出值，对于失败回调是函数则执行，不是则抛出传入值作为错误
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (val) => val
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (reason) => {
            throw reason
          }
    // 创建一个新的 Promise 对象，最后返回
    let promise2 = new MyPromise((resolve, reject) => {
      // 成功状态、失败状态分别执行 then 的第一个、第二个回调
      if (this.PromiseState === MyPromise.FULFILLED) {
        queueMicrotask(() => {
          try {
            let x = onFulfilled(this.PromiseResult)
            resolvePromise(promise2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      }
      if (this.PromiseState === MyPromise.REJECTED) {
        queueMicrotask(() => {
          try {
            let x = onRejected(this.PromiseResult)
            resolvePromise(promise2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      }
      if (this.PromiseState === MyPromise.PENDING) {
        this.onFulfilledCallbacks.push(() => {
          try {
            let x = onFulfilled(this.PromiseResult)
            resolvePromise(promise2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
        this.onRejectedCallbacks.push(() => {
          try {
            let x = onRejected(this.PromiseResult)
            resolvePromise(promise2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      }
    })
    return promise2
  }
  // 实现 catch 方法
  catch(onRejected) {
    return this.then(undefined, onRejected)
  }
  // 实现 finally 方法
  finally(callback) {
    return this.then(
      (value) => {
        return Promise.resolve(callback()).then(() => value)
      },
      (reason) => {
        return Promise.resolve(callback()).then(() => {
          throw reason
        })
      }
    )
  }
  // 实现 resolve 类方法
  static resolve(value) {
    // MyPromise 对象
    if (value instanceof MyPromise) {
      return value
    }
    // thenable 对象
    if (value instanceof Object && 'then' in value) {
      return new MyPromise((resolve, reject) => {
        value.then(resolve, reject)
      })
    }
    // 普通值或普通对象
    return new MyPromise((resolve) => {
      resolve(value)
    })
  }
  // 实现 reject 类方法
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason)
    })
  }
  // 实现 all 类方法
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      if (Array.isArray(promises)) {
        let results = []
        let count = 0
        // 如果传入的是空的可迭代对象，则返回成功状态的 Promise
        if (promises.length === 0) {
          return resolve(promises)
        }
        promises.forEach((item, index) => {
          MyPromise.resolve(item).then((res) => {
            // 如果不使用 count，会出现数组提前输出，异步元素为空白的情况
            count++
            results[index] = res
            if (count === promises.length) {
              resolve(results)
            }
          }, reject)
        })
      } else {
        return reject('argument is not iterable')
      }
    })
  }
  // 实现 allSettled 类方法
  static allSettled(promises) {
    return new MyPromise((resolve, reject) => {
      // 参数校验
      if (Array.isArray(promises)) {
        let results = [] // 存储结果
        let count = 0 // 计数器

        // 如果传入的是空数组，则返回成功状态的 Promise
        if (promises.length === 0) return resolve(promises)

        promises.forEach((item, index) => {
          MyPromise.resolve(item).then(
            (value) => {
              count++
              results[index] = {
                status: 'fulfilled',
                value,
              }
              count === promises.length && resolve(results)
            },
            (reason) => {
              count++
              results[index] = {
                status: 'rejected',
                reason,
              }
              count === promises.length && resolve(results)
            }
          )
        })
      } else {
        return reject(new TypeError('Argument is not iterable'))
      }
    })
  }
  // 实现 race 类方法
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      // 参数校验
      if (Array.isArray(promises)) {
        // 如果传入的是空数组，则返回的 Promise 将永远处于等待状态
        // 如果传入的不为空数组，则返回首先有结果的 Promise
        if (promises.length > 0) {
          promises.forEach((item) => {
            MyPromise.resolve(item).then(resolve, reject)
          })
        }
      } else {
        return reject(new TypeError('Argument is not iterable'))
      }
    })
  }
  // 实现 any 类方法
  static any(promises) {
    return new MyPromise((resolve, reject) => {
      // 参数校验
      if (Array.isArray(promises)) {
        let errors = []
        let count = 0

        // 如果传入的是空数组，则返回一个失败状态的 Promise
        if (promises.length === 0)
          return reject(new AggregateError([], 'All promises were rejected'))

        promises.forEach((item) => {
          MyPromise.resolve(item).then(
            (value) => {
              // 只要任意一个 Promise 成功，就返回
              resolve(value)
            },
            (reason) => {
              count++
              errors.push(reason)
              count === promises.length &&
                reject(new AggregateError(errors, 'All promises were rejected'))
            }
          )
        })
      } else {
        return reject(new TypeError('Argument is not iterable'))
      }
    })
  }
}

/**
 * 对resolve()、reject() 进行增强
 * @param  {promise} promise2 promise1.then 方法返回的新的 Promise 对象
 * @param  {[type]} x         promise1 的结果值
 * @param  {[type]} resolve   promise2 的 resolve 方法
 * @param  {[type]} reject    promise2 的 reject 方法
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 情况1：自身引用
  if (x === promise2) {
    reject(new TypeError('循环引用'))
  }
  // 情况2：MyPromise 对象
  if (x instanceof MyPromise) {
    x.then(
      (y) => {
        resolvePromise(promise2, y, resolve, reject)
      },
      (r) => reject(r)
    )
  }
  // 情况3：对象或函数（需排除 typeof null === 'object' 干扰）
  else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let called = false
    try {
      // 如果 then 是函数，则 x 是 thenable 对象
      // 如果 then 不是函数，则 x 是非 thenable 对象 或 函数
      let then = x.then
      if (typeof then === 'function') {
        then.call(
          x,
          (y) => {
            // 方法不能重复调用
            if (called) return
            called = true
            resolvePromise(promise2, y, resolve, reject)
          },
          (r) => {
            if (called) return
            called = true
            reject(r)
          }
        )
      } else {
        resolve(x) // 非 thenable 对象 或 函数，则直接 resolve
      }
    } catch (e) {
      if (called) return
      called = true
      reject(e)
    }
  } else {
    resolve(x) // 不是对象或函数，即值类型，则直接 resolve
  }
}

MyPromise.deferred = function () {
  let result = {}
  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve
    result.reject = reject
  })
  return result
}

module.exports = MyPromise
