import { spawn } from "child_process";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { homedir } from "os";
import path from "path";
import { stdin } from "process";
import * as readline from "readline";

export async function playSong(
  songName: string,
  url: URL,
  isList: boolean = false,
  scrobbleURL?: URL
) {
  const cachePath = path.join(homedir(), ".scli-cache/");

  // Sanitize filename of song
  const sanitizedFilePath = path.join(
    cachePath,
    songName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, "_") + ".mp3"
  );

  // Download song if it isn't currently cached
  if (!existsSync(sanitizedFilePath)) {
    await mkdir(cachePath, { recursive: true });

    const songDataReq = await fetch(url);
    const songDataBuffer = await songDataReq.arrayBuffer();

    await writeFile(sanitizedFilePath, Buffer.from(songDataBuffer));
  }

  console.log(`.playing ${isList ? "" : "(ESC/Ctrl+C to exit)"}`);
  const ffplayProc = spawn("ffplay", [
    "-nodisp",
    "-autoexit",
    "-loglevel",
    "quiet",
    sanitizedFilePath,
  ]);

  if (scrobbleURL) void fetch(scrobbleURL);

  const keypressHandler = (_str: string, key: readline.Key) => {
    // Exit on Esc/Ctrl+C
    if (key.name === "escape" || (key.ctrl && key.name === "c")) process.exit();
    // If the current song is a playlist/album, then make any keypress kill the song player
    if (isList) ffplayProc.kill();
  };

  readline.emitKeypressEvents(stdin);
  if (stdin.isTTY) stdin.setRawMode(true);

  process.stdin.on("keypress", keypressHandler);

  await new Promise<void>((resolve) => {
    ffplayProc.on("close", () => {
      resolve();
    });
  });

  process.stdin.removeListener("keypress", keypressHandler);
  if (stdin.isTTY) stdin.setRawMode(false);
}
