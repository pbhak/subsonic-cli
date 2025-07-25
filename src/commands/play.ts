import FuzzySearch from "fuzzy-search";
import type { SubsonicClient } from "../api/client";
import type { Album, Playlist, Song } from "../api/types";
import { navigateArray, type ArrayNavigationResult } from "../arrayNavigation";
import { playSong } from "../playback";
import { runCommand } from "./handler";

async function playLogic(
  client: SubsonicClient,
  searchCategory: string,
  searchQuery: string
) {
  switch (searchCategory) {
    case "s":
    case "song":
      const searchResult: Song[] = await client.search(searchQuery);
      let selectedSong: Song;

      if (!searchResult || searchResult.length === 0) {
        console.log(`No songs found for query ${searchQuery}`);
        break;
      } else if (searchResult.length === 1) {
        selectedSong = searchResult[0]!;
      } else {
        const songNav: ArrayNavigationResult = await navigateArray(
          searchResult.map((song) => song.title)
        );

        if (songNav.cancelled) {
          console.log("Navigation cancelled by user");
          break;
        }

        selectedSong = searchResult[songNav.selectedIndex!]!;
      }

      const songURL = client.createURL("stream");
      songURL.searchParams.set("id", selectedSong.id);
      songURL.searchParams.set("format", "mp3");

      process.stdout.write(
        `Downloading ${selectedSong.title} - ${selectedSong.artist}..`
      );

      const scrobbleURL = client.createURL("scrobble");
      scrobbleURL.searchParams.set("id", selectedSong.id);
      scrobbleURL.searchParams.set("submission", "false");

      await playSong(selectedSong.title, songURL, false, scrobbleURL);
      break;

    case "p":
    case "playlist":
      const allPlaylists = await client.getPlaylists();
      let selectedPlaylist: Playlist;

      if (!allPlaylists || allPlaylists.length === 0) {
        console.log("No playlists found");
        break;
      } else if (allPlaylists.length === 1) {
        selectedPlaylist = allPlaylists[0]!;
      } else {
        // More than 1 entry in allPLaylists: do a fuzzy search for the search query
        const searchedPlaylists = new FuzzySearch(allPlaylists, ["name"], {
          sort: true,
        }).search(searchQuery);

        if (!searchedPlaylists || searchedPlaylists.length === 0) {
          console.log("No playlists found");
          break;
        } else if (searchedPlaylists.length === 1) {
          selectedPlaylist = searchedPlaylists[0]!;
        } else {
          const playlistNav: ArrayNavigationResult = await navigateArray(
            searchedPlaylists.map((playlist) => playlist.name)
          );

          if (playlistNav.cancelled) {
            console.log("Navigation cancelled by user");
            break;
          }

          selectedPlaylist = searchedPlaylists[playlistNav.selectedIndex!]!;
        }
      }

      const playlistData = await client.getPlaylist(selectedPlaylist.id);

      console.log("(Press any key for next, ESC/Ctrl+C to exit)");
      for (const song of playlistData.entry) {
        const songURL = client.createURL("stream");
        songURL.searchParams.set("id", song.id);
        songURL.searchParams.set("format", "mp3");

        process.stdout.write(`Downloading ${song.title} - ${song.artist}..`);

        const scrobbleURL = client.createURL("scrobble");
        scrobbleURL.searchParams.set("id", song.id);
        scrobbleURL.searchParams.set("submission", "false");

        await playSong(song.title, songURL, true, scrobbleURL);
      }
      break;

    case "a":
    case "album":
      const allAlbums = await client.getAlbums();
      let selectedAlbum: Album;

      if (!allAlbums || allAlbums.length === 0) {
        console.log("No albums found");
        break;
      } else if (allAlbums.length === 1) {
        selectedAlbum = allAlbums[0]!;
      } else {
        const searchedAlbums = new FuzzySearch(allAlbums, ["title"], {
          sort: true,
        }).search(searchQuery);

        if (!searchedAlbums || searchedAlbums.length === 0) {
          console.log("No albums found");
          break;
        } else if (searchedAlbums.length === 1) {
          selectedAlbum = searchedAlbums[0]!;
        } else {
          const albumNav: ArrayNavigationResult = await navigateArray(
            searchedAlbums.map((album) => album.title)
          );

          if (albumNav.cancelled) {
            console.log("Navigation cancelled by user");
            break;
          }

          selectedAlbum = searchedAlbums[albumNav.selectedIndex!]!;
        }
      }

      const albumData = await client.getAlbum(selectedAlbum.id);
      console.log("(Press any key for next, ESC/Ctrl+C to exit)");
      for (const song of albumData.song) {
        const songURL = client.createURL("stream");
        songURL.searchParams.set("id", song.id);
        songURL.searchParams.set("format", "mp3");

        process.stdout.write(`Downloading ${song.title} - ${song.artist}..`);

        const scrobbleURL = client.createURL("scrobble");
        scrobbleURL.searchParams.set("id", song.id);
        scrobbleURL.searchParams.set("submission", "false");

        await playSong(song.title, songURL, true, scrobbleURL);
      }
      break;
  }
  process.exit();
}

export const play = runCommand(playLogic);
