import React, { useState, useRef } from "react";
import Image from "next/image";
import { Dictionary } from "@/app/[lang]/dictionaries";

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
}

export default function ImageUpload({
  onUpload,
  onReset,
  dict,
}: {
  onUpload: (files: File[]) => void;
  onReset: () => void;
  dict: Dictionary;
}) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const processFiles = (newFiles: File[]) => {
    const processed = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }));

    const updatedFiles = [...files, ...processed];
    setFiles(updatedFiles);
    onUpload(updatedFiles.map((f) => f.file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const selectedFiles = Array.from(e.dataTransfer.files || []);
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    if (updatedFiles.length === 0) {
      onReset();
    } else {
      onUpload(updatedFiles.map((f) => f.file));
    }
  };

  const clearAll = () => {
    setFiles([]);
    onReset();
  };

  return (
    <div className="w-full">
      {files.length === 0 ? (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-zinc-300 rounded-[2.5rem] cursor-pointer bg-white hover:bg-zinc-50 transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/50 group"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform dark:bg-blue-900/20">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="mb-2 text-lg font-medium">
              {dict.screening.upload_zone}
            </p>
            <p className="text-sm text-zinc-500">{dict.screening.file_types}</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
          />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {files.map((f) => (
              <div
                key={f.id}
                className="relative group aspect-square rounded-2xl overflow-hidden border dark:border-slate-800"
              >
                <Image
                  src={f.preview}
                  fill
                  alt={f.file.name}
                  className="object-cover transition-transform group-hover:scale-110"
                />
                <button
                  onClick={() => removeFile(f.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-rose-600 transition-colors backdrop-blur-md opacity-0 group-hover:opacity-100"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="absolute inset-x-0 bottom-0 p-2 bg-black/40 backdrop-blur-sm text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {f.file.name}
                </div>
              </div>
            ))}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl hover:bg-zinc-50 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center mb-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors dark:bg-slate-800">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-blue-500">
                {dict.screening.upload_batch}
              </span>
            </button>
          </div>

          <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-800">
            <div className="flex flex-col">
              <span className="text-sm font-bold">
                {files.length} {dict.screening.batch_count}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                {dict.screening.batch_ready}
              </span>
            </div>
            <button
              onClick={clearAll}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors uppercase tracking-widest"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
