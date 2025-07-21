import type {
  Config,
  PingResponse,
  SearchResponse,
  PlaylistsResponse,
  GetPlaylistResponse,
  AlbumListResponse,
  GetAlbumResponse,
} from "./api/types";
import { Command } from "commander";
import { md5 } from "js-md5";
import * as yaml from "js-yaml";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rm,
} from "node:fs";
import path from "node:path";
import { navigateArray, type ArrayNavigationResult } from "./arrayNavigation";
import { exists, writeFile } from "node:fs/promises";
import * as readline from "readline";
import FuzzySearch from "fuzzy-search";

const configPath = path.join(import.meta.dirname, "../config.yml");

function sanitizeFilename(fileName: string): string {
  return fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, "_");
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

function createURL(endpoint: string): URL | undefined {
  if (existsSync(configPath)) {
    const yamlData = yaml.load(readFileSync(configPath, "utf8")) as Config;

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
    const url = new URL(`/rest/${endpoint}`, yamlData.url);
    const salt = randomBytes(6).toString("hex");
    const hash = md5(yamlData.password + salt);

    url.searchParams.set("u", yamlData.username);
    url.searchParams.set("t", hash);
    url.searchParams.set("s", salt);
    url.searchParams.set("v", "1.16.1");
    url.searchParams.set("c", "scli");
    url.searchParams.set("f", "json");

    return url;
  }
}

async function playSong(
  songId: string,
  songName: string,
  songList: boolean = false
) {
  const streamURL = createURL("stream") as URL;
  streamURL.searchParams.set("format", "mp3");
  streamURL.searchParams.set("id", songId);

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  let exit = false;

  const keypressHandler = (_str: string, _key: readline.Key) => {
    if (songList) exit = true;
  };

  process.stdin.on("keypress", keypressHandler);

  if (exit) return;

  if (
    !existsSync(
      path.join(
        import.meta.dirname,
        `../cache/${sanitizeFilename(songName.replaceAll(" ", "_"))}.mp3`
      )
    )
  ) {
    mkdirSync(path.join(import.meta.dirname, "../cache"), { recursive: true });
    await fetch(streamURL)
      .then(async (data) => await data.arrayBuffer())
      .then(
        async (buffer) =>
          await writeFile(
            path.join(
              import.meta.dirname,
              `../cache/${sanitizeFilename(songName.replaceAll(" ", "_"))}.mp3`
            ),
            Buffer.from(buffer)
          )
      );
  }
  console.log(`. playing ${!songList ? "(ESC/Ctrl+C to exit)" : ""}`);

  process.stdin.removeListener("keypress", keypressHandler);

  const proc = Bun.spawn([
    "ffplay",
    "-nodisp",
    "-autoexit",
    "-loglevel",
    "quiet",
    path.join(
      import.meta.dirname,
      `../cache/${sanitizeFilename(songName.replaceAll(" ", "_"))}.mp3`
    ),
  ]);

  const killSongHandler = (_str: string, key: readline.Key) => {
    if (key.name === "escape" || (key.ctrl && key.name === "c")) process.exit();
    if (songList) proc.kill();
  };

  process.stdin.on("keypress", killSongHandler);

  await proc.exited;
  process.stdin.removeListener("keypress", killSongHandler);
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

    if (existsSync(configPath)) {
      const yamlData = yaml.load(
        readFileSync(configPath, "utf8")
      ) as Config;

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
      ) as Config;

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
      ) as Config;

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

      const pingURL = createURL("ping") as URL;

      try {
        const ping = (await fetch(pingURL).then(
          async (res) => await res.json()
        )) as PingResponse;
        if (ping["subsonic-response"].status === "ok") {
          console.log(`Server ${pingURL.origin} is online!`);
          return;
        }
      } catch (error) {
        console.log(`An error occured while pinging ${pingURL.origin}`);
        return;
      }
    }
    console.log("Error - URL and credentials not set");
  });

app
  .command("play")
  .description("Play song via ffplay")
  .argument("<category>", "Type of music to play ([s]ong, [a]lbum, [p]laylist)")
  .argument("<string>", "Search string")
  .action(async (category: string, string: string) => {
    if (existsSync(configPath)) {
      const yamlData = yaml.load(
        readFileSync(configPath, "utf8")
      ) as Config;

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

      switch (category) {
        case "s":
        case "song":
          const searchURL = createURL("search2") as URL;

          process.stdout.write("Establishing connection to server..");

          let searchResponse: SearchResponse;
          try {
            searchResponse = (await fetch(searchURL).then(
              async (res) => await res.json()
            )) as SearchResponse;
          } catch {
            console.log("Error connecting to server");
            return;
          }

          console.log(".connection established!");

          if (
            !searchResponse ||
            !searchResponse["subsonic-response"].searchResult2.song
          ) {
            console.log(`No songs found for query ${string}`);
          }

          const songList =
            searchResponse["subsonic-response"].searchResult2.song;
          const navigation = await navigateArray(
            songList.map((song) => `${song.title} - ${song.artist}`)
          );

          if (navigation.cancelled) {
            console.log("Navigation cancelled");
            process.exit();
          }

          const selectedSong = songList[navigation.selectedIndex as number];
          console.log("Downloading song...");
          await playSong(
            selectedSong?.id as string,
            selectedSong?.title as string
          );
          break;

        case "p":
        case "playlist":
          const playlistURL = createURL("getPlaylists") as URL;
          try {
            const playlistsResponse = (await fetch(playlistURL).then(
              async (res) => res.json()
            )) as PlaylistsResponse;

            const playlists =
              playlistsResponse["subsonic-response"].playlists.playlist;
            const playlistNames = playlists.map((playlist) => playlist.name);

            const playlistSearchResult = new FuzzySearch(playlists, [
              "name",
            ]).search(string);
            let selected: ArrayNavigationResult;

            if (playlistSearchResult.length === 0) {
              console.log("No search results found");
              break;
            } else if (playlistSearchResult.length === 1) {
              selected = {
                selectedItem: playlistSearchResult[0]?.name,
                selectedIndex: playlists.indexOf(playlistSearchResult[0]!),
                cancelled: false,
              };
            } else {
              selected = await navigateArray(playlistNames);
            }

            const playlistId = playlists[selected.selectedIndex as number]?.id;
            if (!playlistId) {
              console.log("An error occurred while fetching playlist data");
              break;
            }

            const playlistListingURL = createURL("getPlaylist") as URL;
            playlistListingURL.searchParams.set("id", playlistId);

            // oh god not another nested trycatch
            try {
              const playlistInfo = (await fetch(playlistListingURL).then(
                async (res) => await res.json()
              )) as GetPlaylistResponse;

              console.log("(Press any key for next song, ESC/Ctrl+C to exit)");

              for (const song of playlistInfo["subsonic-response"].playlist
                .entry) {
                process.stdout.write(
                  `Downloading song ${song.title} - ${song.artist}..`
                );
                await playSong(song.id, song.title, true);
              }
            } catch {
              console.log("An error occurred while fetching playlist data");
            }
          } catch {
            console.log("An error occured while connecting to the server");
          }
          break;

        case "a":
        case "album":
          const albumListURL = createURL("getAlbumList") as URL;
          albumListURL.searchParams.set("type", "frequent");
          albumListURL.searchParams.set("size", "500");

          try {
            const albumListResponse = (await fetch(albumListURL).then(
              async (res) => await res.json()
            )) as AlbumListResponse;

            const albumList =
              albumListResponse["subsonic-response"].albumList.album;
            const searchResult = new FuzzySearch(albumList, ["title"]).search(
              string
            );

            let selectedAlbum;

            if (searchResult.length === 0) {
              console.log(`No search results found`);
              break;
            } else if (searchResult.length === 1) {
              selectedAlbum = searchResult[0];
            } else {
              const navigation = await navigateArray(
                searchResult.map((song) => song.title)
              );

              if (!navigation.cancelled) {
                selectedAlbum = searchResult[navigation.selectedIndex!];
              }
            }

            const albumId = selectedAlbum?.id!;
            const albumURL = createURL("getAlbum") as URL;
            albumURL.searchParams.set("id", albumId);

            try {
              const albumData = (await fetch(albumURL).then(
                async (res) => await res.json()
              )) as GetAlbumResponse;
              console.log("(Press any key for next song, ESC/Ctrl+C to exit)");

              for (const song of albumData["subsonic-response"].album.song) {
                process.stdout.write(
                  `Downloading song ${song.title} - ${song.artist}..`
                );
                await playSong(song.id, song.title, true);
              }
            } catch {
              console.log("Error occurred while fetching album data");
            }
          } catch {
            console.log("Error while fetching album information");
          }
          break;
      }
      process.exit();
    }
  });

app
  .command("clear")
  .description("Clear song cache")
  .action(() => {
    if (!existsSync(path.join(import.meta.dirname, "../cache"))) {
      console.log("Cache does not exist");
      return;
    }

    rm(
      path.join(import.meta.dirname, "../cache"),
      { recursive: true, force: true },
      (err) => {
        if (err) throw err;
        console.log("Cache cleared!");
      }
    );
  });

app.parse();
