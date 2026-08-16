/**
 * SupportMessageComposer.jsx
 *
 * Bottom input bar of the chat window.
 *
 * Features:
 *   - Text input (textarea, auto-grow)
 *   - File attach button (opens file picker)
 *   - Emoji picker (basic emoji set)
 *   - Send button (disabled when empty)
 *   - Typing indicator (emits on type, debounced)
 *   - Reply preview (when replying to a message — controlled by parent via prop)
 *
 * Disabled when conversation is ARCHIVED.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSend, FiPaperclip, FiSmile, FiX, FiLoader, FiImage, FiFile, FiMusic,
} from 'react-icons/fi';
import './SupportMessageComposer.scss';

const EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '✅', '😎', '🎉', '💯', '👋', '🤔', '😅', '💪', '🙌', '🚀', '⭐', '✨', '📞', '🏠'];

function SupportMessageComposer({ onSend, onUpload, onTyping, disabled, replyTo, onCancelReply }) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  // Cleanup typing on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (disabled) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping?.(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping?.(false);
    }, 1500);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // Validate size (25 MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File too large (max 25 MB)');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await onUpload(file);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && attachments.length === 0) || disabled) return;

    const payload = {
      text: text.trim() || null,
      replyToId: replyTo?.id || null,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    try {
      await onSend(payload);
      setText('');
      setAttachments([]);
      onCancelReply?.();
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTyping?.(false);
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="support-composer">
      {/* Reply preview */}
      {replyTo && (
        <div className="support-composer__reply-preview">
          <div className="support-composer__reply-bar" />
          <div className="support-composer__reply-content">
            <small>Replying to {replyTo.sender?.username}</small>
            <p>{replyTo.text || '[Attachment]'}</p>
          </div>
          <button onClick={onCancelReply} className="support-composer__reply-cancel">
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* Pending attachments preview */}
      {attachments.length > 0 && (
        <div className="support-composer__attachments">
          {attachments.map((att, idx) => (
            <div key={idx} className="support-composer__attachment-chip">
              {att.type === 'IMAGE' ? <FiImage size={14} /> :
               att.type === 'AUDIO' ? <FiMusic size={14} /> :
               <FiFile size={14} />}
              <span>{att.fileName}</span>
              <button onClick={() => removeAttachment(idx)}>
                <FiX size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="support-composer__bar">
        {/* Attach */}
        <button
          className="support-composer__btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          title="Attach file"
        >
          {uploading ? <FiLoader className="spin" size={18} /> : <FiPaperclip size={18} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,application/pdf,audio/*,video/*,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
        />

        {/* Emoji */}
        <button
          className="support-composer__btn"
          onClick={() => setShowEmoji(!showEmoji)}
          disabled={disabled}
          title="Emoji"
        >
          <FiSmile size={18} />
        </button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Conversation is archived' : 'Type a message...'}
          disabled={disabled}
          className="support-composer__textarea"
        />

        {/* Send */}
        <button
          className="support-composer__send"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && attachments.length === 0)}
          title="Send"
        >
          <FiSend size={18} />
        </button>
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="support-composer__emoji-picker">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => addEmoji(e)}>
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SupportMessageComposer;
