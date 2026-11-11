import fs from "fs";
import path from "path";

const loaderPath = path.join(
  "node_modules",
  "next",
  "dist",
  "compiled",
  "@next",
  "font",
  "dist",
  "google",
  "loader.js"
);

if (!fs.existsSync(loaderPath)) {
  console.log("[patch-next-font-loader] loader not installed, skipping");
  process.exit(0);
}

const source = fs.readFileSync(loaderPath, "utf8");
const broken =
  "/\\.(woff|woff2|eot|ttf|otf)$/.exec(googleFontFileUrl)[1]";
const fixed =
  "/\\.(woff|woff2|eot|ttf|otf)(?:$|\\?)/.exec(googleFontFileUrl)?.[1] ?? \"woff2\"";

if (source.includes(fixed)) {
  process.exit(0);
}
if (!source.includes(broken)) {
  console.error("[patch-next-font-loader] expected Next.js font loader pattern was not found");
  process.exit(1);
}

fs.writeFileSync(loaderPath, source.replace(broken, fixed));
console.log("[patch-next-font-loader] updated Google font file extension detection");
