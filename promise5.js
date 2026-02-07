function fetchStudents(page) {
  return new Promise((resolve, reject) => {
    setTimeout(
      () => {
        if (Math.random() < 0.3) {
          reject(new Error(`网络错误，获取第${page}页失败`));
          return;
        }
        const stu = new Array(10).fill(null).map((_, i) => ({
          id: `NO.${(page - 1) * 10 + i + 1}`,
          name: `姓名${(page - 1) * 10 + i + 1}`,
        }));
        resolve(stu);
      },
      Math.floor(Math.random() * 5000),
    );
  });
}
// const proms = [];
// for (let i = 1; i <= 10; i++) {
//   proms.push(fetchStudents(i));
// }
const proms = new Array(10).fill(1).map((_, i) => fetchStudents(i + 1));

// Promise.all(proms)
//   .then((res) => {
//     console.log(res.flat());
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// Promise.allSettled(proms).then((res) => {
//   res = res
//     .filter((it) => it.status === "fulfilled")
//     .map((it) => it.value)
//     .flat();
//   console.log(res);
// });

// Promise.any(proms)
//   .then((res) => {
//     console.log(res);
//   })
//   .catch((err) => {
//     console.log(err.errors);
//   });

Promise.race(proms)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
