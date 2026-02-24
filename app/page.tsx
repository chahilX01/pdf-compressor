'use client';

import { useState, useRef } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    ratio: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
        setCompressionStats(null);
      } else {
        setError('Please select a PDF file');
        setFile(null);
      }
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Compression failed');
      }

      const originalSize = parseInt(response.headers.get('X-Original-Size') || '0');
      const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || '0');
      const ratio = parseFloat(response.headers.get('X-Compression-Ratio') || '0');

      setCompressionStats({
        originalSize,
        compressedSize,
        ratio,
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compressed_${file.name}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCompressionStats(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>PDF Compressor</h1>
        <p className={styles.subtitle}>Compress your PDF files easily and quickly</p>

        <div className={styles.uploadArea}>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className={styles.fileInput}
            id="fileInput"
            ref={fileInputRef}
          />
          <label htmlFor="fileInput" className={styles.fileLabel}>
            <svg className={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className={styles.uploadText}>
              {file ? file.name : 'Choose a PDF file or drag it here'}
            </span>
          </label>
        </div>

        {file && (
          <div className={styles.fileInfo}>
            <p><strong>File:</strong> {file.name}</p>
            <p><strong>Size:</strong> {formatFileSize(file.size)}</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {compressionStats && (
          <div className={styles.stats}>
            <h3>Compression Results</h3>
            <div className={styles.statRow}>
              <span>Original Size:</span>
              <span>{formatFileSize(compressionStats.originalSize)}</span>
            </div>
            <div className={styles.statRow}>
              <span>Compressed Size:</span>
              <span>{formatFileSize(compressionStats.compressedSize)}</span>
            </div>
            <div className={styles.statRow}>
              <span>Compression:</span>
              <span className={styles.ratio}>{compressionStats.ratio}%</span>
            </div>
          </div>
        )}

        <div className={styles.buttons}>
          {file && !compressionStats && (
            <button 
              onClick={handleCompress} 
              disabled={isCompressing}
              className={styles.compressButton}
            >
              {isCompressing ? 'Compressing...' : 'Compress PDF'}
            </button>
          )}
          
          {(file || compressionStats) && (
            <button 
              onClick={handleReset}
              className={styles.resetButton}
            >
              Compress Another File
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
