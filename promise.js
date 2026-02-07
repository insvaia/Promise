function delay(duration) {
  return new Promise((resolve) => {
    console.log("pending中");
    setTimeout(() => {
      if (Math.random() <= 0.5) {
        resolve(duration / 1000);
      }
    }, duration);
  });
}

delay(1000).then((data) => {
  console.log("持续了", data, "秒");
});
