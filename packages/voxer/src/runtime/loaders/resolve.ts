import { resolve as res } from "path";

let resolve;

if (process.env.NODE_ENV === "development") {
  resolve = res.bind(res, __dirname, "../view");
} else {
  resolve = res.bind(res, __dirname, "../..");
}

export { resolve };
