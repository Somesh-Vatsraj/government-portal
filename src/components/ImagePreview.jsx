export default function ImagePreview({ media, onRemove, onReplace }) {
  if (!media) return null;
  return (
    <div className="image-preview">
      <img src={media.image_url} alt={media.alt_text || media.file_name} loading="lazy" />
      <div className="image-preview-meta">
        <span>{media.file_name}</span>
        {media.width && <span>{media.width}×{media.height}</span>}
        {media.file_size && <span>{(media.file_size / 1024).toFixed(0)} KB</span>}
      </div>
      <div className="image-preview-actions">
        {onReplace && <button type="button" className="btn btn-ghost btn-sm" onClick={onReplace}>Replace</button>}
        {onRemove && <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>}
      </div>
    </div>
  );
}
