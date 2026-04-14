"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import React from 'react'
import ProjectHeader from "./project-header";

const ProjectView = ({projectId}) => {
  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
        <ProjectHeader projectId={projectId}/> 

        </ResizablePanel>
        <ResizableHandle withHandle/>
        <ResizablePanel defaultSize={65} minSize={50}>
            {/*TODO*/}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default ProjectView