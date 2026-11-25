import { drumrollHitTimes } from './drumroll'

// Sounds are synthesized, so there are no audio files to license, download or cache.

let context: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
let muted = false

export function setSoundMuted(value: boolean): void {
  muted = value
  // Fades rather than cuts, so muting in the middle of a roll does not click.
  if (context && master) master.gain.setTargetAtTime(value ? 0 : 1, context.currentTime, 0.02)
}

/** Created on the first sound, which always follows a press: browsers only allow audio after a gesture. */
function audio(): { context: AudioContext; master: GainNode } | null {
  if (typeof AudioContext === 'undefined') return null
  if (!context || !master) {
    context = new AudioContext()
    master = context.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(context.destination)
  }
  if (context.state === 'suspended') void context.resume()
  return { context, master }
}

function noise(audioContext: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate)
    const samples = noiseBuffer.getChannelData(0)
    for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

function noiseBurst(
  audioContext: AudioContext,
  output: AudioNode,
  { at, level, decay, filter, frequency }: { at: number; level: number; decay: number; filter: BiquadFilterType; frequency: number },
) {
  const source = audioContext.createBufferSource()
  source.buffer = noise(audioContext)
  const shape = audioContext.createBiquadFilter()
  shape.type = filter
  shape.frequency.value = frequency
  const gain = audioContext.createGain()
  gain.gain.setValueAtTime(level, at)
  gain.gain.exponentialRampToValueAtTime(0.001, at + decay)
  source.connect(shape).connect(gain).connect(output)
  // A random offset into the buffer keeps consecutive hits from sounding identical.
  source.start(at, Math.random() * 0.5, decay + 0.02)
}

/** A snare roll that speeds up and swells over the shake. Returns a function that stops it early. */
export function playDrumroll(durationMs: number): () => void {
  if (muted) return () => {}
  const sound = audio()
  if (!sound) return () => {}
  const { context: audioContext } = sound

  const bus = audioContext.createGain()
  bus.connect(sound.master)
  const start = audioContext.currentTime + 0.02
  const duration = durationMs / 1000
  for (const time of drumrollHitTimes(duration)) {
    noiseBurst(audioContext, bus, {
      at: start + time,
      level: 0.15 + 0.45 * (time / duration),
      decay: 0.07,
      filter: 'bandpass',
      frequency: 1800,
    })
  }

  return () => {
    bus.gain.setTargetAtTime(0, audioContext.currentTime, 0.01)
    window.setTimeout(() => bus.disconnect(), 200)
  }
}

/** A cymbal crash under a rising chime, for the moment the lid comes off. */
export function playReveal(): void {
  if (muted) return
  const sound = audio()
  if (!sound) return
  const { context: audioContext, master: output } = sound
  const start = audioContext.currentTime + 0.01

  noiseBurst(audioContext, output, { at: start, level: 0.35, decay: 1.2, filter: 'highpass', frequency: 5000 })

  // C6, E6, G6, C7: a major arpeggio reads as "ta-da" without needing a melody.
  ;[1046.5, 1318.5, 1568, 2093].forEach((frequency, index) => {
    const at = start + index * 0.07
    const tone = audioContext.createOscillator()
    tone.type = 'triangle'
    tone.frequency.value = frequency
    const gain = audioContext.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.2, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.7)
    tone.connect(gain).connect(output)
    tone.start(at)
    tone.stop(at + 0.75)
  })
}
