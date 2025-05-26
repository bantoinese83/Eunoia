import React, { useState, useRef, useEffect } from 'react';

interface Prompt {
  readonly promptId: string;
  readonly color: string;
  text: string;
  weight: number;
}

interface PromptControllerProps {
  promptId: string;
  text: string;
  weight: number;
  color: string;
  onPromptChanged: (promptId: string, text: string, weight: number) => void;
  onPromptRemoved: (promptId: string) => void;
}

export const PromptController: React.FC<PromptControllerProps> = ({
  promptId,
  text,
  weight,
  color,
  onPromptChanged,
  onPromptRemoved,
}) => {
  const [currentText, setCurrentText] = useState(text);
  const [currentWeight, setCurrentWeight] = useState(weight);
  const textInputRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setCurrentText(text);
  }, [text]);

  useEffect(() => {
    setCurrentWeight(weight);
  }, [weight]);

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateText();
      (e.target as HTMLElement).blur();
    }
  };

  const updateText = () => {
    const newText = textInputRef.current?.textContent?.trim();
    if (newText === '') {
      textInputRef.current!.textContent = currentText;
      return;
    }
    setCurrentText(newText ?? '');
    onPromptChanged(promptId, newText ?? '', currentWeight);
  };

  const updateWeight = (newWeight: number) => {
    setCurrentWeight(newWeight);
    onPromptChanged(promptId, currentText, newWeight);
  };

  const handleRemovePrompt = () => {
    onPromptRemoved(promptId);
  };

  return (
    <div className="prompt" style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box', overflow: 'hidden', backgroundColor: '#2a2a2a', borderRadius: '5px' }}>
      <button className="remove-button" onClick={handleRemovePrompt} style={{ position: 'absolute', top: '1.2vmin', left: '1.2vmin', background: '#666', color: '#fff', border: 'none', borderRadius: '50%', width: '2.8vmin', height: '2.8vmin', fontSize: '1.8vmin', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '2.8vmin', cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.2s', zIndex: 10 }}>×</button>
      <div className="weight-slider" style={{ maxHeight: 'calc(100% - 9vmin)', flex: 1, minHeight: '10vmin', width: '100%', boxSizing: 'border-box', overflow: 'hidden', margin: '2vmin 0 1vmin' }}>
        <input type="range" min="0" max="2" step="0.01" value={currentWeight} onChange={(e) => updateWeight(parseFloat(e.target.value))} style={{ width: '100%', height: '100%', background: color }} />
      </div>
      <div className="controls" style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, alignItems: 'center', gap: '0.2vmin', width: '100%', height: '8vmin', padding: '0 0.5vmin', boxSizing: 'border-box', marginBottom: '1vmin' }}>
        <span id="text" ref={textInputRef} spellCheck="false" contentEditable="plaintext-only" onKeyDown={handleTextKeyDown} onBlur={updateText} style={{ fontFamily: 'Google Sans, sans-serif', fontSize: '1.8vmin', width: '100%', flexGrow: 1, maxHeight: '100%', padding: '0.4vmin', boxSizing: 'border-box', textAlign: 'center', wordWrap: 'break-word', overflowY: 'auto', border: 'none', outline: 'none', WebkitFontSmoothing: 'antialiased', color: '#fff', scrollbarWidth: 'thin', scrollbarColor: '#666 #1a1a1a' }}>{currentText}</span>
      </div>
    </div>
  );
};
