#!/usr/bin/env node

import { Command } from "commander";
import { setServerCredentials, setServerURL } from "./commands/config";
import { ping } from "./commands/ping";
import { clearCache } from "./commands/clear";
import { play } from "./commands/play";

const app = new Command();

app
  .name("scli")
  .description(
    "CLI application to interact with a Subsonic server or a Subsonic API-compatible server"
  )
  .version("1.0.8");

app.command("set-url <url>").description("Set server URL").action(setServerURL);

app
  .command("set-credentials <username> <password>")
  .description("Set server credentials")
  .action(setServerCredentials);

app.command("ping").description("Check connection to server").action(ping);

app.command("clear").description("Clear cache").action(clearCache);

app
  .command("play <type> <query>")
  .description("Play (s)ong, (p)laylist, or (a)lbum")
  .action(play);

app.parse();
