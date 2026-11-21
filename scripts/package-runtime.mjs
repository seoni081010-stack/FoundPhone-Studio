import { execFileSync } from "node:child_process";
import { copyFile, writeFile } from "node:fs/promises";
for (const name of ["LICENSE", "THIRD_PARTY_LICENSES.txt", "BRAND_NOTICE.txt"])
  await copyFile(name, "dist/" + name);
console.log("Runtime license notices included.");

await copyFile("src/vendor/mymy/NOTICE.txt", "dist/MYMY_NOTICE.txt");

const commit = process.env.GITHUB_SHA || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
await writeFile("dist/build-info.json", JSON.stringify({ commit }) + "\n");
console.log("Runtime build commit:", commit);
