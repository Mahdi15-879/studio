"use client";

import type { ChangeEvent } from 'react';
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud } from 'lucide-react';

interface FileImporterProps {
  onFileLoad: (file: File) => void;
  isLoading: boolean;
}

const ACCEPTED_FILE_TYPES = ".glb,.gltf,.obj,.babylon,.stl";

export function FileImporter({ onFileLoad, isLoading }: FileImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileLoad(file);
      // Reset file input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Input
        type="file"
        id="file-upload"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        disabled={isLoading}
      />
      <Button
        onClick={triggerFileInput}
        disabled={isLoading}
        className="w-full"
        aria-label="Import 3D Model"
      >
        <UploadCloud className="mr-2 h-4 w-4" />
        Import Model
      </Button>
      <p className="text-xs text-sidebar-foreground/70 px-1">
        Supports: .glb, .gltf, .obj, .babylon, .stl
      </p>
    </div>
  );
}
