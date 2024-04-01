import { resolve as _resolve } from "node:path";

let resolve: typeof _resolve;

if (process.env.NODE_ENV === "development") {
  resolve = _resolve.bind(_resolve, __dirname, "../../view");
} else {
  resolve = _resolve.bind(_resolve, __dirname, "../..");
}

export { resolve };
