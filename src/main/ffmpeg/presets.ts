export interface Preset {
  id: string
  name: string
  category: string
  settings: {
    videoCodec: string
    audioCodec: string
    container: string
    resolution: string
    videoBitrate: string
    audioBitrate: string
    fps: string
    extraArgs: string
  }
}

export const presets: Preset[] = [
  {
    id: 'h264-web',
    name: 'H.264 Web',
    category: 'Video',
    settings: {
      videoCodec: 'libx264',
      audioCodec: 'aac',
      container: 'mp4',
      resolution: '1920x1080',
      videoBitrate: '8000k',
      audioBitrate: '192k',
      fps: '',
      extraArgs: '-preset medium -crf 18'
    }
  },
  {
    id: 'h265-archive',
    name: 'H.265 Archive',
    category: 'Video',
    settings: {
      videoCodec: 'libx265',
      audioCodec: 'copy',
      container: 'mkv',
      resolution: '',
      videoBitrate: '',
      audioBitrate: '',
      fps: '',
      extraArgs: '-preset medium -crf 20'
    }
  },
  {
    id: 'prores-proxy',
    name: 'ProRes Proxy',
    category: 'Professional',
    settings: {
      videoCodec: 'prores_ks',
      audioCodec: 'pcm_s16le',
      container: 'mov',
      resolution: '',
      videoBitrate: '',
      audioBitrate: '',
      fps: '',
      extraArgs: '-profile:v 0'
    }
  },
  {
    id: 'prores-hq',
    name: 'ProRes 422 HQ',
    category: 'Professional',
    settings: {
      videoCodec: 'prores_ks',
      audioCodec: 'pcm_s16le',
      container: 'mov',
      resolution: '',
      videoBitrate: '',
      audioBitrate: '',
      fps: '',
      extraArgs: '-profile:v 3'
    }
  },
  {
    id: 'dnxhr-sq',
    name: 'DNxHR SQ',
    category: 'Professional',
    settings: {
      videoCodec: 'dnxhd',
      audioCodec: 'pcm_s16le',
      container: 'mxf',
      resolution: '',
      videoBitrate: '',
      audioBitrate: '',
      fps: '',
      extraArgs: '-profile:v dnxhr_sq'
    }
  },
  {
    id: 'audio-wav',
    name: 'Extract Audio (WAV)',
    category: 'Audio',
    settings: {
      videoCodec: '',
      audioCodec: 'pcm_s16le',
      container: 'wav',
      resolution: '',
      videoBitrate: '',
      audioBitrate: '',
      fps: '',
      extraArgs: '-vn'
    }
  },
  {
    id: 'audio-mp3',
    name: 'Extract Audio (MP3)',
    category: 'Audio',
    settings: {
      videoCodec: '',
      audioCodec: 'libmp3lame',
      container: 'mp3',
      resolution: '',
      videoBitrate: '',
      audioBitrate: '320k',
      fps: '',
      extraArgs: '-vn'
    }
  },
  {
    id: 'gif',
    name: 'GIF from Video',
    category: 'Other',
    settings: {
      videoCodec: 'gif',
      audioCodec: '',
      container: 'gif',
      resolution: '480:-1',
      videoBitrate: '',
      audioBitrate: '',
      fps: '15',
      extraArgs: '-an'
    }
  }
]
