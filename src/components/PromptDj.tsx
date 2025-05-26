import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveMusicGenerationConfig, LiveMusicServerMessage, LiveMusicSession } from '@google/genai';
import { decode, decodeAudioData } from '../../utils';
import { PromptController } from './PromptController';
import { SettingsController } from './SettingsController';
import { AddPromptButton } from './AddPromptButton';
import { PlayPauseButton } from './PlayPauseButton';
import { ResetButton } from './ResetButton';
import { ToastMessage } from './ToastMessage';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: 'v1alpha',
});
let model = 'lyria-realtime-exp';

interface Prompt {
  readonly promptId: string;
  readonly color: string;
  text: string;
  weight: number;
}

type PlaybackState = 'stopped' | 'playing' | 'loading' | 'paused';

/** Throttles a callback to be called at most once per `freq` milliseconds. */
function throttle(func: (...args: unknown[]) => void, delay: number) {
  let lastCall = 0;
  return (...args: unknown[]) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    if (timeSinceLastCall >= delay) {
      func(...args);
      lastCall = now;
    }
  };
}

const PROMPT_TEXT_PRESETS = [
  'Deep Om Drone: sustained root note with rich harmonics and sub-layered warmth',
  'Soft Tibetan Singing Bowls: resonant metal tones with long decay and reverb',
  'Airy Synth Pad: slow-attack ambient pad with gentle filter sweeps',
  'Crystal Chime Accents: bright, delicate textures with stereo shimmer',
  'Slow Breathing Shakuhachi Flute: airy, expressive melodies with natural breath noise',
  'Gentle Ocean Wave Field Recording: low-tide ambience with stereo depth',
  'Low Toned Hang Drum: warm, metallic pulses with soft mallet articulation',
  'Distant Choir Harmonies: low mixed vocal layers with subtle modulation',
  'Rainstick Washes: soft percussive textures that ebb and flow like rainfall',
  'Harmonic Bells: high-pitched tonal sparkles with long tails and subtle delays',
  'Subtle Wind Noise: filtered white noise shaped into calming wind textures',
  'Meditative Binaural Beats: slow alpha-theta range for deep relaxation',
  'Slow Pulsing Bass Pad: heart-like rhythm with warm analog movement',
  'Forest Ambience: birds, leaves, and soft movement captured in surround',
  'Layered Reverb Tails: extended space that connects all elements smoothly',
  'Stereo Space Enhancer: subtle widening for an immersive, floating experience',
];

const COLORS = [
  '#9900ff',
  '#5200ff',
  '#ff25f6',
  '#2af6de',
  '#ffdd28',
  '#3dffab',
  '#d8ff3e',
  '#d9b2ff',
];

function getUnusedRandomColor(usedColors: string[]): string {
  const availableColors = COLORS.filter((c) => !usedColors.includes(c));
  if (availableColors.length === 0) {
    // If no available colors, pick a random one from the original list.
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }
  return availableColors[Math.floor(Math.random() * availableColors.length)];
}

export const PromptDj: React.FC<{ initialPrompts: Map<string, Prompt> }> = ({ initialPrompts }) => {
  const [prompts, setPrompts] = useState<Map<string, Prompt>>(initialPrompts);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [filteredPrompts, setFilteredPrompts] = useState<Set<string>>(new Set());
  const [connectionError, setConnectionError] = useState<boolean>(true);
  const nextPromptId = useRef<number>(initialPrompts.size);
  const session = useRef<LiveMusicSession | null>(null);
  const audioContext = useRef<AudioContext>(new ((window.AudioContext || (window as any).webkitAudioContext))({ sampleRate: 48000 }));
  const outputNode = useRef<GainNode>(audioContext.current.createGain());
  const nextStartTime = useRef<number>(0);
  const bufferTime = 2; // adds an audio buffer in case of network latency
  const toastMessageRef = useRef<ToastMessage>(null);
  const settingsControllerRef = useRef<SettingsController>(null);

  useEffect(() => {
    outputNode.current.connect(audioContext.current.destination);
    connectToSession();
    setSessionPrompts();
  }, []);

  const connectToSession = async () => {
    session.current = await ai.live.music.connect({
      model: model,
      callbacks: {
        onmessage: async (e: LiveMusicServerMessage) => {
          console.log('Received message from the server: %s\n', e);
          if (e.setupComplete) {
            setConnectionError(false);
          }
          if (e.filteredPrompt) {
            setFilteredPrompts(new Set([...filteredPrompts, e.filteredPrompt.text].filter((t): t is string => typeof t === 'string')));
            toastMessageRef.current?.show(e.filteredPrompt.filteredReason ?? 'Prompt filtered');
          }
          if (e.serverContent?.audioChunks !== undefined) {
            if (playbackState === 'paused' || playbackState === 'stopped') return;
            const audioBuffer = await decodeAudioData(decode(e.serverContent?.audioChunks[0].data ?? ""), audioContext.current, 48000, 2);
            const source = audioContext.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode.current);
            if (nextStartTime.current === 0) {
              nextStartTime.current = audioContext.current.currentTime + bufferTime;
              setTimeout(() => {
                setPlaybackState('playing');
              }, bufferTime * 1000);
            }

            if (nextStartTime.current < audioContext.current.currentTime) {
              console.log('under run');
              setPlaybackState('loading');
              nextStartTime.current = 0;
              return;
            }
            source.start(nextStartTime.current);
            nextStartTime.current += audioBuffer.duration;
          }
        },
        onerror: (e: ErrorEvent) => {
          console.log('Error occurred: %s\n', JSON.stringify(e));
          setConnectionError(true);
          stopAudio();
          toastMessageRef.current?.show('Connection error, please restart audio.');
        },
        onclose: () => {
          console.log('Connection closed.');
          setConnectionError(true);
          stopAudio();
          toastMessageRef.current?.show('Connection error, please restart audio.');
        },
      },
    });
  };

  const setSessionPrompts = throttle(async () => {
    const promptsToSend = Array.from(prompts.values()).filter((p) => {
      return !filteredPrompts.has(p.text) && p.weight !== 0;
    });
    try {
      await session.current?.setWeightedPrompts({
        weightedPrompts: promptsToSend,
      });
    } catch (e) {
      if (e instanceof Error) {
        toastMessageRef.current?.show(e.message);
      } else {
        toastMessageRef.current?.show(String(e));
      }
      pauseAudio();
    }
  }, 200);

  const handlePromptChanged = (promptId: string, text: string, weight: number) => {
    const prompt = prompts.get(promptId);

    if (!prompt) {
      console.error('prompt not found', promptId);
      return;
    }

    prompt.text = text;
    prompt.weight = weight;

    const newPrompts = new Map(prompts);
    newPrompts.set(promptId, prompt);

    setPrompts(newPrompts);

    setSessionPrompts();
  };

  const makeBackground = () => {
    const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

    const MAX_WEIGHT = 0.5;
    const MAX_ALPHA = 0.6;

    const bg: string[] = [];

    [...prompts.values()].forEach((p, i) => {
      const alphaPct = clamp01(p.weight / MAX_WEIGHT) * MAX_ALPHA;
      const alpha = Math.round(alphaPct * 0xff).toString(16).padStart(2, '0');

      const stop = p.weight / 2;
      const x = (i % 4) / 3;
      const y = Math.floor(i / 4) / 3;
      const s = `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${p.color}${alpha} 0px, ${p.color}00 ${stop * 100}%)`;

      bg.push(s);
    });

    return bg.join(', ');
  };

  const handlePlayPause = async () => {
    if (playbackState === 'playing') {
      pauseAudio();
    } else if (playbackState === 'paused' || playbackState === 'stopped') {
      if (connectionError) {
        await connectToSession();
        setSessionPrompts();
      }
      loadAudio();
    } else if (playbackState === 'loading') {
      stopAudio();
    }
    console.debug('handlePlayPause');
  };

  const pauseAudio = () => {
    session.current?.pause();
    setPlaybackState('paused');
    outputNode.current.gain.setValueAtTime(1, audioContext.current.currentTime);
    outputNode.current.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.1);
    nextStartTime.current = 0;
    outputNode.current = audioContext.current.createGain();
    outputNode.current.connect(audioContext.current.destination);
  };

  const loadAudio = () => {
    audioContext.current.resume();
    session.current?.play();
    setPlaybackState('loading');
    outputNode.current.gain.setValueAtTime(0, audioContext.current.currentTime);
    outputNode.current.gain.linearRampToValueAtTime(1, audioContext.current.currentTime + 0.1);
  };

  const stopAudio = () => {
    session.current?.stop();
    setPlaybackState('stopped');
    outputNode.current.gain.setValueAtTime(0, audioContext.current.currentTime);
    outputNode.current.gain.linearRampToValueAtTime(1, audioContext.current.currentTime + 0.1);
    nextStartTime.current = 0;
  };

  const handleAddPrompt = async () => {
    const newPromptId = `prompt-${nextPromptId.current++}`;
    const usedColors = [...prompts.values()].map((p) => p.color);
    const newPrompt: Prompt = {
      promptId: newPromptId,
      text: 'New Prompt', // Default text
      weight: 0,
      color: getUnusedRandomColor(usedColors),
    };
    const newPrompts = new Map(prompts);
    newPrompts.set(newPromptId, newPrompt);
    setPrompts(newPrompts);

    await setSessionPrompts();

    // Wait for the component to update and render the new prompt.
    // Do not dispatch the prompt change event until the user has edited the prompt text.
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Find the newly added prompt controller element
    const newPromptElement = document.querySelector<PromptController>(`[data-prompt-id="${newPromptId}"]`);
    if (newPromptElement) {
      // Scroll the prompts container to the new prompt element
      newPromptElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'end',
      });

      // Select the new prompt text
      const textSpan = newPromptElement.shadowRoot?.querySelector<HTMLSpanElement>('#text');
      if (textSpan) {
        textSpan.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(textSpan);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  const handlePromptRemoved = (promptIdToRemove: string) => {
    if (prompts.has(promptIdToRemove)) {
      prompts.delete(promptIdToRemove);
      const newPrompts = new Map(prompts);
      setPrompts(newPrompts);
      setSessionPrompts();
    } else {
      console.warn(`Attempted to remove non-existent prompt ID: ${promptIdToRemove}`);
    }
  };

  const handlePromptsContainerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (e.deltaX !== 0) {
      // Prevent the default browser action (like page back/forward)
      e.preventDefault();
      container.scrollLeft += e.deltaX;
    }
  };

  const updateSettings = throttle((config: LiveMusicGenerationConfig) => {
    session.current?.setMusicGenerationConfig({
      musicGenerationConfig: config,
    });
  }, 200);

  const handleReset = async () => {
    if (connectionError) {
      await connectToSession();
      setSessionPrompts();
    }
    pauseAudio();
    session.current?.resetContext();
    settingsControllerRef.current?.resetToDefaults();
    session.current?.setMusicGenerationConfig({
      musicGenerationConfig: {},
    });
    setTimeout(loadAudio, 100);
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box', padding: '2vmin', position: 'relative', fontSize: '1.8vmin' }}>
      <div id="background" style={{ position: 'absolute', height: '100%', width: '100%', zIndex: -1, background: '#111', backgroundImage: makeBackground() }}></div>
      <div className="prompts-area" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', flex: 4, width: '100%', marginTop: '2vmin', gap: '2vmin' }}>
        <div id="prompts-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', flexShrink: 1, height: '100%', gap: '2vmin', marginLeft: '10vmin', padding: '1vmin', overflowX: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#666 #1a1a1a' }} onWheel={handlePromptsContainerWheel}>
          {[...prompts.values()].map((prompt) => (
            <PromptController key={prompt.promptId} promptId={prompt.promptId} text={prompt.text} weight={prompt.weight} color={prompt.color} onPromptChanged={handlePromptChanged} onPromptRemoved={handlePromptRemoved} />
          ))}
        </div>
        <div className="add-prompt-button-container" style={{ display: 'flex', alignItems: 'flex-end', height: '100%', flexShrink: 0 }}>
          <AddPromptButton onClick={handleAddPrompt} />
        </div>
      </div>
      <div id="settings-container" style={{ flex: 1, margin: '2vmin 0 1vmin 0' }}>
        <SettingsController ref={settingsControllerRef} onSettingsChanged={updateSettings} />
      </div>
      <div className="playback-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
        <PlayPauseButton onClick={handlePlayPause} playbackState={playbackState} />
        <ResetButton onClick={handleReset} />
      </div>
      <ToastMessage ref={toastMessageRef} />
    </div>
  );
};
