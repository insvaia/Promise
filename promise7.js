function findGrilFriend(name) {
  return new Promise((resolve, reject) => {
    console.log(
      `常刘原 -> ${name}: 最近有谣言说我喜欢你，我来澄清一下，这不是谣言`,
    );
    console.log(`等待女神${name}的回复....`);
    setTimeout(() => {
      if (Math.random() <= 0.1) {
        resolve(`${name} -> 常刘原: 我是九你是三, 除了你还是你`);
      } else {
        reject(`${name} -> 常刘原: 你是个好人`);
      }
    }, 1000);
  });
}

const arr = new Array(2).fill("").map((_, index) => `女神${index + 1}`);

async function text() {
  let isSucceed = false;
  for (const name of arr) {
    try {
      const data = await findGrilFriend(name);
      isSucceed = true;
      console.log(data);
      console.log("表白成功");
      break;
    } catch (err) {
      console.log(err);
      console.log("表白失败");
    }
  }
  if (!isSucceed) {
    console.log("常刘原这辈子孤独终老");
  }
}

text();
