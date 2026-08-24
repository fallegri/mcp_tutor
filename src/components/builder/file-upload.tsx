"use client";

import { useState, useRef, useCallback } from "react";

export interface UploadedFile {
  name: string;
  type: string;
  content: string;
  size: number;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  acceptedExtensions?: string[];
  maxFiles?: number;
  maxSizeMB?: number;
  label?: string;
  helpText?: string;
}

const DEFAULT_EXTENSIONS = [".md", ".txt", ".json", ".ts", ".js", ".yaml", ".yml", ".py"];
const MAX_FILE_SIZE_MB = 5;

export function FileUpload({
  onFilesUploaded,
  acceptedExtensions = DEFAULT_EXTENSIONS,
  maxFiles = 10,
  maxSizeMB = MAX_FILE_SIZE_MB,
  label = "Arrastra archivos aquí o haz click para seleccionar",
  helpText,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedExtensions.includes(ext)) {
      return `Extensión "${ext}" no permitida. Acepta: ${acceptedExtensions.join(", ")}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: ${maxSizeMB}MB`;
    }
    return null;
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Error leyendo ${file.name}`));
      reader.readAsText(file);
    });
  };

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      const files = Array.from(fileList);

      if (uploadedFiles.length + files.length > maxFiles) {
        setError(`Máximo ${maxFiles} archivos permitidos`);
        return;
      }

      const newFiles: UploadedFile[] = [];

      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        try {
          const content = await readFileContent(file);
          newFiles.push({
            name: file.name,
            type: file.type || "text/plain",
            content,
            size: file.size,
          });
        } catch (err) {
          setError(`Error leyendo ${file.name}`);
        }
      }

      if (newFiles.length > 0) {
        const allFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(allFiles);
        onFilesUploaded(allFiles);
      }
    },
    [uploadedFiles, maxFiles, onFilesUploaded, acceptedExtensions, maxSizeMB]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesUploaded(newFiles);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-secondary/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedExtensions.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-2">
          <div className="text-4xl">
            {isDragOver ? "📂" : "📄"}
          </div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            Formatos: {acceptedExtensions.join(", ")} | Máx: {maxSizeMB}MB por archivo
          </p>
          {helpText && (
            <p className="text-xs text-muted-foreground mt-1">{helpText}</p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          ⚠️ {error}
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            📎 {uploadedFiles.length} archivo{uploadedFiles.length > 1 ? "s" : ""} cargado{uploadedFiles.length > 1 ? "s" : ""}:
          </p>
          {uploadedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">
                  {file.name.endsWith(".md")
                    ? "📝"
                    : file.name.endsWith(".json")
                      ? "📋"
                      : file.name.endsWith(".ts") || file.name.endsWith(".js")
                        ? "💻"
                        : "📄"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(file.size)} • {file.content.split("\n").length} líneas
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 flex-shrink-0"
              >
                ✕ Quitar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
