import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { FiSearch, FiX } from "react-icons/fi";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    icon: "😊",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃",
      "😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙",
      "🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢",
      "🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏",
      "😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷",
      "🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠",
    ],
  },
  {
    name: "Gestures",
    icon: "👋",
    emojis: [
      "👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌",
      "🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉",
      "👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛",
      "🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅",
      "🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠",
    ],
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
      "❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝",
      "💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️",
      "⭐","🌟","✨","💫","🌠","🎉","🎊","🎈","🎀","🎁",
    ],
  },
  {
    name: "Objects",
    icon: "🏠",
    emojis: [
      "🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪",
      "🏫","🏬","🏭","🏗️","⬛","⬜","🔴","🟠","🟡","🟢",
      "🔵","🟣","🟤","♻️","🔰","✅","❌","❓","❗","〰️",
      "💬","💭","🗯️","📬","📫","📦","📋","📄","📅","📆",
      "📌","📎","✂️","📏","📐","✏️","🖊️","🖋️","📝","💻",
      "📱","☎️","📞","🔋","💡","🔑","🔒","🔓","💰","💳",
    ],
  },
];

export default function EmojiPicker({ onSelect, onClose, position = "top" }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const pickerRef = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Use mousedown for immediate response, important for mobile
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  // Focus search on mount
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  // All emojis flat list for search
  const allEmojis = useMemo(() => {
    return EMOJI_CATEGORIES.flatMap((cat) => cat.emojis);
  }, []);

  const filteredEmojis = useMemo(() => {
    if (!searchTerm.trim()) return null; // null means use category view
    return allEmojis.filter((e) => e.includes(searchTerm));
  }, [searchTerm, allEmojis]);

  const handleSelect = useCallback(
    (emoji) => {
      onSelect(emoji);
      // Don't close on selection so user can pick multiple emojis
    },
    [onSelect]
  );

  return (
    <div
      ref={pickerRef}
      className={`sc-emoji-picker sc-emoji-picker--${position}`}
    >
      {/* Header with search */}
      <div className="sc-emoji-picker__header">
        <div className="sc-emoji-picker__search">
          <FiSearch size={14} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search emoji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="sc-emoji-picker__clear"
            >
              <FiX size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs (hide during search) */}
      {!searchTerm && (
        <div className="sc-emoji-picker__categories">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              type="button"
              className={`sc-emoji-picker__tab${activeCategory === idx ? " sc-emoji-picker__tab--active" : ""}`}
              onClick={() => setActiveCategory(idx)}
              title={cat.name}
            >
              <span>{cat.icon}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="sc-emoji-picker__grid">
        {searchTerm ? (
          // Search results
          filteredEmojis.length > 0 ? (
            filteredEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="sc-emoji-picker__emoji"
                onClick={() => handleSelect(emoji)}
              >
                {emoji}
              </button>
            ))
          ) : (
            <div className="sc-emoji-picker__empty">No emojis found</div>
          )
        ) : (
          // Category emojis
          EMOJI_CATEGORIES[activeCategory]?.emojis.map((emoji) => (
            <button
              key={`${activeCategory}-${emoji}`}
              type="button"
              className="sc-emoji-picker__emoji"
              onClick={() => handleSelect(emoji)}
            >
              {emoji}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
