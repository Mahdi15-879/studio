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
  ActionManager,
  ExecuteCodeAction,
} from '@babylonjs/core';
import * as BABYLON from '@babylonjs/core'; // For providing BABYLON namespace to user scripts
import '@babylonjs/loaders'; 
import { useToast } from "@/hooks/use-toast";
import type { MeshEventHandlers } from './ModelVerseApp';


// Ensure loaders are registered
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
  meshes: AbstractMesh[]; // Pass the meshes array for dependency tracking in event handler effect
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
  meshEventHandlers,
  meshes: appMeshes, // Renaming to avoid conflict with scene.meshes
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
      scene.clearColor = new Color4(0.933, 0.933, 0.933, 1); 

      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), scene);
      camera.attachControl(reactCanvas.current, true);
      camera.wheelPrecision = 50; 

      new HemisphericLight("light", new Vector3(1, 1, 0), scene);
      
      engine.runRenderLoop(() => {
        if (scene.activeCamera) { // Ensure camera is active before rendering
            scene.render();
        }
      });

      const resize = () => {
        engine.resize();
      };
      window.addEventListener('resize', resize);

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

      currentModelMeshesRef.current.forEach(mesh => mesh.dispose(false, true)); // Dispose meshes and their materials/action managers
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
          undefined, // Progress callback
          `.${fileToLoad.name.split('.').pop()}`
        );
        
        currentModelMeshesRef.current = result.meshes.filter(m => m.getTotalVertices() > 0 && m.name !== "__root__");
        onMeshesLoaded(currentModelMeshesRef.current);
        
        if (result.meshes.length > 0) {
            const firstMeshWithVertices = result.meshes.find(m => m.getTotalVertices() > 0);
            if (firstMeshWithVertices && scene.activeCamera instanceof ArcRotateCamera) {
                scene.activeCamera.setTarget(firstMeshWithVertices.getAbsolutePosition());
                scene.activeCamera.radius = firstMeshWithVertices.getBoundingInfo().boundingSphere.radiusWorld * 2.5;
                 // Ensure camera is not too close or too far
                scene.activeCamera.lowerRadiusLimit = firstMeshWithVertices.getBoundingInfo().boundingSphere.radiusWorld * 0.1;
                scene.activeCamera.upperRadiusLimit = firstMeshWithVertices.getBoundingInfo().boundingSphere.radiusWorld * 10;
            }  else if (scene.activeCamera instanceof ArcRotateCamera && result.meshes.length > 0){
                 // Fallback if no mesh with vertices, target origin
                scene.activeCamera.setTarget(Vector3.Zero());
                scene.activeCamera.radius = 10; // Default radius
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
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, setIsLoading, toast]); // onMeshesLoaded, onMeshSelected, onClearModel are callbacks

  useEffect(() => {
    if (selectedMeshName && sceneRef.current) {
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

    // This effect needs to run on `appMeshes` from ModelVerseApp state to correctly map handlers to scene meshes
    // currentModelMeshesRef.current might be more up-to-date internally if appMeshes prop is slow to update.
    // However, using appMeshes ensures consistency with the app's state which drives the UI for event handlers.

    appMeshes.forEach(appMeshState => {
      // Find the corresponding mesh in the current scene using its unique ID
      const sceneMesh = scene.getMeshByUniqueId(appMeshState.uniqueId);
      if (!sceneMesh) return;

      const handlers = meshEventHandlers[sceneMesh.uniqueId];
      const hasOnClick = handlers?.onClick && handlers.onClick.trim() !== "";
      const hasOnHover = handlers?.onHover && handlers.onHover.trim() !== "";

      // Clear existing event-specific actions before re-adding
      if (sceneMesh.actionManager) {
        const actionsToRemove: BABYLON.IAction[] = [];
        sceneMesh.actionManager.actions.forEach(action => {
          if (action instanceof ExecuteCodeAction) {
            // A simple way to identify our actions: check if they are ExecuteCodeAction
            // and match the trigger type we are about to re-add or remove.
            const trigger = (action as any)._trigger; // Accessing private member, less ideal
            if ((trigger === ActionManager.OnPickTrigger && hasOnClick) || (trigger === ActionManager.OnPointerOverTrigger && hasOnHover)) {
              // This action will be replaced or removed if handler is now empty
            } else if ((trigger === ActionManager.OnPickTrigger && !hasOnClick) || (trigger === ActionManager.OnPointerOverTrigger && !hasOnHover)) {
                actionsToRemove.push(action); // Stale action to remove
            }
          }
        });
        actionsToRemove.forEach(action => sceneMesh.actionManager!.unregisterAction(action));
        
        // If no more actions and no new handlers, dispose AM
        if (sceneMesh.actionManager.actions.length === 0 && !hasOnClick && !hasOnHover) {
          sceneMesh.actionManager.dispose();
          sceneMesh.actionManager = null;
        }
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
      
      // Remove existing actions of the specific types before adding new ones
      // to prevent duplicates.
      const currentPickActions = sceneMesh.actionManager.actions.filter(a => a.trigger === ActionManager.OnPickTrigger && a instanceof ExecuteCodeAction);
      currentPickActions.forEach(a => sceneMesh.actionManager!.unregisterAction(a));
      const currentOverActions = sceneMesh.actionManager.actions.filter(a => a.trigger === ActionManager.OnPointerOverTrigger && a instanceof ExecuteCodeAction);
      currentOverActions.forEach(a => sceneMesh.actionManager!.unregisterAction(a));


      if (hasOnClick) {
        sceneMesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPickTrigger,
            (evt) => {
              try {
                const func = new Function('BABYLON', 'scene', 'event', handlers.onClick!);
                func.call(sceneMesh, BABYLON, scene, evt);
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
                const func = new Function('BABYLON', 'scene', 'event', handlers.onHover!);
                func.call(sceneMesh, BABYLON, scene, evt);
              } catch (e: any) {
                console.error("Error executing onHover handler:", e);
                toast({ title: "Event Error", description: `onHover for ${sceneMesh.name}: ${e.message}`, variant: "destructive" });
              }
            }
          )
        );
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
}
