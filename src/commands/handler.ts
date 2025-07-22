import { SubsonicClient } from "../api/client";
import { loadConfig } from "./config";

type CommandHandler = (client: SubsonicClient, ...args: any[]) => Promise<void>;

export function runCommand(handler: CommandHandler) {
  return async (...args: any[]) => {
    try {
      const configData = loadConfig();
      const client = new SubsonicClient(configData);

      await handler(client, ...args);
    } catch (error) {
      if (error instanceof Error) {
        console.log(`Error: ${error.message}`);
      } else {
        console.log("An unknown error occurred.");
      }

      process.exit(1);
    }
  };
}
