
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
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Palette, Trash2, List, UploadCloud, Code2, MousePointerClick, Hand, Save } from 'lucide-react';
import type { MeshEventHandlers } from './ModelVerseApp';

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
  meshEventHandlers: MeshEventHandlers;
  onMeshEventChange: (meshId: string, eventType: 'onClick' | 'onHover', code: string) => void;
  onSaveModel: () => void;
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
  fileName,
  meshEventHandlers,
  onMeshEventChange,
  onSaveModel,
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
  
  const meshEventHandlersForSelectedMesh = selectedMesh ? meshEventHandlers[selectedMesh.uniqueId] || {} : {};

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
                onClick={onSaveModel}
                disabled={isLoading || meshes.length === 0}
                className="w-full group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0"
                aria-label="Save Model"
                variant="outline"
              >
                <Save className="h-4 w-4 group-data-[collapsible=icon]:m-auto" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Save Model</span>
              </Button>
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

        {selectedMesh && meshes.length > 0 && (
          <SidebarGroup>
            <Accordion type="multiple" defaultValue={["properties"]} className="w-full group-data-[collapsible=icon]:hidden">
              <AccordionItem value="properties" className="border-b-0">
                <AccordionTrigger className="text-sm font-medium text-sidebar-foreground/90 hover:no-underline py-2 px-0 hover:bg-sidebar-accent/10 rounded">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-sidebar-primary" />
                    <span>Mesh Properties</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3 pb-1 pl-1">
                  <div className="space-y-1">
                    <Label htmlFor="mesh-color" className="text-xs text-sidebar-foreground/80">
                      Mesh Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        id="mesh-color"
                        value={color}
                        onChange={handleColorChange}
                        className="w-10 h-10 p-1 bg-sidebar-accent border-sidebar-border disabled:opacity-50"
                        disabled={isLoading}
                        aria-label="Select mesh color"
                      />
                      <span className="text-xs text-sidebar-foreground/80 truncate" title={selectedMesh.name}>
                        {selectedMesh.name}
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="events" className="border-b-0">
                <AccordionTrigger className="text-sm font-medium text-sidebar-foreground/90 hover:no-underline py-2 px-0 hover:bg-sidebar-accent/10 rounded">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-sidebar-primary" />
                    <span>Mesh Events</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-3 pb-1 pl-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="onclick-code" className="text-xs text-sidebar-foreground/80 flex items-center gap-1.5">
                      <MousePointerClick className="h-3.5 w-3.5" />
                      onClick Handler
                    </Label>
                    <Textarea
                      id="onclick-code"
                      placeholder="this.material.emissiveColor = new BABYLON.Color3(1,0,0);"
                      value={meshEventHandlersForSelectedMesh.onClick || ""}
                      onChange={(e) => onMeshEventChange(selectedMesh.uniqueId, 'onClick', e.target.value)}
                      className="h-24 bg-[hsl(var(--sidebar-accent)/0.1)] border-sidebar-border focus:ring-sidebar-ring text-sidebar-foreground placeholder:text-sidebar-foreground/50 text-xs resize-none"
                      disabled={isLoading}
                      aria-label="onClick event code"
                    />
                    <p className="text-xs text-sidebar-foreground/60">
                      Access: this, scene, event, BABYLON
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="onhover-code" className="text-xs text-sidebar-foreground/80 flex items-center gap-1.5">
                      <Hand className="h-3.5 w-3.5" />
                      onHover Handler (PointerOver)
                    </Label>
                    <Textarea
                      id="onhover-code"
                      placeholder="console.log('Hovered: ' + this.name);"
                      value={meshEventHandlersForSelectedMesh.onHover || ""}
                      onChange={(e) => onMeshEventChange(selectedMesh.uniqueId, 'onHover', e.target.value)}
                      className="h-24 bg-[hsl(var(--sidebar-accent)/0.1)] border-sidebar-border focus:ring-sidebar-ring text-sidebar-foreground placeholder:text-sidebar-foreground/50 text-xs resize-none"
                      disabled={isLoading}
                      aria-label="onHover event code"
                    />
                     <p className="text-xs text-sidebar-foreground/60">
                      Access: this, scene, event, BABYLON
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
             {/* Icon-only view for mesh properties when collapsed */}
             <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2 hidden mt-2">
                <Input
                    type="color"
                    id="mesh-color-collapsed"
                    value={color}
                    onChange={handleColorChange}
                    className="w-8 h-8 p-0.5 bg-sidebar-accent border-sidebar-border disabled:opacity-50"
                    disabled={isLoading || !selectedMesh}
                    aria-label="Select mesh color"
                  />
            </div>
          </SidebarGroup>
        )}
        
        {meshes.length > 0 && (
           <SidebarGroup className="pb-4">
            <SidebarGroupLabel className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <List className="h-4 w-4"/>
              <span className="group-data-[collapsible=icon]:hidden">Meshes ({meshes.length})</span>
            </SidebarGroupLabel>
            <ScrollArea className="h-64 px-2 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:max-h-64 group-data-[collapsible=icon]:overflow-y-auto">
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
