import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { load as loadYAML, dump as dumpYAML } from "js-yaml";
import type { Config } from "../api/types";
import { homedir } from "os";

const configPath = join(homedir(), ".scli-config.yml");

function isValidURL(url: string): boolean {
  // the URL class constructor errors if the passed in string is not a valid URL
  try {
    const parsedURL = new URL(url);
    return ["http:", "https:"].includes(parsedURL.protocol);
  } catch (error) {
    return false;
  }
}

/** Set server URL in config file */
export function setServerURL(url: string) {
  if (!isValidURL(url)) {
    throw new Error("Invalid URL supplied");
  }

  writeConfig({ url });
  return;
}

/** Set server username and password in config file */
export function setServerCredentials(username: string, password: string) {
  writeConfig({ username, password });
  return;
}

/** Read configuration file, return Config object if exists, create file and return empty Config object if otherwise */
export function loadConfig(): Config {
  if (!existsSync(configPath)) {
    writeFileSync(configPath, "");
    return {};
  }

  const yamlData = loadYAML(readFileSync(configPath, "utf8")) as Config;
  return yamlData;
}

/** Write data to config file, return contents of config file */
function writeConfig(data: Config): Config {
  const configData: Config = loadConfig();
  const newConfigData = { ...configData, ...data };

  writeFileSync(configPath, dumpYAML(newConfigData));
  return newConfigData;
}
