"use client";

import React, { useEffect, useRef } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  SceneLoader,
  Color4,
  StandardMaterial,
  Color3,
  Nullable,
  AbstractMesh,
} from '@babylonjs/core';
import '@babylonjs/loaders'; // For GLTF, OBJ, STL loaders
import { useToast } from "@/hooks/use-toast";

// Ensure loaders are registered (though import above should suffice)
import '@babylonjs/loaders/glTF';
import '@babylonjs/loaders/OBJ';
import '@babylonjs/loaders/STL';


interface BabylonCanvasProps {
  file: File | null;
  selectedMeshName: string | null;
  onMeshSelected: (mesh: Nullable<AbstractMesh>) => void;
  onMeshesLoaded: (meshes: AbstractMesh[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  meshColor: string;
  onClearModel: () => void;
}

export function BabylonCanvas({
  file,
  selectedMeshName,
  onMeshSelected,
  onMeshesLoaded,
  isLoading,
  setIsLoading,
  meshColor,
  onClearModel,
}: BabylonCanvasProps) {
  const reactCanvas = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Nullable<Engine>>(null);
  const sceneRef = useRef<Nullable<Scene>>(null);
  const currentModelMeshesRef = useRef<AbstractMesh[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (reactCanvas.current) {
      const engine = new Engine(reactCanvas.current, true);
      engineRef.current = engine;
      const scene = new Scene(engine);
      sceneRef.current = scene;
      scene.clearColor = new Color4(0.933, 0.933, 0.933, 1); // Match --background color

      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
      camera.attachControl(reactCanvas.current, true);
      camera.wheelPrecision = 50; // Adjust zoom sensitivity

      new HemisphericLight("light", new Vector3(1, 1, 0), scene);
      
      engine.runRenderLoop(() => {
        scene.render();
      });

      const resize = () => {
        engine.resize();
      };
      window.addEventListener('resize', resize);

      // Pointer observable for mesh selection
      scene.onPointerDown = (evt, pickInfo) => {
        if (pickInfo?.hit && pickInfo.pickedMesh && currentModelMeshesRef.current.includes(pickInfo.pickedMesh)) {
          onMeshSelected(pickInfo.pickedMesh);
        } else {
          onMeshSelected(null);
        }
      };

      return () => {
        window.removeEventListener('resize', resize);
        scene.dispose();
        engine.dispose();
        engineRef.current = null;
        sceneRef.current = null;
      };
    }
  }, [onMeshSelected]);

  useEffect(() => {
    const loadModel = async (fileToLoad: File) => {
      if (!sceneRef.current || !engineRef.current) return;
      setIsLoading(true);

      // Clear previous model
      currentModelMeshesRef.current.forEach(mesh => mesh.dispose());
      currentModelMeshesRef.current = [];
      onMeshesLoaded([]);
      onMeshSelected(null);

      const scene = sceneRef.current;
      const rootUrl = URL.createObjectURL(fileToLoad.slice(0, 0, fileToLoad.type)); // For relative paths in complex models like OBJ+MTL

      try {
        const result = await SceneLoader.ImportMeshAsync(
          null, // Import all meshes
          rootUrl,
          fileToLoad,
          scene,
          (event) => {
            // Progress callback can be implemented here
          },
          `.${fileToLoad.name.split('.').pop()}` // File extension
        );
        
        currentModelMeshesRef.current = result.meshes.filter(m => m.getTotalVertices() > 0 && m.name !== "__root__"); // Filter out helper/empty meshes
        onMeshesLoaded(currentModelMeshesRef.current);
        
        // Auto-frame the loaded model
        if (result.meshes.length > 0) {
            const firstMesh = result.meshes.find(m => m.getTotalVertices() > 0);
            if (firstMesh && scene.activeCamera instanceof ArcRotateCamera) {
                scene.activeCamera.setTarget(firstMesh.getAbsolutePosition());
                scene.activeCamera.radius = firstMesh.getBoundingInfo().boundingSphere.radiusWorld * 2.5; // Adjust radius based on model size
            }
        }
        toast({ title: "Model Loaded", description: `${fileToLoad.name} imported successfully.` });
      } catch (error) {
        console.error("Error loading model:", error);
        toast({
          title: "Error Loading Model",
          description: `Failed to load ${fileToLoad.name}. Check console for details.`,
          variant: "destructive",
        });
        onClearModel(); // Clear any partial state
      } finally {
        URL.revokeObjectURL(rootUrl); // Clean up object URL
        setIsLoading(false);
      }
    };

    if (file) {
      loadModel(file);
    } else { // Clear scene if file is null (e.g. "Clear Model" button pressed)
        if (sceneRef.current) {
            currentModelMeshesRef.current.forEach(mesh => mesh.dispose());
            currentModelMeshesRef.current = [];
            onMeshesLoaded([]);
            onMeshSelected(null);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, onMeshesLoaded, setIsLoading, toast]); // onClearModel deliberately omitted to avoid re-triggering on external clear

  useEffect(() => {
    if (selectedMeshName && sceneRef.current) {
      const scene = sceneRef.current;
      scene.meshes.forEach(m => {
        if (m.material instanceof StandardMaterial) {
          // Reset highlight for non-selected meshes
          // No need for complex logic if we only change color of selected
        }
      });

      const meshToColor = scene.getMeshByName(selectedMeshName);
      if (meshToColor) {
        if (!meshToColor.material || !(meshToColor.material instanceof StandardMaterial)) {
          meshToColor.material = new StandardMaterial(`${meshToColor.name}_material`, scene);
        }
        if (meshToColor.material instanceof StandardMaterial) {
          meshToColor.material.diffuseColor = Color3.FromHexString(meshColor);
        }
      }
    }
  }, [selectedMeshName, meshColor]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg">
      <canvas ref={reactCanvas} className="w-full h-full outline-none" touch-action="none" />
      {!file && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 pointer-events-none">
          <p className="text-xl text-foreground/70">Import a 3D model to begin</p>
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-foreground">Loading model...</p>
          </div>
        </div>
      )}
    </div>
  );
}
