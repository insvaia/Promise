function findGrilFriend(name) {
  return new Promise((resolve, reject) => {
    console.log(
      `常刘原 -> ${name}: 最近有谣言说我喜欢你，我来澄清一下，这不是谣言`,
    );
    console.log(`等待女神${name}的回复....`);
    setTimeout(() => {
      if (Math.random() <= 0.4) {
        resolve(`${name} -> 常刘原: 我是九你是三, 除了你还是你`);
      } else {
        reject(`${name} -> 常刘原: 你是个好人`);
      }
    }, 1000);
  });
}

findGrilFriend("知更鸟")
  .catch((res) => {
    console.log(res);
    return findGrilFriend("三月七");
  })
  .catch((res) => {
    console.log(res);
    return findGrilFriend("景元");
  })
  .catch((res) => {
    console.log(res);
    return findGrilFriend("星期日");
  })
  .then(
    (data) => {
      console.log(data);
      console.log("常刘原终于找到自己的伴侣");
    },
    (reason) => {
      console.log(reason);
      console.log("常刘原这辈子只能打光棍了");
    },
  );
