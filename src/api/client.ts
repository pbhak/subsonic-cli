import { randomBytes } from "crypto";
import { md5 } from "js-md5";
import type {
  AlbumListResponse,
  Config,
  GetAlbumResponse,
  GetPlaylistResponse,
  PingResponse,
  PlaylistsResponse,
  SearchResponse,
} from "./types";

export class SubsonicClient {
  private readonly url: string;
  private readonly username: string;
  private readonly password: string;

  constructor(config: Config | undefined) {
    if (!config)
      throw new Error(
        'Configuration is missing - please run "scli set-url" and "scli set-credentials".'
      );

    if (!config.url)
      throw new Error('Server URL is missing - please run "scli set-url".');

    if (!config.username || !config.password)
      throw new Error(
        'Server username and/or password is missing - please run "scli set-credentials".'
      );

    this.url = config.url;
    this.username = config.username;
    this.password = config.password;
  }

  /** Ping Subsonic server and return server info if successful */
  public async ping() {
    const pingURL = this.createURL("ping");

    try {
      const pingReq = await fetch(pingURL);
      if (!pingReq.ok) {
        throw new Error(`Server responded with HTTP code ${pingReq.status}`);
      }

      const pingData = (await pingReq.json()) as PingResponse;
      if (pingData["subsonic-response"].status === "failed") {
        throw new Error("Subsonic server reported an error");
      }

      return pingData["subsonic-response"];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Ping failed: ${error.message}`);
      }

      throw new Error("An unknown error occurred");
    }
  }

  /** Send search request to server and return list of all songs matching specified query */
  public async search(query: string) {
    const searchURL = this.createURL("search2");
    searchURL.searchParams.set("songCount", "50000");
    searchURL.searchParams.set("artistCount", "0");
    searchURL.searchParams.set("albumCount", "0");
    searchURL.searchParams.set("query", query);

    try {
      const searchReq = await fetch(searchURL);
      if (!searchReq.ok) {
        throw new Error(`Server responded with HTTP code ${searchReq.status}`);
      }

      const searchData = (await searchReq.json()) as SearchResponse;
      if (searchData["subsonic-response"].status === "failed") {
        throw new Error("Subsonic server reported an error");
      }

      return searchData["subsonic-response"].searchResult2.song;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      throw new Error("An unknown error occurred");
    }
  }

  /** Get list of all playlists that can be played by the user */
  public async getPlaylists() {
    const playlistsURL = this.createURL("getPlaylists");

    try {
      const playlistsReq = await fetch(playlistsURL);
      if (!playlistsReq.ok) {
        throw new Error(
          `Server responded with HTTP code ${playlistsReq.status}`
        );
      }

      const playlistsData = (await playlistsReq.json()) as PlaylistsResponse;
      if (playlistsData["subsonic-response"].status === "failed") {
        throw new Error("Subsonic server reported an error");
      }

      return playlistsData["subsonic-response"].playlists.playlist;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Playlist retrieval failed: ${error.message}`);
      }

      throw new Error("An unknown error occurred");
    }
  }

  /** Get info and song listing of playlist with given ID */
  public async getPlaylist(id: string) {
    const playlistInfoURL = this.createURL("getPlaylist");
    playlistInfoURL.searchParams.set("id", id);

    try {
      const playlistInfoReq = await fetch(playlistInfoURL);
      if (!playlistInfoReq.ok) {
        throw new Error(
          `Server responded with HTTP code ${playlistInfoReq.status}`
        );
      }

      const playlistInfo =
        (await playlistInfoReq.json()) as GetPlaylistResponse;
      if (playlistInfo["subsonic-response"].status === "failed") {
        throw new Error("Subsonic server reported an error");
      }

      return playlistInfo["subsonic-response"].playlist;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Playlist info retrieval failed: ${error.message}`);
      }

      throw new Error("An unknown error occurred");
    }
  }

  /** Get list of the top 500 albums playable by a user, in order of frequency */
  public async getAlbums() {
    const albumListURL = this.createURL("getAlbumList");
    albumListURL.searchParams.set("type", "frequent");
    albumListURL.searchParams.set("size", "500");

    try {
      const albumListReq = await fetch(albumListURL);
      if (!albumListReq.ok) {
        throw new Error(
          `Server responded with HTTP code ${albumListReq.status}`
        );
      }

      const albumList = (await albumListReq.json()) as AlbumListResponse;
      if (albumList["subsonic-response"].status === "failed") {
        throw new Error("Subsonic server reported an error");
      }

      return albumList["subsonic-response"].albumList.album;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Album list retrieval failed: ${error.message}`);
      }

      throw new Error("An unknown error occurred");
    }
  }

  /** Get info and song listing of album with given ID */
  public async getAlbum(id: string) {
    const albumInfoURL = this.createURL("getAlbum");
    albumInfoURL.searchParams.set("id", id);

    try {
      const albumInfoReq = await fetch(albumInfoURL);
      if (!albumInfoReq.ok) {
        throw new Error(
          `Server responded with HTTP code ${albumInfoReq.status}`
        );
      }

      const albumInfo = (await albumInfoReq.json()) as GetAlbumResponse;
      if (albumInfo["subsonic-response"].status === "failed") {
        throw new Error("Subsonic server reported an error");
      }

      return albumInfo["subsonic-response"].album;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Album info retrieval failed: ${error.message}`);
      }

      throw new Error("An unknown error occurred");
    }
  }

  private createURL(endpoint: string): URL {
    const url = new URL(`/rest/${endpoint}`, this.url);
    const salt = randomBytes(6).toString("hex");
    const hash = md5(this.password + salt);

    url.searchParams.set("u", this.username);
    url.searchParams.set("t", hash);
    url.searchParams.set("s", salt);
    url.searchParams.set("v", "1.16.1");
    url.searchParams.set("c", "scli");
    url.searchParams.set("f", "json");

    return url;
  }
}
