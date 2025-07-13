import { Command } from "commander";
import { md5 } from "js-md5";
import * as yaml from "js-yaml";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type ConfigFile = {
  username?: string;
  password?: string;
  url?: string;
}

type PingResponse = {
  "subsonic-response": {
    status: string
    version: string
    type: string
    serverVersion: string
    openSubsonic: boolean
  }
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
const configPath = path.join(import.meta.dirname, "../config.yml");

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

    if (existsSync(configPath)) {
      const yamlData = yaml.load(
        readFileSync(configPath, "utf8")
      ) as ConfigFile;

      if (!yamlData) {
        writeFileSync(configPath, yaml.dump({ url }));

        console.log(`Set server URL to ${url}`);
        return;
      }

      yamlData.url = url;

      writeFileSync(configPath, yaml.dump(yamlData));
      console.log(`Set server URL to ${url}`);
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
    if (existsSync(configPath)) {
      const yamlData = yaml.load(
        readFileSync(configPath, "utf8")
      ) as ConfigFile;

      if (!yamlData) {
        writeFileSync(configPath, yaml.dump({ username, password }));

        console.log(`Credentials saved successfully!`);
        return;
      }

      yamlData.username = username;
      yamlData.password = password;

      writeFileSync(configPath, yaml.dump(yamlData));
      console.log(`Credentials saved successfully!`);
      return;
    }
    writeFileSync(configPath, yaml.dump({ username, password }));

    console.log(`Credentials saved successfully!`);
  });

app
  .command("ping")
  .description("Check connection to server")
  .action(async () => {
    if (existsSync(configPath)) {
      const yamlData = yaml.load(
        readFileSync(configPath, "utf8")
      ) as ConfigFile;

      if (!yamlData) {
        console.log("Error - invalid config");
        return;
      }

      if (!yamlData.url) {
        console.log("Error - no URL set");
        return;
      } else if (!yamlData.username || !yamlData.password) {
        console.log("Error - credentials not set");
        return;
      }

      const pingURL = new URL("/rest/ping", yamlData.url);
      const salt = randomBytes(6).toString("hex");
      const hash = md5(yamlData.password + salt);

      pingURL.searchParams.set("u", yamlData.username);
      pingURL.searchParams.set("t", hash);
      pingURL.searchParams.set("s", salt);
      pingURL.searchParams.set("v", "1.16.1");
      pingURL.searchParams.set("c", "scli");
      pingURL.searchParams.set("f", "json");

      try {
        const ping = await fetch(pingURL).then(async res => await res.json()) as PingResponse;
        if (ping["subsonic-response"].status === 'ok') {
          console.log(`Server ${pingURL.origin} is online!`)
          return;
        }
      } catch (error) {
        console.log(`An error occured while pinging ${pingURL.origin}`);
        return;
      } 
    }

    console.log("Error - URL and credentials not set");
  });

app.parse();
