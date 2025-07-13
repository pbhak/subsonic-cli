import { Command } from "commander";
import * as yaml from "js-yaml";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

interface ConfigFile {
  username?: string;
  password?: string;
  url?: string;
}

function isValidURL(url: string) {
  // the URL class constructor errors if the passed in string is not a valid URL
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

const app = new Command();

app
  .name("scli")
  .description(
    "CLI application to interact with a Subsonic server or a Subsonic API-compatible server"
  )
  .version("0.1.0");

app
  .command("set-url")
  .description("Set the server URL")
  .argument("<url>", "URL of server")
  .action((url: string) => {
    if (!isValidURL(url)) {
      console.log("Error - invalid URL specified");
      return;
    }

    const configPath = path.join(import.meta.dirname, "../config.yml");
    if (existsSync(configPath)) {
      const yamlData = yaml.load(readFileSync(configPath, "utf8"));
      (yamlData as ConfigFile).url = url;
      writeFileSync(configPath, yaml.dump(yamlData));
      return;
    }
    writeFileSync(configPath, yaml.dump({ url }));

    console.log(`Set server URL to ${url}`);
  });

app
  .command("set-credentials")
  .description("Set server login credentials")
  .argument("<username>", "Server username")
  .argument("<password>", "Server password")
  .action((username: string, password: string) => {
    const configPath = path.join(import.meta.dirname, "../config.yml");
    if (existsSync(configPath)) {
      const yamlData = yaml.load(readFileSync(configPath, "utf8"));
      (yamlData as ConfigFile).username = username;
      (yamlData as ConfigFile).password = password;

      writeFileSync(configPath, yaml.dump(yamlData));
      return;
    }
    writeFileSync(configPath, yaml.dump({ username, password }));

    console.log(`Credentials saved successfully!`);
  });

app.parse();
