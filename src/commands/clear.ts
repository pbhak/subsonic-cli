import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

export function clearCache() {
  const cachePath = join(import.meta.dir, "../../cache/");
  if (existsSync(cachePath)) {
    rmSync(cachePath, { recursive: true, force: true });
    return true;
  }
  return false;
}
