'use client';

import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import styles from './page.module.css';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    clientCompressedSize: number;
    finalCompressedSize: number;
    ratio: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compressionStage, setCompressionStage] = useState<string>('');
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

  const compressClientSide = async (file: File): Promise<Blob> => {
    setCompressionStage('Client-side compression...');
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
    });

    // Remove metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');

    // Save with compression
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    return new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' });
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setError(null);
    const originalSize = file.size;

    try {
      // Step 1: Client-side compression
      const clientCompressed = await compressClientSide(file);
      const clientCompressedSize = clientCompressed.size;
      
      // Check if client-compressed file is under 4MB for Vercel free tier
      if (clientCompressedSize > 4 * 1024 * 1024) {
        setError(`File is too large (${formatFileSize(clientCompressedSize)} after compression). Please use a smaller PDF or upgrade to Vercel Pro.`);
        setIsCompressing(false);
        return;
      }

      // Step 2: Server-side optimization
      setCompressionStage('Server-side optimization...');
      const formData = new FormData();
      formData.append('file', clientCompressed, 'compressed.pdf');

      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Compression failed');
      }

      const finalCompressedSize = parseInt(response.headers.get('X-Compressed-Size') || '0');
      const totalRatio = ((1 - finalCompressedSize / originalSize) * 100).toFixed(2);

      setCompressionStats({
        originalSize,
        clientCompressedSize,
        finalCompressedSize,
        ratio: parseFloat(totalRatio),
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
      setCompressionStage('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setCompressionStats(null);
    setError(null);
    setCompressionStage('');
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

        {isCompressing && compressionStage && (
          <div className={styles.progress}>
            <div className={styles.spinner}></div>
            <p>{compressionStage}</p>
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
              <span>Client Compressed:</span>
              <span>{formatFileSize(compressionStats.clientCompressedSize)}</span>
            </div>
            <div className={styles.statRow}>
              <span>Final Size:</span>
              <span>{formatFileSize(compressionStats.finalCompressedSize)}</span>
            </div>
            <div className={styles.statRow}>
              <span>Total Compression:</span>
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
