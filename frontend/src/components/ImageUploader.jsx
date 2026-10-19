import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, ArrowRight, Loader2 } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
const MAX_SIZE_MB = 15;

export default function ImageUploader({
  selectedFile,
  previewUrl,
  onSelectFile,
  onReset,
  onPredict,
  isPredicting,
  disabled,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndHandle = (file) => {
    setDragError(null);
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setDragError('Please upload a valid image file (JPEG, PNG, WEBP, or BMP).');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setDragError(`Image size exceeds maximum limit of ${MAX_SIZE_MB}MB.`);
      return;
    }

    onSelectFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandle(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandle(e.target.files[0]);
    }
  };

  const cardStyle = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: 'var(--shadow-md)',
  };

  const dropzoneBaseStyle = {
    border: '2px dashed',
    borderRadius: '14px',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '280px',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  };

  const dropzoneNormal = {
    ...dropzoneBaseStyle,
    borderColor: 'var(--border-strong)',
    backgroundColor: 'var(--bg-surface-sunken)',
  };

  const dropzoneActive = {
    ...dropzoneBaseStyle,
    borderColor: 'var(--accent-lime)',
    backgroundColor: 'var(--accent-lime-subtle)',
    transform: 'scale(0.995)',
  };

  return (
    <div style={cardStyle} className="animate-fade-in-up">
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
            }}
          >
            <ImageIcon size={18} style={{ color: 'var(--accent-coral)' }} />
            Upload Food Photo
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
            JPG, PNG, WEBP, BMP — up to 15 MB
          </p>
        </div>

        {selectedFile && (
          <button
            onClick={onReset}
            disabled={isPredicting}
            aria-label="Clear selected image"
            className="focus-ring"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid transparent',
              backgroundColor: 'transparent',
              cursor: isPredicting ? 'not-allowed' : 'pointer',
              opacity: isPredicting ? 0.5 : 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isPredicting) {
                e.currentTarget.style.color = 'var(--status-error)';
                e.currentTarget.style.backgroundColor = 'var(--status-error-bg)';
                e.currentTarget.style.borderColor = 'var(--nutrition-calories-border)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Drag error */}
      {dragError && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'var(--status-error-bg)',
            border: '1px solid var(--nutrition-calories-border)',
            color: 'var(--status-error)',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {dragError}
        </div>
      )}

      {!previewUrl ? (
        /* Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          style={isDragging ? dropzoneActive : dropzoneNormal}
          onMouseEnter={(e) => {
            if (!isDragging && !disabled) {
              e.currentTarget.style.borderColor = 'var(--border-focus)';
              e.currentTarget.style.backgroundColor = 'var(--accent-lime-subtle)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-sunken)';
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload a food image"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'var(--accent-lime-subtle)',
              border: '1px solid var(--accent-lime)',
              borderColor: isDragging ? 'var(--accent-lime)' : 'var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              transition: 'all 0.2s ease',
            }}
          >
            <UploadCloud size={24} style={{ color: isDragging ? 'var(--accent-forest)' : 'var(--text-tertiary)' }} />
          </div>

          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Drag & drop your food image here
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>
            or{' '}
            <span
              style={{
                color: 'var(--accent-coral)',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              browse files
            </span>
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', maxWidth: '320px' }}>
            For best results, ensure good lighting and center the food in frame
          </p>
        </div>
      ) : (
        /* Image Preview + Actions */
        <div>
          <div
            style={{
              position: 'relative',
              borderRadius: '14px',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-surface-sunken)',
              border: '1px solid var(--border-default)',
              aspectRatio: '16/10',
              maxHeight: '360px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={previewUrl}
              alt="Selected food preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />

            {/* Analysis overlay */}
            {isPredicting && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}
                className="animate-fade-in"
              >
                {/* Scan line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '10%',
                    right: '10%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, var(--accent-lime), transparent)',
                    animation: 'scan-line 2.5s ease-in-out infinite',
                    boxShadow: '0 0 16px var(--accent-lime)',
                  }}
                />
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '3px solid rgba(199,244,100,0.2)',
                    borderTopColor: 'var(--accent-lime)',
                    animation: 'spin-slow 1s linear infinite',
                  }}
                />
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                  Analysing your plate...
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  Running food classification & nutrition estimation
                </p>
              </div>
            )}
          </div>

          {/* File metadata */}
          {selectedFile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 4px',
                fontSize: '13px',
              }}
            >
              <span
                style={{
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '240px',
                }}
              >
                {selectedFile.name}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
                {formatBytes(selectedFile.size)}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '4px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isPredicting}
              className="focus-ring"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface-sunken)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: isPredicting ? 'not-allowed' : 'pointer',
                opacity: isPredicting ? 0.5 : 1,
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!isPredicting) {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Change Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              aria-hidden="true"
            />

            <button
              onClick={onPredict}
              disabled={isPredicting || disabled}
              id="analyze-button"
              className="focus-ring"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--accent-lime)',
                border: 'none',
                color: 'var(--accent-lime-text)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isPredicting || disabled ? 'not-allowed' : 'pointer',
                opacity: isPredicting || disabled ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                boxShadow: isPredicting || disabled ? 'none' : '0 2px 12px rgba(199,244,100,0.25)',
              }}
              onMouseEnter={(e) => {
                if (!isPredicting && !disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-lime-hover)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(199,244,100,0.35)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-lime)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isPredicting || disabled ? 'none' : '0 2px 12px rgba(199,244,100,0.25)';
              }}
            >
              {isPredicting ? (
                <>
                  <Loader2 size={15} style={{ animation: 'spin-slow 1s linear infinite' }} />
                  <span>Analysing...</span>
                </>
              ) : (
                <>
                  <span>Analyse Food</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
