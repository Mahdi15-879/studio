
"use client";

import React, { useEffect, useRef, useImperativeHandle } from 'react';
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
  ActionManager,
  ExecuteCodeAction,
  Node,
} from '@babylonjs/core';
import * as BABYLON from '@babylonjs/core'; 
import '@babylonjs/loaders'; 
import { GLTF2Export } from '@babylonjs/serializers/glTF';
import { useToast } from "@/hooks/use-toast";
import type { MeshEventHandlers } from './ModelVerseApp';


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
  meshEventHandlers: MeshEventHandlers;
  meshes: AbstractMesh[]; 
}

export interface BabylonCanvasHandles {
  exportGLB: (filename: string) => Promise<void>;
}

export const BabylonCanvas = React.forwardRef<BabylonCanvasHandles, BabylonCanvasProps>(({
  file,
  selectedMeshName,
  onMeshSelected,
  onMeshesLoaded,
  isLoading,
  setIsLoading,
  meshColor,
  onClearModel,
  meshEventHandlers,
  meshes: appMeshes, 
}, ref) => {
  const reactCanvas = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Nullable<Engine>>(null);
  const sceneRef = useRef<Nullable<Scene>>(null);
  const currentModelMeshesRef = useRef<AbstractMesh[]>([]);
  const { toast } = useToast();
  const animationFrameIdRef = useRef<number | null>(null);


  useImperativeHandle(ref, () => ({
    exportGLB: async (filename: string) => {
      if (!sceneRef.current) {
        toast({ title: "Export Error", description: "Scene not available for export.", variant: "destructive" });
        throw new Error("Scene not available for export.");
      }
      const scene = sceneRef.current;
      const filenameWithoutExtension = filename.replace(/\.glb$/i, '');

      try {
        const glbData = await GLTF2Export.GLBAsync(scene, filenameWithoutExtension, {
          shouldExportNode: (node: Node) => {
            // Only export nodes that are part of the loaded model (currentModelMeshesRef)
            // or essential scene elements you want to keep (e.g. not the default camera/light if they are recreated on load)
            // For simplicity, if it's a mesh, check if it's in our list.
            if (node instanceof AbstractMesh) {
              return currentModelMeshesRef.current.some(m => m.uniqueId === node.uniqueId);
            }
            // Export lights and cameras if desired, otherwise filter them out.
            // return !(node instanceof ArcRotateCamera || node instanceof HemisphericLight);
            return true; // Export all nodes for now, can be refined
          }
        });
        
        let fileBlob: Nullable<Blob> = null;
        // GLBAsync might name the file with the extension or the key might be the base name.
        // The main file is usually just named 'filename.glb' or 'filename'
        const targetKey = Object.keys(glbData.glTFFiles).find(k => k.toLowerCase() === `${filenameWithoutExtension.toLowerCase()}.glb`);

        if (targetKey && glbData.glTFFiles[targetKey]) {
            const data = glbData.glTFFiles[targetKey];
            if (data instanceof Blob) {
                fileBlob = data;
            } else if (data instanceof ArrayBuffer) {
                fileBlob = new Blob([data], { type: 'model/gltf-binary' });
            }
        }


        if (fileBlob) {
            const url = URL.createObjectURL(fileBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: "Model Exported", description: `${filename} saved successfully.` });
        } else {
            console.error("GLB data not found in export result. Available files:", Object.keys(glbData.glTFFiles));
            toast({ title: "GLB Export Error", description: `GLB data not found for ${filename}. Check console.`, variant: "destructive" });
            throw new Error("GLB data not found in export result.");
        }
      } catch (exportError: any) {
        console.error("Error exporting GLB:", exportError);
        toast({
          title: "GLB Export Error",
          description: `Failed to export ${filename}: ${exportError.message || 'Unknown error'}. Check console.`,
          variant: "destructive",
        });
        throw exportError; 
      }
    }
  }));

  useEffect(() => {
    let engine: Nullable<Engine> = null;
    let scene: Nullable<Scene> = null;
    
    if (reactCanvas.current) {
      engine = new Engine(reactCanvas.current, true, { adaptToDeviceRatio: true });
      engineRef.current = engine;
      scene = new Scene(engine);
      sceneRef.current = scene;
      scene.clearColor = new Color4(0.2, 0.2, 0.3, 1); // #33334c

      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
      camera.attachControl(reactCanvas.current, true);
      camera.wheelPrecision = 50; 
      scene.activeCamera = camera;

      new HemisphericLight("light", new Vector3(1, 1, 0), scene);
      
      engine.runRenderLoop(() => {
        if (sceneRef.current && sceneRef.current.activeCamera) {
            sceneRef.current.render();
        }
      });

      const handleResize = () => {
        if (engineRef.current) {
          if (animationFrameIdRef.current !== null) {
            cancelAnimationFrame(animationFrameIdRef.current);
          }
          animationFrameIdRef.current = requestAnimationFrame(() => {
            if (engineRef.current && engineRef.current.getRenderingCanvas() && !engineRef.current.isDisposed) {
               engineRef.current.resize();
            }
            animationFrameIdRef.current = null; 
          });
        }
      };
      window.addEventListener('resize', handleResize);

      scene.onPointerDown = (evt, pickInfo) => {
        if (pickInfo?.hit && pickInfo.pickedMesh && currentModelMeshesRef.current.includes(pickInfo.pickedMesh)) {
          onMeshSelected(pickInfo.pickedMesh);
        } else {
          onMeshSelected(null);
        }
      };

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationFrameIdRef.current !== null) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
        if (scene) {
          scene.dispose();
        }
        if (engine) {
          engine.dispose();
        }
        engineRef.current = null;
        sceneRef.current = null;
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMeshSelected]); 

  useEffect(() => {
    const loadModel = async (fileToLoad: File) => {
      if (!sceneRef.current || !engineRef.current) return;
      setIsLoading(true);

      currentModelMeshesRef.current.forEach(mesh => mesh.dispose(false, true));
      currentModelMeshesRef.current = [];
      onMeshesLoaded([]);
      onMeshSelected(null);

      const scene = sceneRef.current;
      const rootUrl = URL.createObjectURL(fileToLoad.slice(0, 0, fileToLoad.type)); 

      try {
        const result = await SceneLoader.ImportMeshAsync(
          null, 
          rootUrl,
          fileToLoad,
          scene,
          undefined, 
          `.${fileToLoad.name.split('.').pop()}`
        );
        
        currentModelMeshesRef.current = result.meshes.filter(m => m.getTotalVertices() > 0 && m.name !== "__root__");
        onMeshesLoaded(currentModelMeshesRef.current);
        
        if (result.meshes.length > 0 && scene.activeCamera instanceof ArcRotateCamera) {
            const firstMeshWithVertices = result.meshes.find(m => m.getTotalVertices() > 0);
            if (firstMeshWithVertices) {
                scene.activeCamera.setTarget(firstMeshWithVertices.getAbsolutePosition());
                scene.activeCamera.radius = firstMeshWithVertices.getBoundingInfo().boundingSphere.radiusWorld * 2.5;
                scene.activeCamera.lowerRadiusLimit = firstMeshWithVertices.getBoundingInfo().boundingSphere.radiusWorld * 0.1;
                scene.activeCamera.upperRadiusLimit = firstMeshWithVertices.getBoundingInfo().boundingSphere.radiusWorld * 10;
            }  else {
                scene.activeCamera.setTarget(Vector3.Zero());
                scene.activeCamera.radius = 10;
                scene.activeCamera.lowerRadiusLimit = 0.1; 
                scene.activeCamera.upperRadiusLimit = 1000;
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
        onClearModel(); 
      } finally {
        URL.revokeObjectURL(rootUrl); 
        setIsLoading(false);
      }
    };

    if (file) {
      loadModel(file);
    } else { 
        if (sceneRef.current) {
            currentModelMeshesRef.current.forEach(mesh => mesh.dispose(false, true));
            currentModelMeshesRef.current = [];
            onMeshesLoaded([]);
            onMeshSelected(null);
            if (sceneRef.current.activeCamera instanceof ArcRotateCamera) {
                sceneRef.current.activeCamera.setTarget(Vector3.Zero());
                sceneRef.current.activeCamera.radius = 10;
                sceneRef.current.activeCamera.lowerRadiusLimit = 0.1;
                sceneRef.current.activeCamera.upperRadiusLimit = 1000;
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, setIsLoading, toast, onClearModel, onMeshSelected, onMeshesLoaded]);


  useEffect(() => {
    if (selectedMeshName && sceneRef.current && meshColor) { 
      const scene = sceneRef.current;
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

  useEffect(() => {
    if (!sceneRef.current || appMeshes.length === 0) return;
    const scene = sceneRef.current;

    appMeshes.forEach(appMeshState => {
      const sceneMesh = scene.getMeshByUniqueId(appMeshState.uniqueId);
      if (!sceneMesh) return;

      const handlers = meshEventHandlers[sceneMesh.uniqueId] || {}; // Use uniqueId as key
      const hasOnClick = handlers?.onClick && handlers.onClick.trim() !== "";
      const hasOnHover = handlers?.onHover && handlers.onHover.trim() !== "";

      // Clear existing actions before re-registering or if handlers are removed
      if (sceneMesh.actionManager) {
        const actionsToRemove: BABYLON.IAction[] = [];
        for (let i = sceneMesh.actionManager.actions.length - 1; i >= 0; i--) {
            const action = sceneMesh.actionManager.actions[i];
            if (action instanceof ExecuteCodeAction) {
                // Check if it's an old handler that needs removal or update
                // For simplicity, remove all ExecuteCodeActions and re-add if needed
                actionsToRemove.push(action);
            }
        }
        actionsToRemove.forEach(action => sceneMesh.actionManager!.unregisterAction(action));
      }
      
      if (!hasOnClick && !hasOnHover) {
        if (sceneMesh.actionManager && sceneMesh.actionManager.actions.length === 0) {
             sceneMesh.actionManager.dispose();
             sceneMesh.actionManager = null;
        }
        return; 
      }

      if (!sceneMesh.actionManager) {
        sceneMesh.actionManager = new ActionManager(scene);
      }
      
      if (hasOnClick) {
        sceneMesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            (evt) => {
              try {
                const func = new Function('BABYLON', 'scene', 'event', 'mesh', handlers.onClick!);
                func.call(sceneMesh, BABYLON, scene, evt, sceneMesh);
              } catch (e: any) {
                console.error("Error executing onClick handler:", e);
                toast({ title: "Event Error", description: `onClick for ${sceneMesh.name}: ${e.message}`, variant: "destructive" });
              }
            }
          )
        );
      }

      if (hasOnHover) {
        sceneMesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPointerOverTrigger,
            (evt) => {
               try {
                const func = new Function('BABYLON', 'scene', 'event', 'mesh', handlers.onHover!);
                func.call(sceneMesh, BABYLON, scene, evt, sceneMesh);
              } catch (e: any) {
                console.error("Error executing onHover handler:", e);
                toast({ title: "Event Error", description: `onHover for ${sceneMesh.name}: ${e.message}`, variant: "destructive" });
              }
            }
          )
        );
      }
      if (sceneMesh.actionManager && sceneMesh.actionManager.actions.length === 0) {
        sceneMesh.actionManager.dispose();
        sceneMesh.actionManager = null;
      }
    });
  }, [meshEventHandlers, appMeshes, sceneRef, toast]);


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
});

BabylonCanvas.displayName = 'BabylonCanvas';
    
