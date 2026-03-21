#!/usr/bin/env node

/**
 * Downloads static ffmpeg + ffprobe binaries for local development.
 *
 * Usage:
 *   node scripts/download-ffmpeg.mjs            # auto-detect current platform
 *   node scripts/download-ffmpeg.mjs --all      # download for all platforms
 *   node scripts/download-ffmpeg.mjs win32-x64  # specific platform
 */

import { execSync } from 'child_process'
import fs from 'fs'
import https from 'https'
import http from 'http'
import os from 'os'
import path from 'path'
import { createUnzip } from 'zlib'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const RESOURCES = path.join(ROOT, 'resources', 'ffmpeg')
const TEMP = path.join(os.tmpdir(), 'nt-converter-ffmpeg-dl')

const PLATFORMS = {
  'win32-x64': {
    ffmpegUrl:
      'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    binaries: ['ffmpeg.exe', 'ffprobe.exe']
  },
  'darwin-x64': {
    ffmpegUrl: 'https://evermeet.cx/ffmpeg/getrelease/zip',
    ffprobeUrl: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip',
    binaries: ['ffmpeg', 'ffprobe']
  },
  'darwin-arm64': {
    ffmpegUrl: 'https://evermeet.cx/ffmpeg/getrelease/zip',
    ffprobeUrl: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip',
    binaries: ['ffmpeg', 'ffprobe']
  }
}

function currentPlatformKey() {
  return `${process.platform}-${process.arch}`
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const get = url.startsWith('https') ? https.get : http.get

    get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close()
        fs.unlinkSync(dest)
        return download(res.headers.location, dest).then(resolve, reject)
      }

      if (res.statusCode !== 200) {
        file.close()
        fs.unlinkSync(dest)
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }

      const total = parseInt(res.headers['content-length'] || '0', 10)
      let downloaded = 0

      res.on('data', (chunk) => {
        downloaded += chunk.length
        if (total > 0) {
          const pct = ((downloaded / total) * 100).toFixed(1)
          process.stdout.write(`\r  downloading... ${pct}%  (${(downloaded / 1e6).toFixed(1)} MB)`)
        }
      })

      res.pipe(file)
      file.on('finish', () => {
        file.close()
        process.stdout.write('\n')
        resolve()
      })
    }).on('error', (err) => {
      file.close()
      fs.unlinkSync(dest)
      reject(err)
    })
  })
}

function unzip(zipPath, outDir) {
  // Use system tools — they handle nested dirs and permissions correctly
  fs.mkdirSync(outDir, { recursive: true })
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${outDir}'"`,
      { stdio: 'pipe' }
    )
  } else {
    execSync(`unzip -o "${zipPath}" -d "${outDir}"`, { stdio: 'pipe' })
  }
}

function findFile(dir, name) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const found = findFile(full, name)
      if (found) return found
    } else if (entry.name === name) {
      return full
    }
  }
  return null
}

async function downloadPlatform(key) {
  const config = PLATFORMS[key]
  if (!config) {
    console.error(`  unknown platform: ${key}`)
    console.error(`  valid platforms: ${Object.keys(PLATFORMS).join(', ')}`)
    process.exit(1)
  }

  const destDir = path.join(RESOURCES, key)
  fs.mkdirSync(destDir, { recursive: true })

  // Check if already present
  const allPresent = config.binaries.every((b) => fs.existsSync(path.join(destDir, b)))
  if (allPresent) {
    console.log(`  ${key}: binaries already present, skipping (delete to re-download)`)
    return
  }

  fs.mkdirSync(TEMP, { recursive: true })

  console.log(`  ${key}: downloading ffmpeg...`)
  const zipPath = path.join(TEMP, `${key}-ffmpeg.zip`)
  await download(config.ffmpegUrl, zipPath)

  console.log(`  ${key}: extracting...`)
  const extractDir = path.join(TEMP, `${key}-ffmpeg`)
  if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true })
  unzip(zipPath, extractDir)

  // For Windows the zip has a nested folder structure
  const ffmpegBin = key.startsWith('win32') ? 'ffmpeg.exe' : 'ffmpeg'
  const ffprobeBin = key.startsWith('win32') ? 'ffprobe.exe' : 'ffprobe'

  const ffmpegSrc = findFile(extractDir, ffmpegBin)
  if (ffmpegSrc) {
    fs.copyFileSync(ffmpegSrc, path.join(destDir, ffmpegBin))
    console.log(`  ${key}: placed ${ffmpegBin}`)
  } else {
    console.error(`  ${key}: could not find ${ffmpegBin} in extracted archive`)
  }

  // ffprobe: same zip on Windows, separate download on macOS
  if (config.ffprobeUrl) {
    console.log(`  ${key}: downloading ffprobe...`)
    const probeZip = path.join(TEMP, `${key}-ffprobe.zip`)
    await download(config.ffprobeUrl, probeZip)

    const probeDir = path.join(TEMP, `${key}-ffprobe`)
    if (fs.existsSync(probeDir)) fs.rmSync(probeDir, { recursive: true })
    unzip(probeZip, probeDir)

    const ffprobeSrc = findFile(probeDir, ffprobeBin)
    if (ffprobeSrc) {
      fs.copyFileSync(ffprobeSrc, path.join(destDir, ffprobeBin))
      console.log(`  ${key}: placed ${ffprobeBin}`)
    } else {
      console.error(`  ${key}: could not find ${ffprobeBin} in extracted archive`)
    }
  } else {
    const ffprobeSrc = findFile(extractDir, ffprobeBin)
    if (ffprobeSrc) {
      fs.copyFileSync(ffprobeSrc, path.join(destDir, ffprobeBin))
      console.log(`  ${key}: placed ${ffprobeBin}`)
    } else {
      console.error(`  ${key}: could not find ${ffprobeBin} in extracted archive`)
    }
  }

  // Make executable on Unix
  if (!key.startsWith('win32')) {
    for (const bin of config.binaries) {
      const binPath = path.join(destDir, bin)
      if (fs.existsSync(binPath)) {
        fs.chmodSync(binPath, 0o755)
      }
    }
  }

  // Cleanup temp
  fs.rmSync(TEMP, { recursive: true, force: true })
  console.log(`  ${key}: done`)
}

async function main() {
  const arg = process.argv[2]

  console.log('NT Converter — ffmpeg binary downloader\n')

  let targets

  if (arg === '--all') {
    targets = Object.keys(PLATFORMS)
  } else if (arg && PLATFORMS[arg]) {
    targets = [arg]
  } else if (arg) {
    console.error(`Unknown argument: ${arg}`)
    console.error(`Usage: node scripts/download-ffmpeg.mjs [--all | ${Object.keys(PLATFORMS).join(' | ')}]`)
    process.exit(1)
  } else {
    const key = currentPlatformKey()
    if (!PLATFORMS[key]) {
      console.error(`Current platform ${key} is not supported.`)
      console.error(`Supported: ${Object.keys(PLATFORMS).join(', ')}`)
      process.exit(1)
    }
    targets = [key]
  }

  for (const target of targets) {
    await downloadPlatform(target)
  }

  console.log('\nAll done. Binaries are in resources/ffmpeg/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
