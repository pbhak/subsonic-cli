import { Command } from "commander";
import { md5 } from "js-md5";
import * as yaml from "js-yaml";
import player from "play-sound";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  lchown,
} from "node:fs";
import path from "node:path";
import { navigateArray } from "./arrayNavigation";
import { writeFile } from "node:fs/promises";

const configPath = path.join(import.meta.dirname, "../config.yml");

type ConfigFile = {
  username?: string;
  password?: string;
  url?: string;
};

type PingResponse = {
  "subsonic-response": {
    status: string;
    version: string;
    type: string;
    serverVersion: string;
    openSubsonic: boolean;
  };
};

type SearchResponse = {
  "subsonic-response": {
    status: string;
    version: string;
    type: string;
    serverVersion: string;
    openSubsonic: boolean;
    searchResult2: {
      artist: Array<{
        id: string;
        name: string;
        starred: string;
        coverArt: string;
        artistImageUrl: string;
      }>;
      album: Array<{
        id: string;
        parent: string;
        isDir: boolean;
        title: string;
        name: string;
        album: string;
        artist: string;
        year: number;
        coverArt: string;
        duration: number;
        created: string;
        artistId: string;
        songCount: number;
        isVideo: boolean;
        bpm: number;
        comment: string;
        sortName: string;
        mediaType: string;
        musicBrainzId: string;
        genres: Array<any>;
        replayGain: {};
        channelCount: number;
        samplingRate: number;
        bitDepth: number;
        moods: Array<any>;
        artists: Array<{
          id: string;
          name: string;
        }>;
        displayArtist: string;
        albumArtists: Array<{
          id: string;
          name: string;
        }>;
        displayAlbumArtist: string;
        contributors: Array<any>;
        displayComposer: string;
        explicitStatus: string;
        playCount?: number;
        played?: string;
      }>;
      song: Array<{
        id: string;
        parent: string;
        isDir: boolean;
        title: string;
        album: string;
        artist: string;
        track: number;
        year: number;
        coverArt: string;
        size: number;
        contentType: string;
        suffix: string;
        duration: number;
        bitRate: number;
        path: string;
        playCount?: number;
        discNumber: number;
        created: string;
        albumId: string;
        artistId: string;
        type: string;
        isVideo: boolean;
        played?: string;
        bpm: number;
        comment: string;
        sortName: string;
        mediaType: string;
        musicBrainzId: string;
        genres: Array<any>;
        replayGain: {
          trackPeak: number;
          albumPeak: number;
        };
        channelCount: number;
        samplingRate: number;
        bitDepth: number;
        moods: Array<any>;
        artists: Array<{
          id: string;
          name: string;
        }>;
        displayArtist: string;
        albumArtists: Array<{
          id: string;
          name: string;
        }>;
        displayAlbumArtist: string;
        contributors: Array<any>;
        displayComposer: string;
        explicitStatus: string;
      }>;
    };
  };
};

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
    const yamlData = yaml.load(readFileSync(configPath, "utf8")) as ConfigFile;

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
    const url = new URL(endpoint, yamlData.url);
    const salt = randomBytes(6).toString("hex");
    const hash = md5(yamlData.password + salt);

    url.searchParams.set("u", yamlData.username);
    url.searchParams.set("t", hash);
    url.searchParams.set("s", salt);
    url.searchParams.set("v", "1.16.1");
    url.searchParams.set("c", "scli");

    return url;
  }
}

async function playSong(songId: string, songName: string) {
  const streamURL = createURL("/rest/stream") as URL;
  streamURL.searchParams.set("format", "mp3");
  streamURL.searchParams.set("id", songId);

  mkdirSync(path.join(import.meta.dirname, "../cache"), { recursive: true });
  await fetch(streamURL)
    .then(async (data) => await data.arrayBuffer())
    .then(
      async (buffer) =>
        await writeFile(
          path.join(
            import.meta.dirname,
            `../cache/${songName.replaceAll(" ", "_")}.mp3`
          ),
          Buffer.from(buffer)
        )
    );
  player().play(
    path.join(
      import.meta.dirname,
      `../cache/${songName.replaceAll(" ", "_")}.mp3`
    ),
    (err: Error) => {
      if (err) throw err;
    }
  );
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

      const pingURL = createURL("/rest/ping") as URL;
      pingURL.searchParams.set("f", "json");

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
  .description("Play album or playlist")
  .argument("<category>", "Type of music to play (album, playlist)")
  .argument("<string>", "Search string")
  .action(async (category: string, string: string) => {
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

      switch (category) {
        case "s":
        case "song":
          const searchURL = createURL("/rest/search2") as URL;
          searchURL.searchParams.set("f", "json");

          let searchResponse: SearchResponse;
          try {
            searchResponse = (await fetch(searchURL).then(
              async (res) => await res.json()
            )) as SearchResponse;
          } catch {
            console.log("Error connecting to server");
            return;
          }

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
            return;
          }

          const selectedItem = navigation;
          const selectedSong = songList[navigation.selectedIndex as number];
          console.log("Downloading song...");
          playSong(selectedSong?.id as string, selectedSong?.title as string);
          console.log(
            `${selectedSong?.title as string} launched in media player!`
          );
          process.exit();
      }
    }
  });

app.parse();
