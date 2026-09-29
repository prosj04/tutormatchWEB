"use client";

type ImageLightboxProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  return (
    <div className="scrim on st-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="x" onClick={onClose} aria-label="닫기">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
