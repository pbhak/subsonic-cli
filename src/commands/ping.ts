import type { SubsonicClient } from "../api/client";
import { runCommand } from "./handler";

async function pingLogic(client: SubsonicClient) {
  const ping = await client.ping();
  console.log(
    `Server is online! Server running Subsonic version ${ping.serverVersion}`
  );
}

export const ping = runCommand(pingLogic);
