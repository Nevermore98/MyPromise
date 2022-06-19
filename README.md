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

## 参考

    
- [看了就会，手写Promise原理，最通俗易懂的版本！！！](https://juejin.cn/post/6994594642280857630)
- [手把手一行一行代码教你“手写Promise“，完美通过 Promises/A+ 官方872个测试用例](https://juejin.cn/post/7043758954496655397)
- [面试官：“你能手写一个 Promise 吗”](https://juejin.cn/post/6850037281206566919)
- [手写Promise核心代码 - JavaScript前端Web工程师](https://www.bilibili.com/video/BV1RR4y1p7my/?spm_id_from=333.788&vd_source=52ead4154487921c1aa0ebd68f12bebf)
- [手写一个Promise/A+,完美通过官方872个测试用例](https://segmentfault.com/a/1190000023157856)
- [看了就会，手写 Promise 全部 API 教程，包括处于 TC39 第四阶段草案的 Promise.any()](https://juejin.cn/post/7044088065874198536)
