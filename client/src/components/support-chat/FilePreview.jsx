import { memo, useCallback } from "react";
import {
  FiFile,
  FiImage,
  FiFileText,
  FiMusic,
  FiDownload,
  FiExternalLink,
  FiX,
} from "react-icons/fi";

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type) {
  switch (type) {
    case "image":
      return <FiImage size={20} />;
    case "pdf":
      return <FiFileText size={20} />;
    case "audio":
      return <FiMusic size={20} />;
    default:
      return <FiFile size={20} />;
  }
}

function getFileTypeFromUrl(url) {
  if (!url) return "document";
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i.test(lower)) return "image";
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i.test(lower)) return "audio";
  return "document";
}

// ── Upload preview item (shown in input bar before sending) ──────────────
export const UploadPreviewItem = memo(function UploadPreviewItem({
  file,
  onRemove,
}) {
  const isImage = file.type?.startsWith("image/");
  const previewUrl = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="sc-upload-preview__item">
      {isImage ? (
        <div className="sc-upload-preview__thumb">
          <img src={previewUrl} alt={file.name} loading="lazy" />
          <button
            type="button"
            className="sc-upload-preview__remove"
            onClick={() => {
              onRemove(file);
              URL.revokeObjectURL(previewUrl);
            }}
          >
            <FiX size={12} />
          </button>
        </div>
      ) : (
        <div className="sc-upload-preview__file">
          <span className="sc-upload-preview__icon">{getFileIcon(file.type?.split("/")[0])}</span>
          <div className="sc-upload-preview__info">
            <span className="sc-upload-preview__name">{file.name}</span>
            <span className="sc-upload-preview__size">{formatFileSize(file.size)}</span>
          </div>
          <button
            type="button"
            className="sc-upload-preview__remove"
            onClick={() => onRemove(file)}
          >
            <FiX size={14} />
          </button>
        </div>
      )}
    </div>
  );
});

// ── Upload preview bar ────────────────────────────────────────────────────
export function UploadPreviewBar({ files, onRemoveAll, onRemoveOne }) {
  if (!files || files.length === 0) return null;

  return (
    <div className="sc-upload-preview">
      <div className="sc-upload-preview__list">
        {files.map((file) => (
          <UploadPreviewItem
            key={`${file.name}-${file.lastModified}`}
            file={file}
            onRemove={onRemoveOne}
          />
        ))}
      </div>
      <button
        type="button"
        className="sc-upload-preview__clear-all"
        onClick={onRemoveAll}
      >
        <FiX size={12} /> Clear all
      </button>
    </div>
  );
}

// ── Inline message attachment ──────────────────────────────────────────────
export const MessageAttachment = memo(function MessageAttachment({
  attachment,
  isOwn,
  onImageClick,
}) {
  const fileUrl = attachment?.url || attachment?.fileUrl;
  const fileName = attachment?.name || attachment?.fileName || "File";
  const fileSize = attachment?.size || attachment?.fileSize;
  const mimeType = attachment?.mimeType || attachment?.type || "";
  const fileType =
    attachment?.fileType || getFileTypeFromUrl(fileUrl);
  const thumbnail = attachment?.thumbnail || attachment?.thumbUrl;

  const handleClick = useCallback(() => {
    if (!fileUrl) return;
    if (fileType === "image" && onImageClick) {
      onImageClick(fileUrl);
    } else if (fileType === "pdf") {
      window.open(fileUrl, "_blank", "noopener");
    } else {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [fileUrl, fileType, fileName, onImageClick]);

  if (!attachment) return null;

  // Image attachment
  if (fileType === "image") {
    return (
      <div className={`sc-attachment sc-attachment--image${isOwn ? " sc-attachment--own" : ""}`}>
        <div className="sc-attachment__image" onClick={handleClick}>
          <img
            src={thumbnail || fileUrl}
            alt={fileName}
            loading="lazy"
            onError={(e) => {
              e.target.src = fileUrl;
              e.target.onerror = null;
            }}
          />
          {thumbnail && thumbnail !== fileUrl && (
            <div className="sc-attachment__overlay">
              <FiImage size={20} />
            </div>
          )}
        </div>
        {fileName && (
          <span className="sc-attachment__filename">{fileName}</span>
        )}
      </div>
    );
  }

  // Audio attachment
  if (fileType === "audio") {
    return (
      <div className={`sc-attachment sc-attachment--audio${isOwn ? " sc-attachment--own" : ""}`}>
        <div className="sc-attachment__audio-waveform">
          <FiMusic size={16} />
          <div className="sc-attachment__audio-bars">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="sc-attachment__audio-bar"
                style={{
                  height: `${Math.max(4, Math.random() * 28)}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        </div>
        {fileUrl && (
          <audio controls preload="metadata" className="sc-attachment__player">
            <source src={fileUrl} type={mimeType || "audio/mpeg"} />
          </audio>
        )}
      </div>
    );
  }

  // PDF / Document attachment
  const isPdf = fileType === "pdf";

  return (
    <div
      className={`sc-attachment sc-attachment--doc${isOwn ? " sc-attachment--own" : ""}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className={`sc-attachment__doc-icon${isPdf ? " sc-attachment__doc-icon--pdf" : ""}`}>
        {getFileIcon(fileType)}
        <span className="sc-attachment__doc-ext">{isPdf ? "PDF" : "DOC"}</span>
      </div>
      <div className="sc-attachment__doc-info">
        <span className="sc-attachment__doc-name">{fileName}</span>
        {fileSize && (
          <span className="sc-attachment__doc-size">{formatFileSize(fileSize)}</span>
        )}
      </div>
      <span className="sc-attachment__doc-action">
        {isPdf ? <FiExternalLink size={14} /> : <FiDownload size={14} />}
      </span>
    </div>
  );
});
