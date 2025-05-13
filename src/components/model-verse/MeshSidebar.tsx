"use client";

import type { AbstractMesh, Nullable } from '@babylonjs/core';
import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { ModelVerseLogo } from '@/components/icons/ModelVerseLogo';
import { FileImporter } from './FileImporter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Trash2, List } from 'lucide-react';

interface MeshSidebarProps {
  meshes: AbstractMesh[];
  selectedMesh: Nullable<AbstractMesh>;
  onMeshSelect: (mesh: Nullable<AbstractMesh>) => void;
  onFileLoad: (file: File) => void;
  isLoading: boolean;
  onColorChange: (color: string) => void;
  initialColor: string;
  onClearModel: () => void;
  fileName: string | null;
}

export function MeshSidebar({
  meshes,
  selectedMesh,
  onMeshSelect,
  onFileLoad,
  isLoading,
  onColorChange,
  initialColor,
  onClearModel,
  fileName
}: MeshSidebarProps) {
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    setColor(initialColor);
  }, [initialColor]);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setColor(event.target.value);
    onColorChange(event.target.value);
  };

  const handleMeshClick = (mesh: AbstractMesh) => {
    onMeshSelect(mesh);
  };

  return (
    <Sidebar collapsible="icon" defaultOpen={true} className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <ModelVerseLogo className="text-sidebar-primary-foreground" />
          <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            ModelVerse
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0">
        <SidebarGroup className="pt-0">
          <SidebarGroupLabel className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
             <UploadCloud className="h-4 w-4"/>
             <span className="group-data-[collapsible=icon]:hidden">Import</span>
          </SidebarGroupLabel>
          <div className="px-2">
            <FileImporter onFileLoad={onFileLoad} isLoading={isLoading} />
          </div>
        </SidebarGroup>
        
        {fileName && (
          <SidebarGroup>
             <SidebarGroupLabel className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <List className="h-4 w-4"/>
              <span className="group-data-[collapsible=icon]:hidden">Current Model</span>
            </SidebarGroupLabel>
            <div className="px-2 space-y-2">
              <p className="text-sm text-sidebar-foreground/80 truncate group-data-[collapsible=icon]:hidden" title={fileName}>
                {fileName}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={onClearModel}
                disabled={isLoading}
                className="w-full group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0"
                aria-label="Clear Model"
              >
                <Trash2 className="h-4 w-4 group-data-[collapsible=icon]:m-auto" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Clear Model</span>
              </Button>
            </div>
          </SidebarGroup>
        )}

        {meshes.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Palette className="h-4 w-4"/>
              <span className="group-data-[collapsible=icon]:hidden">Customize Mesh</span>
            </SidebarGroupLabel>
            <div className="px-2 space-y-2">
              <Label htmlFor="mesh-color" className="text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
                Mesh Color
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  id="mesh-color"
                  value={color}
                  onChange={handleColorChange}
                  className="w-10 h-10 p-1 bg-sidebar-accent border-sidebar-border disabled:opacity-50"
                  disabled={!selectedMesh || isLoading}
                  aria-label="Select mesh color"
                />
                 <span className="text-sm text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">{selectedMesh ? selectedMesh.name : 'No mesh selected'}</span>
              </div>
            </div>
          </SidebarGroup>
        )}
        
        {meshes.length > 0 && (
           <SidebarGroup className="pb-4">
            <SidebarGroupLabel className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <List className="h-4 w-4"/>
              <span className="group-data-[collapsible=icon]:hidden">Meshes</span>
            </SidebarGroupLabel>
            <ScrollArea className="h-64 px-2 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:overflow-y-auto">
              <SidebarMenu>
                {meshes.map((mesh) => (
                  <SidebarMenuItem key={mesh.uniqueId} title={mesh.name}>
                    <SidebarMenuButton
                      size="sm"
                      onClick={() => handleMeshClick(mesh)}
                      isActive={selectedMesh?.uniqueId === mesh.uniqueId}
                      className="justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                      tooltip={mesh.name}
                    >
                      <span className="truncate">{mesh.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-sidebar-foreground/60">
          ModelVerse &copy; {new Date().getFullYear()}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
