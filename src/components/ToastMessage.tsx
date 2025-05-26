import React, { useState } from 'react';

interface ToastMessageProps {
  message: string;
  showing: boolean;
  onClose: () => void;
}

export const ToastMessage: React.FC<ToastMessageProps> = ({ message, showing, onClose }) => {
  return (
    <div className={`toast ${showing ? 'showing' : ''}`} style={{ lineHeight: '1.6', position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#000', color: 'white', padding: '15px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', minWidth: '200px', maxWidth: '80vw', transition: 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)', zIndex: 11 }}>
      <div className="message">{message}</div>
      <button onClick={onClose} style={{ borderRadius: '100px', aspectRatio: '1', border: 'none', color: '#000', cursor: 'pointer' }}>✕</button>
    </div>
  );
};

export const useToastMessage = () => {
  const [message, setMessage] = useState('');
  const [showing, setShowing] = useState(false);

  const show = (newMessage: string) => {
    setMessage(newMessage);
    setShowing(true);
  };

  const hide = () => {
    setShowing(false);
  };

  return { message, showing, show, hide };
};
