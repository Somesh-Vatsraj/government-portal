import { useState, useRef } from 'react';
import { api } from '../api/api.js';
import ImagePreview from './ImagePreview.jsx';

export default function ImageUploader({ value, onChange, onSelectExisting }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.type)) {
      setError('Only JPG, PNG, WEBP allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5 MB)');
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const result = await api.adminUploadMedia(file, '', setProgress);
      onChange(result.media);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="image-uploader">
      {value?.image_url ? (
        <ImagePreview
          media={value}
          onRemove={() => onChange(null)}
          onReplace={pick}
        />
      ) : (
        <button
          type="button"
          className="upload-dropzone"
          onClick={pick}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <span>Uploading… {progress}%</span>
              <div className="progress-bar"><div style={{ width: `${progress}%` }} /></div>
            </>
          ) : (
            <>
              <span className="upload-icon" aria-hidden="true">⬆</span>
              <strong>Upload Image</strong>
              <small>JPG, PNG or WEBP • Max 5 MB</small>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        hidden
        onChange={handleFile}
      />

      <div className="uploader-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onSelectExisting?.()}>
          Choose from Library
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
