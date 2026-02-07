function delay(duration) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

async function text() {
  for (let i = 1; i <= 3; i++) {
    await delay(1000);
    console.log("ok");
  }
}

text();
