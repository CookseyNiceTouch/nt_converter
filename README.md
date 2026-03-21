# NT Converter

A professional batch media converter for video editors and creatives. Drop in any video, audio, or image files, choose your output settings, and convert — powered by ffmpeg under the hood.

## Features

- Drag-and-drop, file picker, and folder import
- Preset profiles (H.264 Web, H.265 Archive, ProRes, DNxHR, audio extract, GIF)
- Full manual control over codec, container, resolution, bitrate, fps
- Live progress with ffmpeg stats (fps, bitrate, speed, ETA)
- Sequential queue processing
- Output files saved alongside originals with `_nt_` suffix
- Auto-update from GitHub Releases
- Cross-platform: Windows (x64) and macOS (x64 + ARM)

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- ffmpeg + ffprobe binaries placed in `resources/ffmpeg/<platform>-<arch>/`

For local development on Windows, download static ffmpeg from [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds/releases) and place `ffmpeg.exe` and `ffprobe.exe` in `resources/ffmpeg/win32-x64/`.

For macOS, download from [evermeet.cx/ffmpeg](https://evermeet.cx/ffmpeg/) and place `ffmpeg` and `ffprobe` in the appropriate `resources/ffmpeg/darwin-arm64/` or `resources/ffmpeg/darwin-x64/` directory.

### Install & Run

```bash
npm install
npm run dev
```

### Build for Production

```bash
# Windows
npm run package:win

# macOS
npm run package:mac
```

Built artifacts appear in `dist/`.

## Release Workflow

1. Bump version in `package.json`
2. Commit the change
3. Tag: `git tag v1.0.0`
4. Push: `git push && git push --tags`
5. GitHub Actions builds for all platforms and publishes to GitHub Releases
6. Running apps auto-detect the new release on next launch

## Tech Stack

- Electron + electron-vite
- React 18 + TypeScript
- Tailwind CSS v4
- electron-builder for packaging
- electron-updater for auto-update
- Bundled ffmpeg/ffprobe static binaries

## License

ISC
