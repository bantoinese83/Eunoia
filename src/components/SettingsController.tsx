import React, { useState, useEffect } from 'react';
import { LiveMusicGenerationConfig } from '@google/genai';

interface SettingsControllerProps {
  onSettingsChanged: (config: LiveMusicGenerationConfig) => void;
}

const defaultConfig: LiveMusicGenerationConfig = {
  temperature: 1.1,
  topK: 40,
  guidance: 4.0,
};

export const SettingsController: React.FC<SettingsControllerProps> = ({ onSettingsChanged }) => {
  const [config, setConfig] = useState<LiveMusicGenerationConfig>(defaultConfig);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoDensity, setAutoDensity] = useState(true);
  const [lastDefinedDensity, setLastDefinedDensity] = useState<number | undefined>(0.5);
  const [autoBrightness, setAutoBrightness] = useState(true);
  const [lastDefinedBrightness, setLastDefinedBrightness] = useState<number | undefined>(0.5);

  useEffect(() => {
    const sliders = document.querySelectorAll<HTMLInputElement>('input[type="range"]');
    sliders.forEach((slider) => {
      const configValue = config[slider.id as keyof LiveMusicGenerationConfig];
      if (typeof configValue === 'number') {
        slider.value = String(configValue);
      } else if (slider.id === 'density' || slider.id === 'brightness') {
        slider.value = String(configValue ?? 0.5);
      }
      updateSliderBackground(slider);
    });
  }, [config]);

  const resetToDefaults = () => {
    setConfig(defaultConfig);
    setAutoDensity(true);
    setLastDefinedDensity(0.5);
    setAutoBrightness(true);
    setLastDefinedBrightness(0.5);
    dispatchSettingsChange();
  };

  const updateSliderBackground = (inputEl: HTMLInputElement) => {
    if (inputEl.type !== 'range') {
      return;
    }
    const min = Number(inputEl.min) || 0;
    const max = Number(inputEl.max) || 100;
    const value = Number(inputEl.value);
    const percentage = ((value - min) / (max - min)) * 100;
    inputEl.style.setProperty('--value-percent', `${percentage}%`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const key = target.id as keyof LiveMusicGenerationConfig | 'auto-density' | 'auto-brightness';
    let value: string | number | boolean | undefined = target.value;

    if (target instanceof HTMLInputElement && (target.type === 'number' || target.type === 'range')) {
      value = target.value === '' ? undefined : Number(target.value);
      if (target.type === 'range') {
        updateSliderBackground(target);
      }
    } else if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      value = target.checked;
    } else if (target instanceof HTMLSelectElement) {
      if (target.options[target.selectedIndex]?.disabled) {
        value = undefined;
      } else {
        value = target.value;
      }
    }

    const newConfig = {
      ...config,
      [key]: value,
    };

    if (newConfig.density !== undefined) {
      setLastDefinedDensity(newConfig.density);
    }

    if (newConfig.brightness !== undefined) {
      setLastDefinedBrightness(newConfig.brightness);
    }

    if (key === 'auto-density') {
      setAutoDensity(Boolean(value));
      newConfig.density = autoDensity ? undefined : lastDefinedDensity;
    } else if (key === 'auto-brightness') {
      setAutoBrightness(Boolean(value));
      newConfig.brightness = autoBrightness ? undefined : lastDefinedBrightness;
    }

    setConfig(newConfig);
    dispatchSettingsChange();
  };

  const dispatchSettingsChange = () => {
    onSettingsChanged(config);
  };

  const toggleAdvancedSettings = () => {
    setShowAdvanced(!showAdvanced);
  };

  const scaleMap = new Map<string, string>([
    ['Auto', 'SCALE_UNSPECIFIED'],
    ['C Major / A Minor', 'C_MAJOR_A_MINOR'],
    ['C# Major / A# Minor', 'D_FLAT_MAJOR_B_FLAT_MINOR'],
    ['D Major / B Minor', 'D_MAJOR_B_MINOR'],
    ['D# Major / C Minor', 'E_FLAT_MAJOR_C_MINOR'],
    ['E Major / C# Minor', 'E_MAJOR_D_FLAT_MINOR'],
    ['F Major / D Minor', 'F_MAJOR_D_MINOR'],
    ['F# Major / D# Minor', 'G_FLAT_MAJOR_E_FLAT_MINOR'],
    ['G Major / E Minor', 'G_MAJOR_E_MINOR'],
    ['G# Major / F Minor', 'A_FLAT_MAJOR_F_MINOR'],
    ['A Major / F# Minor', 'A_MAJOR_G_FLAT_MINOR'],
    ['A# Major / G Minor', 'B_FLAT_MAJOR_G_MINOR'],
    ['B Major / G# Minor', 'B_MAJOR_A_FLAT_MINOR'],
  ]);

  return (
    <div style={{ display: 'block', padding: '2vmin', backgroundColor: '#2a2a2a', color: '#eee', boxSizing: 'border-box', borderRadius: '5px', fontFamily: 'Google Sans, sans-serif', fontSize: '1.5vmin', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#666 #1a1a1a', transition: 'width 0.3s ease-out max-height 0.3s ease-out' }}>
      <div className="core-settings-row" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4vmin', marginBottom: '1vmin', justifyContent: 'space-evenly' }}>
        <div className="setting" style={{ minWidth: '16vmin' }}>
          <label htmlFor="temperature" style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none' }}>
            Temperature<span>{config.temperature!.toFixed(1)}</span>
          </label>
          <input type="range" id="temperature" min="0" max="3" step="0.1" value={config.temperature!.toString()} onChange={handleInputChange} style={{ width: '100%', height: 'var(--track-height)', cursor: 'pointer', border: 'none', background: 'transparent', margin: '0.5vmin 0', padding: '0', verticalAlign: 'middle' }} />
        </div>
        <div className="setting" style={{ minWidth: '16vmin' }}>
          <label htmlFor="guidance" style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none' }}>
            Guidance<span>{config.guidance!.toFixed(1)}</span>
          </label>
          <input type="range" id="guidance" min="0" max="6" step="0.1" value={config.guidance!.toString()} onChange={handleInputChange} style={{ width: '100%', height: 'var(--track-height)', cursor: 'pointer', border: 'none', background: 'transparent', margin: '0.5vmin 0', padding: '0', verticalAlign: 'middle' }} />
        </div>
        <div className="setting" style={{ minWidth: '16vmin' }}>
          <label htmlFor="topK" style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none' }}>
            Top K<span>{config.topK}</span>
          </label>
          <input type="range" id="topK" min="1" max="100" step="1" value={config.topK!.toString()} onChange={handleInputChange} style={{ width: '100%', height: 'var(--track-height)', cursor: 'pointer', border: 'none', background: 'transparent', margin: '0.5vmin 0', padding: '0', verticalAlign: 'middle' }} />
        </div>
      </div>
      <hr className="divider" style={{ display: showAdvanced ? 'block' : 'none', border: 'none', borderTop: '1px solid #666', margin: '2vmin 0', width: '100%' }} />
      <div className={`advanced-settings ${showAdvanced ? 'visible' : ''}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10vmin, 1fr))', gap: '3vmin', overflow: 'hidden', maxHeight: showAdvanced ? '40vmin' : '0', opacity: showAdvanced ? 1 : 0, transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out' }}>
        <div className="setting" style={{ minWidth: '16vmin' }}>
          <label htmlFor="seed" style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none' }}>
            Seed
          </label>
          <input type="number" id="seed" value={config.seed ?? ''} onChange={handleInputChange} placeholder="Auto" style={{ backgroundColor: '#2a2a2a', color: '#eee', border: '1px solid #666', borderRadius: '3px', padding: '0.4vmin', fontSize: '1.5vmin', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' }} />
        </div>
        <div className="setting" style={{ minWidth: '16vmin' }}>
          <label htmlFor="bpm" style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none' }}>
            BPM
          </label>
          <input type="number" id="bpm" min="60" max="180" value={config.bpm ?? ''} onChange={handleInputChange} placeholder="Auto" style={{ backgroundColor: '#2a2a2a', color: '#eee', border: '1px solid #666', borderRadius: '3px', padding: '0.4vmin', fontSize: '1.5vmin', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' }} />
        </div>
        <div className="setting" style={{ minWidth: '16vmin' }} data-auto={autoDensity}>
          <label htmlFor="density" style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none' }}>
            Density
          </label>
          <input type="range" id="density" min="0" max="1" step="0.05" value={lastDefinedDensity?.toString() ?? '0.5'} onChange={handleInputChange} style={{ width: '100%', height: 'var(--track-height)', cursor: 'pointer', border: 'none', background: 'transparent', margin: '0.5vmin 0', padding: '0', verticalAlign: 'middle', pointerEvents: autoDensity ? 'none' : 'auto', filter: autoDensity ? 'grayscale(100%)' : 'none' }} />
          <div className="auto-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5vmin' }}>
            <input type="checkbox" id="auto-density" checked={autoDensity} onChange={handleInputChange} style={{ cursor: 'pointer', margin: 0 }} />
            <label htmlFor="auto-density" style={{ cursor: 'pointer', fontWeight: 'normal' }}>Auto</label>
            <span style={{ marginLeft: 'auto' }}>{(lastDefinedDensity ?? 0.5).toFixed(2)}</span>
          </div>
        </div>
        <div className="setting" style={{ minWidth: '16vmin' }} data-auto={autoBrightness}>
          <label htmlFor="brightness" style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none' }}>
            Brightness
          </label>
          <input type="range" id="brightness" min="0" max="1" step="0.05" value={lastDefinedBrightness?.toString() ?? '0.5'} onChange={handleInputChange} style={{ width: '100%', height: 'var(--track-height)', cursor: 'pointer', border: 'none', background: 'transparent', margin: '0.5vmin 0', padding: '0', verticalAlign: 'middle', pointerEvents: autoBrightness ? 'none' : 'auto', filter: autoBrightness ? 'grayscale(100%)' : 'none' }} />
          <div className="auto-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5vmin' }}>
            <input type="checkbox" id="auto-brightness" checked={autoBrightness} onChange={handleInputChange} style={{ cursor: 'pointer', margin: 0 }} />
            <label htmlFor="auto-brightness" style={{ cursor: 'pointer', fontWeight: 'normal' }}>Auto</label>
            <span style={{ marginLeft: 'auto' }}>{(lastDefinedBrightness ?? 0.5).toFixed(2)}</span>
          </div>
        </div>
        <div className="setting" style={{ minWidth: '16vmin' }}>
          <label htmlFor="scale" style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none' }}>
            Scale
          </label>
          <select id="scale" value={config.scale || 'SCALE_UNSPECIFIED'} onChange={handleInputChange} style={{ backgroundColor: '#2a2a2a', color: '#eee', border: '1px solid #666', borderRadius: '3px', padding: '0.4vmin', fontSize: '1.5vmin', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' }}>
            <option value="" disabled selected>Select Scale</option>
            {[...scaleMap.entries()].map(([displayName, enumValue]) => (
              <option key={enumValue} value={enumValue}>{displayName}</option>
            ))}
          </select>
        </div>
        <div className="setting" style={{ minWidth: '16vmin' }}>
          <div className="setting checkbox-setting" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1vmin' }}>
            <input type="checkbox" id="muteBass" checked={!!config.muteBass} onChange={handleInputChange} style={{ cursor: 'pointer', accentColor: '#5200ff' }} />
            <label htmlFor="muteBass" style={{ fontWeight: 'normal' }}>Mute Bass</label>
          </div>
          <div className="setting checkbox-setting" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1vmin' }}>
            <input type="checkbox" id="muteDrums" checked={!!config.muteDrums} onChange={handleInputChange} style={{ cursor: 'pointer', accentColor: '#5200ff' }} />
            <label htmlFor="muteDrums" style={{ fontWeight: 'normal' }}>Mute Drums</label>
          </div>
          <div className="setting checkbox-setting" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1vmin' }}>
            <input type="checkbox" id="onlyBassAndDrums" checked={!!config.onlyBassAndDrums} onChange={handleInputChange} style={{ cursor: 'pointer', accentColor: '#5200ff' }} />
            <label htmlFor="onlyBassAndDrums" style={{ fontWeight: 'normal' }}>Only Bass & Drums</label>
          </div>
        </div>
      </div>
      <div className="advanced-toggle" onClick={toggleAdvancedSettings} style={{ cursor: 'pointer', margin: '2vmin 0 1vmin 0', color: '#aaa', textDecoration: 'underline', userSelect: 'none', fontSize: '1.4vmin', width: 'fit-content' }}>
        {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
      </div>
    </div>
  );
};
