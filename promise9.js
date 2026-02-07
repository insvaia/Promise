// const pro = new Promise((resolve, reject) => {
//   console.log(1);
//   resolve();
//   console.log(2);
// });

// pro.then(() => {
//   console.log(3);
// });

// console.log(4);
// 最终答案: 1 2 4 3

// const pro = new Promise((resolve, reject) => {
//   console.log(1);
//   setTimeout(() => {
//     console.log(2);
//     resolve();
//     console.log(3);
//   });
// });

// pro.then(() => {
//   console.log(4);
// });

// console.log(5);
// 最终答案: 1 5 2 3 4

// const pro1 = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve();
//   }, 1000);
// });

// const pro2 = pro1.catch(() => {
//   return 2;
// });

// console.log("promise1", pro1);
// console.log("promise2", pro2);

// setTimeout(() => {
//   console.log("promise1", pro1);
//   console.log("promise2", pro2);
// }, 2000);
// 最终答案:
// promise1 Promise { <pending> }
// promise2 Promise { <pending> }
// promise1 Promise { undefined }
// promise2 Promise { undefined }

// async function test() {
//   const n = await 1;
//   console.log(n);
// }

// test();
// console.log(2);
// 最终答案: 2 1

// async function test() {
//   console.log(0);
//   const n = await 1;
//   console.log(n);
// }

// (async () => {
//   await test();
//   console.log(2);
// })();

// console.log(3);
// 最终答案: 0 3 2 1

// async function m1() {
//   return 1;
// }

// async function m2() {
//   const n = await m1();
//   console.log(n);
//   return 2;
// }

// async function m3() {
//   const n = m2();
//   console.log(n);
//   return 3;
// }

// m3().then((n) => {
//   console.log(n);
// });

// m3();

// console.log(4);
// 最终答案:
// Promise { <pending> }
// Promise { <pending> }
// 4
// 1
// 3
// 1

// Promise.resolve(1).then(2).then(Promise.resolve(3)).then(console.log);
// 最终答案: 1 then函数传递的参数只能是函数，要是传递其他的比如说是数字，字符串等等相当于then(null)可以直接忽略

// let a;
// let b = new Promise((resolve, reject) => {
//   console.log("promise1");
//   setTimeout(() => {
//     resolve();
//   }, 1000);
// })
//   .then(() => {
//     console.log("promise2");
//   })
//   .then(() => {
//     console.log("promise3");
//   })
//   .then(() => {
//     console.log("promise4");
//   });

// a = new Promise(async (resolve, reject) => {
//   console.log(a);
//   await b;

//   console.log(a);
//   console.log("after1");
//   await a;
//   resolve(true);
//   console.log("after2");
// });

// console.log("end");
// 最终答案:
// promise1
// undefined
// end
// promise2
// promise3
// promise4
// Promise { <pending> }
// after1

// async function async1() {
//   console.log("async start");
//   await async2();
//   console.log("async end");
// }

// async function async2() {
//   console.log("async2");
// }

// console.log("script start");

// setTimeout(() => {
//   console.log("setTimeout");
// }, 0);

// async1();

// new Promise(function (resolve) {
//   console.log("promise1");
//   resolve();
// }).then(function () {
//   console.log("promise2");
// });
// console.log("script end");
// 最终答案:
// script start
// async start
// async2
// promise1
// script end
// async end
// promise2
// setTimeout
