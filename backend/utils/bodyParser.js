// bodyParser.js

const MAX_BODY_SIZE = 1 * 1024 * 1024;

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("application/json")) return reject(new Error("Unsupported Content-Type"));

    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        req.destroy();
        return reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error("Invalid JSON")); }
    });

    req.on("error", err => reject(err));
  });
}

module.exports = readRequestBody;
