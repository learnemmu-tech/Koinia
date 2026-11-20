import { register } from "node:module";

register("./donation-test-hooks.mjs", {
  parentURL: import.meta.url,
});
