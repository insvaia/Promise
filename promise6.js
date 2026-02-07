function bengTie() {
  return new Promise((resolve, reject) => {
    console.log("常刘原打开了崩铁");
    setTimeout(() => {
      if (Math.random() < 0.5) {
        resolve("常刘原崩铁没歪");
      } else {
        reject("常刘原崩铁歪了");
      }
    }, 2000);
  });
}
function yuanShen() {
  return new Promise((resolve, reject) => {
    console.log("常刘原打开了原神");
    setTimeout(() => {
      if (Math.random() < 0.5) {
        resolve("常刘原原神没歪");
      } else {
        reject("常刘原原神歪了");
      }
    }, 2500);
  });
}

function sanJiaoZhou() {
  return new Promise((resolve, reject) => {
    console.log("常刘原打开了三角洲");
    setTimeout(() => {
      if (Math.random() < 0.5) {
        resolve("常刘原被蹲撤离点了");
      } else {
        reject("常刘原成功撤离");
      }
    }, 3000);
  });
}

Promise.allSettled([bengTie(), yuanShen(), sanJiaoZhou()]).then((res) => {
  // 处理汇总结果
  // console.log(
  //   res.map((r) => (r.status === "fulfilled" ? r.value : r.reason)).join(";"),
  // );
  const report = res
    .map((r) => (r.status === "fulfilled" ? r.value : r.reason))
    .join(";");
  console.log(report);
});
