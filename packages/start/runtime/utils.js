export async function getBody(req) {
  return new Promise(resolve => {
    let data = [];
    req.on("data", chunk => {
      data.push(chunk);
    });
    req.on("end", () => {
      resolve(JSON.parse(data));
    });
  });
}
