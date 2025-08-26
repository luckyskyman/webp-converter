"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Loader2, Download, RefreshCw, CheckCircle2, XCircle, Archive, Settings } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';

interface ProcessedFile {
  id: string;
  originalFile: File;
  convertedFile: File | null;
  originalUrl: string;
  convertedUrl: string | null;
  status: 'pending' | 'converting' | 'done' | 'error';
  error?: string;
}

export default function Home() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [quality, setQuality] = useState(80);
  const [maxDimension, setMaxDimension] = useState(1920);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const newFiles: ProcessedFile[] = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: `${file.name}-${file.lastModified}`,
        originalFile: file,
        convertedFile: null,
        originalUrl: URL.createObjectURL(file),
        convertedUrl: null,
        status: 'pending',
      }));
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const processFiles = useCallback(async () => {
    const filesToProcess = files.filter(f => f.status === 'pending');
    if (filesToProcess.length === 0) return;

    setIsProcessing(true);

    const conversionPromises = filesToProcess.map(async (file) => {
      try {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'converting' } : f));
        const options = { maxSizeMB: 2, maxWidthOrHeight: maxDimension, useWebWorker: true, mimeType: 'image/webp', initialQuality: quality / 100 };
        const compressedBlob = await imageCompression(file.originalFile, options);
        const newFileName = file.originalFile.name.split('.').slice(0, -1).join('.') + '.webp';
        const convertedFile = new File([compressedBlob], newFileName, { type: 'image/webp' });
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'done', convertedFile: convertedFile, convertedUrl: URL.createObjectURL(convertedFile) } : f));
      } catch (e) {
        console.error(e);
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', error: '변환 실패' } : f));
      }
    });

    await Promise.all(conversionPromises);
    setIsProcessing(false);
  }, [files, quality, maxDimension]);

  useEffect(() => {
    if (files.length > 0 && files.some(f => f.status === 'pending')) {
      processFiles();
    }
  }, [files, processFiles]);

  const handleDownload = (file: ProcessedFile) => {
    if (!file.convertedUrl || !file.convertedFile) return;
    const a = document.createElement('a');
    a.href = file.convertedUrl;
    a.download = file.convertedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleZipDownload = async () => {
    const convertedFiles = files.filter(f => f.status === 'done' && f.convertedFile);
    if (convertedFiles.length === 0) return;
    setIsZipping(true);
    const zip = new JSZip();
    convertedFiles.forEach(file => zip.file(file.convertedFile!.name, file.convertedFile!));
    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `webp_converted_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) { console.error(e); } finally { setIsZipping(false); }
  };

  const handleReConvert = () => {
    setFiles(prev => prev.map(f => ({ ...f, status: 'pending', convertedFile: null, convertedUrl: f.convertedUrl ? URL.revokeObjectURL(f.convertedUrl) as any : null })))
  }

  const handleReset = () => {
    files.forEach(file => {
      if (file.originalUrl) URL.revokeObjectURL(file.originalUrl);
      if (file.convertedUrl) URL.revokeObjectURL(file.convertedUrl);
    });
    setFiles([]);
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => event.preventDefault(), []);
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); handleFileSelect(event.dataTransfer.files); }, []);
  const handleButtonClick = () => fileInputRef.current?.click();

  const hasConvertedFiles = files.some(f => f.status === 'done');
  const isDone = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error');

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 sm:p-6 md:p-8 pt-16 sm:pt-24">
      <main className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">WebP 일괄 변환기</h1>
          <p className="text-lg sm:text-xl text-gray-400">여러 이미지를 한 번에 WebP로 변환하세요.</p>
        </header>

        {files.length === 0 ? (
          <div className="w-full bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800/70 transition-colors duration-300" onDragOver={handleDragOver} onDrop={handleDrop}>
            <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files)} className="hidden" accept="image/*" multiple />
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Upload className="w-16 h-16 mb-4 text-gray-500" />
              <h2 className="text-2xl font-semibold mb-2">이미지를 여기에 드래그 앤 드롭하세요</h2>
              <p className="text-gray-500">또는</p>
              <button onClick={handleButtonClick} className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">파일 선택</button>
            </div>
          </div>
        ) : (
          <div className="w-full bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/50 p-4 rounded-lg">
              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-2">품질 설정</h2>
                <div className="flex items-center gap-4"><input type="range" min="1" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" /><span className="font-semibold text-lg text-blue-400 w-12 text-center">{quality}</span></div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-2">해상도 설정 (최대)</h2>
                <div className="flex items-center gap-3"><input type="number" value={maxDimension} onChange={(e) => setMaxDimension(Number(e.target.value))} className="w-full bg-gray-700 p-2 rounded-md text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" /><span className="text-gray-400">px</span></div>
              </div>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {files.map(file => (
                <div key={file.id} className="bg-gray-900/70 p-3 rounded-lg flex items-center gap-4">
                  <img src={file.originalUrl} alt={file.originalFile.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-grow min-w-0"><p className="text-white font-semibold truncate">{file.originalFile.name}</p><p className="text-sm text-gray-400">{(file.originalFile.size / 1024).toFixed(1)} KB</p></div>
                  <div className="flex items-center gap-4 w-64 flex-shrink-0">
                    {file.status === 'converting' && <Loader2 className="w-6 h-6 animate-spin text-blue-400" />}
                    {file.status === 'done' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                    {file.status === 'error' && <XCircle className="w-6 h-6 text-red-500" />}
                    {file.convertedFile && <div className="flex-grow min-w-0"><p className="text-white truncate">{file.convertedFile.name}</p><p className="text-sm text-green-400 font-bold">{(file.convertedFile.size / 1024).toFixed(1)} KB</p></div>}
                    {file.status === 'error' && <p className="text-sm text-red-400">{file.error}</p>}
                  </div>
                  {file.status === 'done' && file.convertedFile && <button onClick={() => handleDownload(file)} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-shrink-0"><Download className="w-5 h-5" /></button>}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button onClick={handleReConvert} disabled={!isDone} className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed"><Settings className="w-5 h-5 mr-2" /> 설정 적용하여 다시 변환</button>
              <button onClick={handleZipDownload} disabled={!hasConvertedFiles || isZipping} className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isZipping ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> ZIP 압축 중...</> : <><Archive className="w-5 h-5 mr-2" /> 모두 ZIP으로 다운로드</>}
              </button>
              <button onClick={handleReset} className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"><RefreshCw className="w-5 h-5 mr-2" /> 모두 지우기</button>
            </div>
          </div>
        )}
      </main>
      <footer className="text-center mt-12 mb-4 text-gray-500"><p>&copy; {new Date().getFullYear()} Quick WebP Converter. All Rights Reserved.</p></footer>
    </div>
  );
}
