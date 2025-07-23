# Subsonic CLI

<div align="center">
  <a href="https://shipwrecked.hackclub.com/?t=ghrm" target="_blank">
    <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/739361f1d440b17fc9e2f74e49fc185d86cbec14_badge.png" 
         alt="This project is part of Shipwrecked, the world's first hackathon on an island!" 
         style="width: 35%; transform: scale(0.75)">
  </a>
</div>

![Hackatime badge](https://hackatime-badge.hackclub.com/U07V1ND4H0Q/scli)
![NPM Version](https://img.shields.io/npm/v/subsonic-cli)

A basic CLI application to interact with Subsonic API compatible servers.

<img src="./assets/demo.gif" width="50%">


> [!NOTE]
> This program relies on FFplay (which is part of FFmpeg suite) to work properly. If not installed, unexpected program behavior may occur.

Install with `npm i -g subsonic-cli` and run with `scli`.
(alternatively, use `npx subsonic-cli`.)

Commands

- `scli help` - shows the help menu.

### Configuration

_all config data saved to ~/.scli-config.yml_

- `scli set-url <url>` - sets the server URL
- `scli set-credentials <username> <password>` - sets the server username/password

### Cache/Server operation

_cached songs saved to ~/.scli-cache/_

- `scli clear` - empties cache
- `scli ping` - test connection to server
- `scli play (s)ong <query>` - Searches for songs matching the given query - if there are multiple results, opens a navigation menu. Plays the song with FFplay.
- `scli play (a)lbum <query>` - Searches for albums matching the given query - if there are multiple results, opens a navigation menu. Plays the album with FFplay.
- `scli play (p)laylist <query>` - Searches for playlists matching the given query - if there are multiple results, opens a navigation menu. Plays the playlist with FFplay.
