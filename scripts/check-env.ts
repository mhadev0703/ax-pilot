import { run } from "./common";
import { getEnv } from "../lib/env";

run(async () => {
  getEnv();
  console.log("Required configuration is present and valid in shape. No credentials printed. Connectivity has not been checked.");
});
