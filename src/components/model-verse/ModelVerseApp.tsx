
"use client";

import type { AbstractMesh, Nullable } from '@babylonjs/core';
import React, { useState, useCallback, useRef } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { BabylonCanvas, type BabylonCanvasHandles } from './BabylonCanvas';
import { MeshSidebar } from './MeshSidebar';
import { useToast } from "@/hooks/use-toast";


const DEFAULT_MESH_COLOR = "#00ACC1"; // Accent Teal

export interface MeshEventHandlers {
  [meshUniqueId: string]: { // Using uniqueId as key
    onClick?: string;
    onHover?: string;
  };
}

export function ModelVerseApp() {
  const [loadedFile, setLoadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [meshes, setMeshes] = useState<AbstractMesh[]>([]);
  const [selectedMesh, setSelectedMesh] = useState<Nullable<AbstractMesh>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [meshColor, setMeshColor] = useState<string>(DEFAULT_MESH_COLOR);
  const [meshEventHandlers, setMeshEventHandlers] = useState<MeshEventHandlers>({});
  const { toast } = useToast();
  const babylonCanvasRef = useRef<BabylonCanvasHandles>(null);


  const handleFileLoad = useCallback((file: File) => {
    setLoadedFile(file);
    setFileName(file.name);
    setSelectedMesh(null); 
    setMeshes([]); 
    setMeshColor(DEFAULT_MESH_COLOR);
    setMeshEventHandlers({}); 
  }, []);

  const handleMeshesLoaded = useCallback((loadedMeshes: AbstractMesh[]) => {
    setMeshes(loadedMeshes);
  }, []);

  const handleMeshSelected = useCallback((mesh: Nullable<AbstractMesh>) => {
    setSelectedMesh(mesh);
    if (mesh && mesh.material && (mesh.material as any).diffuseColor) {
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
    setMeshEventHandlers({}); 
  }, []);

  const handleMeshEventChange = useCallback((meshId: string, eventType: 'onClick' | 'onHover', code: string) => {
    setMeshEventHandlers(prev => ({
      ...prev,
      [meshId]: {
        ...prev[meshId],
        [eventType]: code,
      },
    }));
  }, []);

  const handleSaveModel = useCallback(async () => {
    if (isLoading || !loadedFile || meshes.length === 0) {
      toast({ title: "Cannot Save", description: "No model loaded or model is empty.", variant: "destructive" });
      return;
    }
  
    setIsLoading(true);
    try {
      const baseFilename = fileName?.split('.').slice(0, -1).join('.') || 'model';
  
      if (babylonCanvasRef.current) {
        await babylonCanvasRef.current.exportGLB(`${baseFilename}.glb`);
      }
  
      const eventsToSave: MeshEventHandlers = {};
      meshes.forEach(mesh => {
        // Ensure mesh.uniqueId is a string for object keys
        const idStr = String(mesh.uniqueId);
        if (meshEventHandlers[idStr] && (meshEventHandlers[idStr].onClick || meshEventHandlers[idStr].onHover)) {
          eventsToSave[idStr] = meshEventHandlers[idStr];
        }
      });
  
      if (Object.keys(eventsToSave).length > 0) {
        const jsonString = JSON.stringify({ meshEvents: eventsToSave }, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseFilename}-events.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Events Saved", description: `Mesh event handlers saved to ${baseFilename}-events.json.` });
      } else {
         // Only show this toast if GLB was also saved. If GLB failed, its toast is enough.
        if (babylonCanvasRef.current) { // Check if exportGLB was attempted
            toast({ title: "No Custom Events", description: "No custom event handlers to save." });
        }
      }
  
    } catch (error) {
      console.error("Error saving model:", error);
      // The exportGLB function will show its own toast on error.
      // If the error is from JSON part, show a generic one.
      if (!(error instanceof Error && error.message.includes("GLB Export Error"))) {
        toast({ title: "Save Error", description: "Could not save the model data. Check console.", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, loadedFile, meshes, meshEventHandlers, toast, fileName, setIsLoading]);

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
          meshEventHandlers={meshEventHandlers}
          onMeshEventChange={handleMeshEventChange}
          onSaveModel={handleSaveModel}
        />
        <SidebarInset className="flex-1 p-0 m-0 md:m-0 md:rounded-none shadow-none min-h-screen">
          <BabylonCanvas
            ref={babylonCanvasRef}
            file={loadedFile}
            selectedMeshName={selectedMesh?.name || null}
            onMeshSelected={handleMeshSelected}
            onMeshesLoaded={handleMeshesLoaded}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            meshColor={meshColor}
            onClearModel={handleClearModel}
            meshEventHandlers={meshEventHandlers}
            meshes={meshes} 
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
