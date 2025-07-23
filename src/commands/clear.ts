import { existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export function clearCache() {
  const cachePath = join(homedir(), ".scli-cache/");
  if (existsSync(cachePath)) {
    rmSync(cachePath, { recursive: true, force: true });
    return;
  }
}
