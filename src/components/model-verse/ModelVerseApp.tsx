"use client";

import type { AbstractMesh, Nullable } from '@babylonjs/core';
import React, { useState, useCallback } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { BabylonCanvas } from './BabylonCanvas';
import { MeshSidebar } from './MeshSidebar';

const DEFAULT_MESH_COLOR = "#00ACC1"; // Accent Teal

export function ModelVerseApp() {
  const [loadedFile, setLoadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [meshes, setMeshes] = useState<AbstractMesh[]>([]);
  const [selectedMesh, setSelectedMesh] = useState<Nullable<AbstractMesh>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [meshColor, setMeshColor] = useState<string>(DEFAULT_MESH_COLOR);

  const handleFileLoad = useCallback((file: File) => {
    setLoadedFile(file);
    setFileName(file.name);
    setSelectedMesh(null); // Reset selection on new file
    setMeshes([]); // Clear old meshes immediately
    setMeshColor(DEFAULT_MESH_COLOR); // Reset color
  }, []);

  const handleMeshesLoaded = useCallback((loadedMeshes: AbstractMesh[]) => {
    setMeshes(loadedMeshes);
  }, []);

  const handleMeshSelected = useCallback((mesh: Nullable<AbstractMesh>) => {
    setSelectedMesh(mesh);
    if (mesh && mesh.material && (mesh.material as any).diffuseColor) {
        // Attempt to get existing color, otherwise use default
        const currentColor = (mesh.material as any).diffuseColor.toHexString();
        setMeshColor(currentColor);
    } else {
        setMeshColor(DEFAULT_MESH_COLOR);
    }
  }, []);
  
  const handleColorChange = useCallback((color: string) => {
    setMeshColor(color);
  }, []);

  const handleClearModel = useCallback(() => {
    setLoadedFile(null);
    setFileName(null);
    setMeshes([]);
    setSelectedMesh(null);
    setMeshColor(DEFAULT_MESH_COLOR);
    // The BabylonCanvas will also clear its internal scene when `loadedFile` becomes null
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-background">
        <MeshSidebar
          meshes={meshes}
          selectedMesh={selectedMesh}
          onMeshSelect={handleMeshSelected}
          onFileLoad={handleFileLoad}
          isLoading={isLoading}
          onColorChange={handleColorChange}
          initialColor={meshColor}
          onClearModel={handleClearModel}
          fileName={fileName}
        />
        <SidebarInset className="flex-1 p-0 m-0 md:m-0 md:rounded-none shadow-none min-h-screen">
          <BabylonCanvas
            file={loadedFile}
            selectedMeshName={selectedMesh?.name || null}
            onMeshSelected={handleMeshSelected} // Pass through for direct canvas interaction
            onMeshesLoaded={handleMeshesLoaded}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            meshColor={meshColor}
            onClearModel={handleClearModel} // To allow canvas to signal a clear (e.g. on load error)
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
