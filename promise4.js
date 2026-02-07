const pro1 = function () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, 2000);
  });
};
const pro2 = function () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2);
    }, 1000);
  });
};
const pro3 = function () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(3);
    }, 2000);
  });
};

const pro = Promise.race([pro1(), pro2(), pro3()]);
// pro.then((res) => {
//   console.log("最终先完成的任务", res);
// });
setTimeout(() => {
  console.log("最终先完成的任务", pro);
}, 4000);
