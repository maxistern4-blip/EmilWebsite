import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const pkg = dirname(require.resolve("stockfish/package.json"));
const target = join(process.cwd(), "public", "engine");
await mkdir(target, { recursive: true });
for (const ext of ["js", "wasm"]) await copyFile(join(pkg, "bin", `stockfish-19-lite-single.${ext}`), join(target, `stockfish-19-lite-single.${ext}`));
await copyFile(join(pkg, "Copying.txt"), join(target, "Copying.txt"));
