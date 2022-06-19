如有不对，恳请斧正。

## 实现 Promise

包括：

- Promise.prototype.then
- Promise.prototype.catch
- Promise.prototype.finally
- Promise.resolve
- Promise.reject
- Promise.all
- Promise.allSettled
- Promise.race
- Promise.any

## 测试

安装 Promises A+ 官方测试工具 `promises-aplus-tests`：

```bash
npm install promises-aplus-tests -D
```

在 `MyPromise.js` 下实现 `deferred` 方法，并导出

```js
MyPromise.deferred = function () {
  let result = {}
  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve
    result.reject = reject
  })
  return result
}

module.exports = MyPromise
```

在 `package.json` 文件中 `devDependencies` 下添加 `scripts` ：

```js
{
  "devDependencies": {
    "promises-aplus-tests": "^2.1.2"
  },
  "scripts": {
    "test": "promises-aplus-tests MyPromise"
  }
}
```

最后运行 `npm run test` 所有872 测试用例均通过
