type SubsonicResponse<T> = {
  "subsonic-response": {
    status: "ok" | "failed";
    version: string;
    type: string;
    serverVersion: string;
    openSubsonic: boolean;
  } & T;
};

export type Song = {
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
  playCount: number;
  discNumber: number;
  created: string;
  albumId: string;
  artistId: string;
  type: string;
  isVideo: boolean;
  played: string;
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
};

export type Album = {
  id: string;
  parent: string;
  isDir: boolean;
  title: string;
  name: string;
  album: string;
  artist: string;
  year: number;
  genre?: string;
  coverArt: string;
  duration: number;
  playCount: number;
  created: string;
  artistId: string;
  songCount: number;
  isVideo: boolean;
  played: string;
  bpm: number;
  comment: string;
  sortName: string;
  mediaType: string;
  musicBrainzId: string;
  genres: Array<{
    name: string;
  }>;
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
};

export type Playlist = {
  id: string;
  name: string;
  songCount: number;
  duration: number;
  public: boolean;
  owner: string;
  created: string;
  changed: string;
  coverArt: string;
  comment?: string;
};

export type Config = {
  username?: string;
  password?: string;
  url?: string;
};

export type PingResponse = SubsonicResponse<{}>;

export type SearchResponse = SubsonicResponse<{
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
    song: Song[];
  };
}>;

export type PlaylistsResponse = SubsonicResponse<{
  playlists: {
    playlist: Playlist[];
  };
}>;

export type GetPlaylistResponse = SubsonicResponse<{
  playlist: {
    id: string;
    name: string;
    comment: string;
    songCount: number;
    duration: number;
    public: boolean;
    owner: string;
    created: string;
    changed: string;
    coverArt: string;
    entry: Song[];
  };
}>;

export type AlbumListResponse = SubsonicResponse<{
  albumList: {
    album: Album[];
  };
}>;

export type GetAlbumResponse = SubsonicResponse<{
  album: {
    id: string;
    name: string;
    artist: string;
    artistId: string;
    coverArt: string;
    songCount: number;
    duration: number;
    playCount: number;
    created: string;
    year: number;
    genre: string;
    played: string;
    userRating: number;
    genres: Array<{
      name: string;
    }>;
    musicBrainzId: string;
    isCompilation: boolean;
    sortName: string;
    discTitles: Array<any>;
    originalReleaseDate: {};
    releaseDate: {};
    releaseTypes: Array<any>;
    recordLabels: Array<any>;
    moods: Array<any>;
    artists: Array<{
      id: string;
      name: string;
    }>;
    displayArtist: string;
    explicitStatus: string;
    version: string;
    song: Song[];
  };
}>;
