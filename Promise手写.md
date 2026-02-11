**Promise手写**

## Promise实现状态的变化

1. 根据ES6新添加的类属性，定义一个MyPromise的类

```javascript
class MyPromise{
   /**
   * 创建一个Promise
   * @param {Function} executor 任务执行器，立即执行
   */
    constructor(executor){
		executor()
	}
}
```

2. executor这个函数需要传递两个参数_resolve, _reject

```javascript
  /**
   * 标记当前任务完成
   * @param {any} data // 成功的数据
   */
  _resolve(data) {
  }

  /**
   * 标记当前任务失败
   * @param {any} reason 失败的数据
   */
  _reject(reason) {
  }
```

3. 给我们的promise设置一些属性一个是状态state，一个是数据value

```javascript
class MyPromise{
   /**
   * 创建一个Promise
   * @param {Function} executor 任务执行器，立即执行
   */
    constructor(executor){
        this._state = PENDING; // 状态
    	this._value = undefined; // 数据
		executor(this._resolve, this._reject);
	}
}
```

4. 对任务完成或失败进行处理

```javascript
  /**
   * 标记当前任务完成
   * @param {any} data // 成功的数据
   */
  _resolve(data) {
      this._state = 'fulfilled';
      this._value = data;
  }

  /**
   * 标记当前任务失败
   * @param {any} reason 失败的数据
   */
  _reject(reason) {
      this._state = 'rejected';
      this._value = reason;
  }
```

此时的整体代码如下

```javascript
class MyPromise{
    constructor(executor){
        this._state = 'pending'
        this._value = undefined
        executor(this._resolve, this._reject)
    }
    _resolve(data){
        this._state = 'fulfilled'
        this._value = data
	}
    _reject(reason){
        this._state = 'rejected'
        this._value = reason
    }
}

// 测试案例
const pro = new MyPromise((resolve, reject)=>{
    resolve(1)
})
console.log(pro)
```

这时你会发现运行不了(Cannot set property '_state' of undefined)，原因是resolve和reject中的this读取不到，为undefined。this的指向取决于如何调用它，这里是直接调用的resolve，按理说this指的是全局变量，但是因为使用的是ES6的class，导致是在严格模式下的，此时this指向的是undefined，也就造成这样的问题，但是我希望this指向的是当前创造的对象，那么我们可以对executor中进行这样的修改

```javascript
executor(this._resolve.bind(this), this._reject.bind(this))
```

此时打印出来的结果为 ： MyPromise{ _state: 'fulfilled', _value: 1}

5. 接下优化一下代码，把'pending','fulfilled','rejected'三种状态记录一下，同时提取resolve和reject中的更改任务状态

```javascript
// 记录Promise的三种状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

_changeState(newState, value) {
    if (this._state !== PENDING) {
      // 目前状态已经更改
      return;
    }
    this._state = newState;
    this._value = value;
}

_resolve(data) {
  this._changeState(FULFILLED, data);
}
/**
* 标记当前任务失败
* @param {any} reason 任务失败的相关数据
*/
 _reject(reason) {
  this._changeState(REJECTED, reason);
}
```

6. 如果在Promise执行过程中报错了，状态应该自动变为reject，我们可以直接看Promise执行过程中的函数是否出现错误，如果出现错误了，直接帮你调用reject，示例代码如下

```javascript
constructor(executor) {
    this._state = PENDING; // 状态
    this._value = undefined; // 数据
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
}
```

ok到此我们手写的Promise实现状态变化的功能也就实现了整体代码如下

```javascript
// 记录Promise的三种状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class MyPromise {
    
  constructor(executor) {
    this._state = PENDING; // 状态
    this._value = undefined; // 数据
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }
    
  /**
   * 更改任务状态
   * @param {String} newState 新状态
   * @param {any} value 相关数据
   */
  _changeState(newState, value) {
    if (this._state !== PENDING) {
      // 目前状态已经更改
      return;
    }
    this._state = newState;
    this._value = value;
  }
  /**
   * 标记当前任务成功
   * @param {any} data 任务成功的相关数据
   */
  _resolve(data) {
    this._changeState(FULFILLED, data);
  }
    
  /**
   * 标记当前任务失败
   * @param {any} reason 任务失败的相关数据
   */
  _reject(reason) {
    this._changeState(REJECTED, reason);
  }
}

```

## 创建then函数

1. 由于then函数比较复杂，先搭个架子。我们首先要思考两个东西，1.有什么参数传入 2.返回什么值

```javascript

  /**
   * promise A+规范的then
   * @param {Function} onFulfilled
   * @param {Function} onRejected
   * @returns
   */
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
    });
  }


// 参数有两个 1. data， 2. reason
// 返回值还是一个promise
const pro = new Promsie((resolve, reject)=>{
    resolve(1)
})
pro.then(
    (data) => { console.log(data) },
	(reason) => { console.log(reason) }
)
```

2. 接下来我们要想一个比较深层次的问题，这个then函数到底要做什么？

   我们再详细的描述一下then函数: 当处于成功状态时处理resolve中的事情，当失败的时候处理reject中的事情

   then函数中的回调函数不会立即执行，会把函数放到微队列当中

   如何把函数放到微队列当中呢，这是一个值得思考的问题。

   我们需要创建一个微队列，并判断当前环境是node环境还是浏览器环境还是其他环境

```javascript
/**
 * 创建一个微队列
 * @param {Function} callback
 */
function runMicroTask(callback) {
  // 判断node环境
  if (process && process.nextTick) {
    process.nextTick(callback);
  } else if (MutationObserver) {
    // 判断浏览器环境
    const p = document.createElement("p");
    const observer = new MutationObserver(callback);
    observer.observe(p, {
      childList: true,
    });
    p.innerHTML = "1";
  } else {
    setTimeout(callback, 0);
  }
}
```

测试一下

```javascript
setTimeout(() => {
  console.log(1)   
})
runMicroTask(() => {
    console.log(2)
})
console.log(3)
// 最终的打印结果应该是3 2 1
```

3. 到现在我们手写的Promise的整体代码为

```javascript
// 记录Promise的三种状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

/**
 * 创建一个微队列
 * @param {Function} callback
 */
function runMicroTask(callback) {
  // 判断node环境
  if (process && process.nextTick) {
    process.nextTick(callback);
  } else if (MutationObserver) {
    // 判断浏览器环境
    const p = document.createElement("p");
    const observer = new MutationObserver(callback);
    observer.observe(p, {
      childList: true,
    });
    p.innerHTML = "1";
  } else {
    setTimeout(callback, 0);
  }
}

class MyPromise {
    
  constructor(executor) {
    this._state = PENDING; // 状态
    this._value = undefined; // 数据
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }
    
  /**
   * 更改任务状态
   * @param {String} newState 新状态
   * @param {any} value 相关数据
   */
  _changeState(newState, value) {
    if (this._state !== PENDING) {
      // 目前状态已经更改
      return;
    }
    this._state = newState;
    this._value = value;
  }
    
  /**
   * 标记当前任务成功
   * @param {any} data 任务成功的相关数据
   */
  _resolve(data) {
    this._changeState(FULFILLED, data);
  }
    
  /**
   * 标记当前任务失败
   * @param {any} reason 任务失败的相关数据
   */
  _reject(reason) {
    this._changeState(REJECTED, reason);
  }
    
  /**
   * promise A+规范的then
   * @param {Function} onFulfilled
   * @param {Function} onRejected
   * @returns
   */
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
    });
  }
}

```

## Promise执行队列

1. 我们首先要知道then函数中的回调函数是否立即执行(不是，应该放到微队列里面执行)

   是否立即放到微队列里面(其实也不是，如果这些函数立即放到微队列里，那一定是这些函数先执行，正确的应该是先等状态确定后再放到微队列里然后依次执行这写函数)

   因此我们需要一个队列去存放这些then函数

```javascript
this._handlers = [] // 处理函数形成的队列
```

2. 接下来我们再调用then函数的时候把onfulfilled和rejected放到队列里也就是这样

```javascript
  then(onFulfilled, onRejected) {
    this._handlers.push(onFulfilled, onRejected)
    return new MyPromise((resolve, reject) => {
    });
  }
```

如果这样做的话就产生问题了，我们并不知道存放的函数的状态，因此handlers里面存的应该是一个一个的对象，我们把这件事单独抽离出来一个函数

```javascript
  /**
   * 向处理队列中添加一个函数
   * @param {Function} executor 添加的函数
   * @param {String} state 该函数什么状态下执行
   * @param {Function} resolve 让then函数返回的Promise成功
   * @param {Function} reject 让then函数返回的Promise失败
   */
  _pushHandler(executor, state, resolve, reject) {
    this._handlers.push({
      executor,
      state,
      resolve,
      reject,
    });
  }
```

此时的then函数为

```javascript
/**
 * Promise A+规范的then
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 */
then(onFulfilled, onRejected) {
  return new MyPromise((resolve, reject) => {
    this._pushHandler(onFulfilled, FULFILLED, resolve, reject);
    this._pushHandler(onRejected, REJECTED, resolve, reject);
  });
}
```

3. 整体代码为

```javascript
// 记录Promise的三种状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

/**
 * 创建一个微队列
 * @param {Function} callback
 */
function runMicroTask(callback) {
  // 判断node环境
  if (process && process.nextTick) {
    process.nextTick(callback);
  } else if (MutationObserver) {
    // 判断浏览器环境
    const p = document.createElement("p");
    const observer = new MutationObserver(callback);
    observer.observe(p, {
      childList: true,
    });
    p.innerHTML = "1";
  } else {
    setTimeout(callback, 0);
  }
}

class MyPromise {
    
  constructor(executor) {
    this._state = PENDING; // 状态
    this._value = undefined; // 数据
    this._handlers = [] // 处理函数形成的队列
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }
    
  /**
   * 更改任务状态
   * @param {String} newState 新状态
   * @param {any} value 相关数据
   */
  _changeState(newState, value) {
    if (this._state !== PENDING) {
      // 目前状态已经更改
      return;
    }
    this._state = newState;
    this._value = value;
  }
    
  /**
   * 标记当前任务成功
   * @param {any} data 任务成功的相关数据
   */
  _resolve(data) {
    this._changeState(FULFILLED, data);
  }
    
  /**
   * 标记当前任务失败
   * @param {any} reason 任务失败的相关数据
   */
  _reject(reason) {
    this._changeState(REJECTED, reason);
  }
  
   /**
   * 向处理队列中添加一个函数
   * @param {Function} executor 添加的函数
   * @param {String} state 该函数什么状态下执行
   * @param {Function} resolve 让then函数返回的Promise成功
   * @param {Function} reject 让then函数返回的Promise失败
   */
  _pushHandler(executor, state, resolve, reject) {
    this._handlers.push({
      executor,
      state,
      resolve,
      reject,
    });
  }
    
  /**
   * promise A+规范的then
   * @param {Function} onFulfilled
   * @param {Function} onRejected
   * @returns
   */
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
    	this._pushHandler(onFulfilled, FULFILLED, resolve, reject);
    	this._pushHandler(onRejected, REJECTED, resolve, reject);
    });
  }
}

```

## 遍历执行队列

1. 创建一个执行队列的函数

```javascript
/**
 * 根据实际情况，执行队列
*/
_runHandlers(){
    if(this._state === PENDING){
        // 任务正在挂起
        return 
    }
}
```

2. 状态变化执行队列

```javascript
/**
 * 更改任务状态
 * @param {String} newState 新状态
 * @param {any} value 相关数据
 */
_changeState(newState, value) {
  if (this._state !== PENDING) {
    // 目前状态已经更改
    return;
  }
  // 下面这个判断是为了处理value为Promise的情况
  if (isPromise(value)) {
    value.then(this._resolve.bind(this), this._reject.bind(this));
    return;
  }
  this._state = newState;
  this._value = value;
  this._runHandlers(); // 状态变化，执行队列
}
// 其中的isPromise函数是这样的，就是判断一个对象是否为Promise
function isPromise(obj){
    return !!(obj && typeof obj === 'object' && typeof obj.then === 'function')
}
```

3. 在then函数中执行队列

```javascript
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
    	this._pushHandler(onFulfilled, FULFILLED, resolve, reject);
    	this._pushHandler(onRejected, REJECTED, resolve, reject);
        this._runHandlers() // 执行队列
    });
  }
```

4. 如果现在的状态不是挂起，要么成功要么失败，这个时候要把队列拿出来一个一个的去看，怎么拿出来一个一个看呢？

```javascript
/**
 * 根据实际情况处理一个队列
 * @returns
 */
_runHander() {
  if (this._state === PENDING) {
    // 当前任务正在挂起
    return;
  }
  while (this._handlers[0]) {
    const hander = this._handlers[0];
    this._runOneHander(hander);
    this._handlers.shift();
  }
}
/**
 * 处理一个handler
 * @param {Object} handler
 */
_runOneHander(handler) {}
```

5. 现在的整体代码为

```javascript
// 记录Promise的三种状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

/**
 * 创建一个微队列
 * @param {Function} callback
 */
function runMicroTask(callback) {
  // 判断node环境
  if (process && process.nextTick) {
    process.nextTick(callback);
  } else if (MutationObserver) {
    // 判断浏览器环境
    const p = document.createElement("p");
    const observer = new MutationObserver(callback);
    observer.observe(p, {
      childList: true,
    });
    p.innerHTML = "1";
  } else {
    setTimeout(callback, 0);
  }
}

// 判断一个对象是否为Promise
function isPromise(obj){
    return !!(obj && typeof obj === 'object' && typeof obj.then === 'function')
}

class MyPromise {
    
  constructor(executor) {
    this._state = PENDING; // 状态
    this._value = undefined; // 数据
    this._handlers = [] // 处理函数形成的队列
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }
    
  /**
   * 更改任务状态
   * @param {String} newState 新状态
   * @param {any} value 相关数据
   */
  _changeState(newState, value) {
    if (this._state !== PENDING) {
      // 目前状态已经更改
      return;
    }
      // 下面这个判断是为了处理value为Promise的情况
    if (isPromise(value)) {
      value.then(this._resolve.bind(this), this._reject.bind(this));
      return;
    }
    this._state = newState;
    this._value = value;
    this._runHandlers(); // 状态变化，执行队列
  }
    
  /**
   * 标记当前任务成功
   * @param {any} data 任务成功的相关数据
   */
  _resolve(data) {
    this._changeState(FULFILLED, data);
  }
    
  /**
   * 标记当前任务失败
   * @param {any} reason 任务失败的相关数据
   */
  _reject(reason) {
    this._changeState(REJECTED, reason);
  }
  
   /**
   * 向处理队列中添加一个函数
   * @param {Function} executor 添加的函数
   * @param {String} state 该函数什么状态下执行
   * @param {Function} resolve 让then函数返回的Promise成功
   * @param {Function} reject 让then函数返回的Promise失败
   */
  _pushHandler(executor, state, resolve, reject) {
    this._handlers.push({
      executor,
      state,
      resolve,
      reject,
    });
  }
  
  /**
  * 根据实际情况处理一个队列
  * @returns
  */
 _runHander() {
   if (this._state === PENDING) {
     // 当前任务正在挂起
     return;
   }
   while (this._handlers[0]) {
     const hander = this._handlers[0];
     this._runOneHander(hander);
     this._handlers.shift();
   }
 }
    
   /**
   * 处理一个handler
   * @param {Object} handler
   */
  _runOneHander(handler) {}
    
  /**
   * promise A+规范的then
   * @param {Function} onFulfilled
   * @param {Function} onRejected
   * @returns
   */
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
    	this._pushHandler(onFulfilled, FULFILLED, resolve, reject);
    	this._pushHandler(onRejected, REJECTED, resolve, reject);
        this._runHandlers() // 执行队列
    });
  }
}

```

## 完成核心代码

实现上面的_runHandler方法

```javascript
/**
 * 处理一个handler
 * @param {Object} handler
 */
_runOneHandler({ executor, state, resolve, reject }) {
  runMicroTask(() => {
    if (this._state !== state) {
      // 状态不一致，不处理
      return;
    }
    if (typeof executor !== 'function') {
      // 传递后续处理并非一个函数
      this._state === FULFILLED ? resolve(this._value) : reject(this._value);
      return;
    }
    try {
      const result = executor(this._value);
      if (isPromise(result)) {
        result.then(resolve, reject);
      } else {
        resolve(result);
      }
    } catch (error) {
      reject(error);
      console.error(error);
    }
  });
}
```

## 完整的代码

到此，我们手写的Promise A+规范就结束了

```javascript
// 记录Promise的三种状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

/**
 * 创建一个微队列
 * @param {Function} callback
 */
function runMicroTask(callback) {
  // 判断node环境
  if (process && process.nextTick) {
    process.nextTick(callback);
  } else if (MutationObserver) {
    // 判断浏览器环境
    const p = document.createElement("p");
    const observer = new MutationObserver(callback);
    observer.observe(p, {
      childList: true,
    });
    p.innerHTML = "1";
  } else {
    setTimeout(callback, 0);
  }
}

// 判断一个对象是否为Promise
function isPromise(obj) {
  return !!(obj && typeof obj === "object" && typeof obj.then === "function");
}

class MyPromise {
    
  constructor(executor) {
    this._state = PENDING; // 状态
    this._value = undefined; // 数据
    this._handlers = []; // 处理函数形成的队列
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
      console.error(error);
    }
  }

  /**
   * 更改任务状态
   * @param {String} newState 新状态
   * @param {any} value 相关数据
   */
  _changeState(newState, value) {
    if (this._state !== PENDING) {
      // 目前状态已经更改
      return;
    }
    // 下面这个判断是为了处理value为Promise的情况
    if (isPromise(value)) {
      value.then(this._resolve.bind(this), this._reject.bind(this));
      return;
    }
    this._state = newState;
    this._value = value;
    this._runHandlers(); // 状态变化，执行队列
  }

  /**
   * 标记当前任务成功
   * @param {any} data 任务成功的相关数据
   */
  _resolve(data) {
    this._changeState(FULFILLED, data);
  }

  /**
   * 标记当前任务失败
   * @param {any} reason 任务失败的相关数据
   */
  _reject(reason) {
    this._changeState(REJECTED, reason);
  }

  /**
   * 向处理队列中添加一个函数
   * @param {Function} executor 添加的函数
   * @param {String} state 该函数什么状态下执行
   * @param {Function} resolve 让then函数返回的Promise成功
   * @param {Function} reject 让then函数返回的Promise失败
   */
  _pushHandler(executor, state, resolve, reject) {
    this._handlers.push({
      executor,
      state,
      resolve,
      reject,
    });
  }

  /**
   * 根据实际情况处理一个队列
   * @returns
   */
  _runHandlers() {
    if (this._state === PENDING) {
      // 当前任务正在挂起
      return;
    }
    while (this._handlers[0]) {
      const handler = this._handlers[0];
      this._runOneHandler(handler);
      this._handlers.shift();
    }
  }

  /**
   * 处理一个handler
   * @param {Object} handler
   */
  _runOneHandler({ executor, state, resolve, reject }) {
    runMicroTask(() => {
      if (this._state !== state) {
        // 状态不一致，不处理
        return;
      }
      if (typeof executor !== "function") {
        // 传递后续处理并非一个函数
        this._state === FULFILLED ? resolve(this._value) : reject(this._value);
        return;
      }
      try {
        const result = executor(this._value);
        if (isPromise(result)) {
          result.then(resolve, reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
        console.error(error);
      }
    });
  }

  /**
   * promise A+规范的then
   * @param {Function} onFulfilled
   * @param {Function} onRejected
   * @returns
   */
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this._pushHandler(onFulfilled, FULFILLED, resolve, reject);
      this._pushHandler(onRejected, REJECTED, resolve, reject);
      this._runHandlers(); // 执行队列
    });
  }
}

```

## 手写catch和finally

当我们手写完Promise A+规范后发现手写catch和finally很简单了

```javascript
/**
 * 仅处理失败时候的场景
 * @param {Function} onRejected
 */
catch(onRejected) {
  return this.then(null, onRejected);
}
/**
 * 无论是成功还是失败时都会回调
 * @param {Function} onSettled
 * @returns
 */
finally(onSettled) {
  return this.then(
    (data) => {
      onSettled();
      return data;
    },
    (reason) => {
      onSettled();
      throw reason;
    },
  );
}
```

面试的时候如果直接叫手写catch和finally方法，可以直接使用ES6给我们提供的Promise

```javascript
Promise.prototype.catch = function(onReject){
    return this.then(null, onReject)
}

Promise.protopyte.finally = function(onSettled){
    return this.then(
        (data) => { onSettled(), return data },
        (reason) => { onSettled(), throw reason }
    )
}
```

## 手写resolve和reject

如果你已经手写了自己的Promise，那么在你的类中添加两个静态方法

```javascript
static resolve(data) {
  if (data instanceof MyPromise) {
    return data;
  }
  return new MyPromise((resolve, reject) => {
    if (isPromise(data)) {
      data.then(resolve, reject);
    } else {
      resolve(data);
    }
  });
}
static reject(reason) {
  return new MyPromise((resolve, reject) => {
    reject(reason);
  });
}
```

如果面试直接让你实现resolve和reject可以直接用ES6提供的Promise

```javascript
// 判断一个对象是否为Promise
function isPromise(obj) {
  return !!(obj && typeof obj === "object" && typeof obj.then === "function");
}

Promise.resolve = function(data){
  if (data instanceof Promise) {
    return data;
  }
  return new Promise((resolve, reject) => {
    if (isPromise(data)) {
      data.then(resolve, reject);
    } else {
      resolve(data);
    }
  });    
}

Promise.reject = function(reason){
  return new MyPromise((resolve, reject) => {
    reject(reason);
  });    
}
```

## 手写Promise.all方法

注意，Promise.all()，里面的参数是可以传递迭代器(iterator)的，但是不是所有的迭代器都支持for循环，所以推荐使用forof循环

```javascript
/**
   * 得到一个新的Promise
   * 该Promise的状态取决于proms的执行
   * proms是一个迭代器，包含多个Promise
   * 全部Promise成功，则返回的Promise成功，数据为所有Promise成功的数据，并且顺序是按照传入的顺序排列
   * 只要有一个Promise失败，则返回的Promise失败，原因是第一个失败的Promise的原因
   * @param {iterator} proms
   */
  static all(proms) {
    return new MyPromise((resolve, reject) => {
      try {
        const result = [];
        let count = 0; // Promise的总数
        let fulfilledCount = 0; // 完成的数量
        for (const p of proms) {
          let i = count;
          count++;
          MyPromise.resolve(p).then((data) => {
            fulfilledCount++;
            result[i] = data;
            if (fulfilledCount === count) {
              // 当前是最后一个Promise完成了
              resolve(result);
            }
          }, reject);
        }
        if (count === 0) {
          resolve(result);
        }
      } catch (error) {
        reject(error);
        console.error(error);
      }
    });
  }
```

## 手写Promise.allSettled方法

注意，Promise.allSettled方法实现的Promise一定是成功的

```javascript
/**
 * 等待所有的Promise有结果之后
 * 该方法返回的Promise完成
 * 并且按照顺序将所有结果汇总
 * @param {iterator} proms
 */
static allSettled(proms) {
  const ps = [];
  for (const p of proms) {
    ps.push(
      MyPromise.resolve(p).the
        (value) => ({
          status: FULFILLED,
          value,
        }),
        (reason) => ({
          status: REJECTED,
          reason,
        })
      )
    );
  }
  return MyPromise.all(ps);
}
```

## 手写Promise.race方法

```javascript
/**
 * 返回的Promise与第一个有结果的一致
 * @param {iterator} proms
 */
static race(proms) {
  return new MyPromise((resolve, reject) => {
    for (const p of proms) {
      MyPromise.resolve(p).then(resolve, reject);
    }
  });
}
```

## TOTAL

```javascript
// 记录Promise的三种状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

/**
 * 运行一个微队列任务
 * 把传递的函数放到微队列中
 * @param {Function} callback
 */
function runMicroTask(callback) {
  // 判断node环境
  // 为了避免「变量未定义」的错误，这里最好加上前缀globalThis
  // globalThis是一个关键字，指代全局对象，浏览器环境为window，node环境为global
  if (globalThis.process && globalThis.process.nextTick) {
    process.nextTick(callback);
  } else if (globalThis.MutationObserver) {
    const p = document.createElement("p");
    const observer = new MutationObserver(callback);
    observer.observe(p, {
      childList: true, // 观察该元素内部的变化
    });
    p.innerHTML = "1";
  } else {
    setTimeout(callback, 0);
  }
}

/**
 * 判断一个数据是否是Promise对象
 * @param {any} obj
 * @returns
 */
function isPromise(obj) {
  return !!(obj && typeof obj === "object" && typeof obj.then === "function");
}

class MyPromise {
  /**
   * 创建一个Promise
   * @param {Function} executor 任务执行器，立即执行
   */
  constructor(executor) {
    this._state = PENDING; // 状态
    this._value = undefined; // 数据
    this._handlers = []; // 处理函数形成的队列
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
      console.error(error);
    }
  }

  /**
   * 向处理队列中添加一个函数
   * @param {Function} executor 添加的函数
   * @param {String} state 该函数什么状态下执行
   * @param {Function} resolve 让then函数返回的Promise成功
   * @param {Function} reject 让then函数返回的Promise失败
   */
  _pushHandler(executor, state, resolve, reject) {
    this._handlers.push({
      executor,
      state,
      resolve,
      reject,
    });
  }

  /**
   * 根据实际情况，执行队列
   */
  _runHandlers() {
    if (this._state === PENDING) {
      // 目前任务仍在挂起
      return;
    }
    while (this._handlers[0]) {
      const handler = this._handlers[0];
      this._runOneHandler(handler);
      this._handlers.shift();
    }
  }

  /**
   * 处理一个handler
   * @param {Object} handler
   */
  _runOneHandler({ executor, state, resolve, reject }) {
    runMicroTask(() => {
      if (this._state !== state) {
        // 状态不一致，不处理
        return;
      }

      if (typeof executor !== "function") {
        // 传递后续处理并非一个函数
        this._state === FULFILLED ? resolve(this._value) : reject(this._value);
        return;
      }
      try {
        const result = executor(this._value);
        if (isPromise(result)) {
          result.then(resolve, reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
        console.error(error);
      }
    });
  }

  /**
   * Promise A+规范的then
   * @param {Function} onFulfilled
   * @param {Function} onRejected
   */
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      this._pushHandler(onFulfilled, FULFILLED, resolve, reject);
      this._pushHandler(onRejected, REJECTED, resolve, reject);
      this._runHandlers(); // 执行队列
    });
  }

  /**
   * 仅处理失败的场景
   * @param {Function} onRejected
   */
  catch(onRejected) {
    return this.then(null, onRejected);
  }

  /**
   * 无论成功还是失败都会执行回调
   * @param {Function} onSettled
   */
  finally(onSettled) {
    return this.then(
      (data) => {
        onSettled();
        return data;
      },
      (reason) => {
        onSettled();
        throw reason;
      },
    );
  }

  /**
   * 更改任务状态
   * @param {String} newState 新状态
   * @param {any} value 相关数据
   */
  _changeState(newState, value) {
    if (this._state !== PENDING) {
      // 目前状态已经更改
      return;
    }
    // 下面这个判断是为了处理value为Promise的情况
    // 这一段代码课程中没有涉及，特此注释说明
    if (isPromise(value)) {
      value.then(this._resolve.bind(this), this._reject.bind(this));
      return;
    }
    this._state = newState;
    this._value = value;
    this._runHandlers(); // 状态变化，执行队列
  }

  /**
   * 标记当前任务完成
   * @param {any} data 任务完成的相关数据
   */
  _resolve(data) {
    this._changeState(FULFILLED, data);
  }

  /**
   * 标记当前任务失败
   * @param {any} reason 任务失败的相关数据
   */
  _reject(reason) {
    this._changeState(REJECTED, reason);
  }

  /**
   * 返回一个已完成的Promise
   * 特殊情况：
   * 1. 传递的data本身就是ES6的Promise对象
   * 2. 传递的data是PromiseLike（Promise A+），返回新的Promise，状态和其保持一致即可
   * @param {any} data
   */
  static resolve(data) {
    if (data instanceof MyPromise) {
      return data;
    }
    return new MyPromise((resolve, reject) => {
      if (isPromise(data)) {
        data.then(resolve, reject);
      } else {
        resolve(data);
      }
    });
  }

  /**
   * 得到一个被拒绝的Promise
   * @param {any}} reason
   */
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  /**
   * 得到一个新的Promise
   * 该Promise的状态取决于proms的执行
   * proms是一个迭代器，包含多个Promise
   * 全部Promise成功，则返回的Promise成功，数据为所有Promise成功的数据，并且顺序是按照传入的顺序排列
   * 只要有一个Promise失败，则返回的Promise失败，原因是第一个失败的Promise的原因
   * @param {iterator} proms
   */
  static all(proms) {
    return new MyPromise((resolve, reject) => {
      try {
        const results = [];
        let count = 0; // Promise的总数
        let fulfilledCount = 0; // 已完成的数量
        for (const p of proms) {
          let i = count;
          count++;
          MyPromise.resolve(p).then((data) => {
            fulfilledCount++;
            results[i] = data;
            if (fulfilledCount === count) {
              // 当前是最后一个Promise完成了
              resolve(results);
            }
          }, reject);
        }
        if (count === 0) {
          resolve(results);
        }
      } catch (error) {
        reject(error);
        console.error(error);
      }
    });
  }

  /**
   * 等待所有的Promise有结果之后
   * 该方法返回的Promise完成
   * 并且按照顺序将所有结果汇总
   * @param {iterator} proms
   */
  static allSettled(proms) {
    const ps = [];
    for (const p of proms) {
      ps.push(
        MyPromise.resolve(p).then(
          (value) => ({
            status: FULFILLED,
            value,
          }),
          (reason) => ({
            status: REJECTED,
            reason,
          }),
        ),
      );
    }
    return MyPromise.all(ps);
  }

  /**
   * 返回的Promise与第一个有结果的一致
   * @param {iterator} proms
   */
  static race(proms) {
    return new MyPromise((resolve, reject) => {
      for (const p of proms) {
        MyPromise.resolve(p).then(resolve, reject);
      }
    });
  }
}

```



------

至此Promise的手写结束











