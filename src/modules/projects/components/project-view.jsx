"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import ProjectHeader from "./project-header";
import MessageContainer from "./message-container";
import { Code, CrownIcon, EyeIcon, MessageSquareIcon } from "lucide-react";
import FragmentWeb from "./fragment-web";
import FileExplorer from "./file-explorer";
import { useGetMessages, useIsGenerating } from "@/modules/messages/hooks/message";
import { useIsMobile } from "@/hooks/use-mobile";

const StalledNotice = () => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8 text-center">
    <p className="text-sm text-muted-foreground max-w-sm">
      This is taking longer than expected. The generation may have been
      cancelled or failed silently, try sending your message again from the chat.
    </p>
  </div>
);

const GeneratingPreview = ({ isStalled }) =>
  isStalled ? (
    <StalledNotice />
  ) : (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
      <div className="w-full max-w-md space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        Generating your app...
      </p>
    </div>
  );

const GeneratingCode = ({ isStalled }) =>
  isStalled ? (
    <StalledNotice />
  ) : (
    <div className="flex h-full w-full gap-4 p-4">
      <div className="w-1/4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-3/6" />
      </div>
    </div>
  );

const ProjectWorkspace = ({ projectId, layoutTabState, setLayoutTabState, isMobile }) => {
  const [activeFragment, setActiveFragment] = useState(null);
  const [tabState, setTabState] = useState("preview");

  const { data: messages } = useGetMessages(projectId);
  const { isGenerating, isStalled } = useIsGenerating(projectId, messages);

  const preview = activeFragment ? (
    <FragmentWeb data={activeFragment} />
  ) : isGenerating ? (
    <GeneratingPreview isStalled={isStalled} />
  ) : (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Select a fragment to preview
    </div>
  );

  const code = activeFragment?.files ? (
    <FileExplorer files={activeFragment.files} />
  ) : isGenerating ? (
    <GeneratingCode isStalled={isStalled} />
  ) : (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Select a fragment to view code
    </div>
  );

  const chat = (
    <>
      <ProjectHeader projectId={projectId} />
      <MessageContainer
        projectId={projectId}
        activeFragment={activeFragment}
        setActiveFragment={setActiveFragment}
      />
    </>
  );

  const upgradeButton = (
    <Button asChild size={"sm"}>
      <Link href={"/pricing"}>
        <CrownIcon className="size-4 mr-2" />
        Upgrade
      </Link>
    </Button>
  );

  if (isMobile) {
    return (
      <Tabs
        className={"h-screen flex flex-col"}
        value={layoutTabState}
        onValueChange={setLayoutTabState}
      >
        <div className="w-full flex items-center p-2 border-b gap-x-2">
          <TabsList className={"h-8 p-0 border rounded-md"}>
            <TabsTrigger value="chat" className={"rounded-md px-3 flex items-center gap-x-2"}>
              <MessageSquareIcon className="size-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className={"rounded-md px-3 flex items-center gap-x-2"}>
              <EyeIcon className="size-4" />
              <span>Demo</span>
            </TabsTrigger>
            <TabsTrigger value="code" className={"rounded-md px-3 flex items-center gap-x-2"}>
              <Code className="size-4" />
              <span>Code</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className={"flex-1 min-h-0 flex flex-col"}>
          {chat}
        </TabsContent>
        <TabsContent value="preview" className={"flex-1 min-h-0 overflow-hidden"}>
          {preview}
        </TabsContent>
        <TabsContent value="code" className={"flex-1 min-h-0 overflow-hidden"}>
          {code}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel
        defaultSize="35%"
        minSize="20%"
        className="flex flex-col min-h-0"
      >
        {chat}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="65%" minSize="50%">
        <Tabs
          className={"h-full flex flex-col"}
          defaultValue="preview"
          value={tabState}
          onValueChange={(value) => setTabState(value)}
        >
          <div className="w-full flex items-center p-2 border-b gap-x-2">
            <TabsList className={"h-8 p-0 border rounded-md"}>
              <TabsTrigger
                value="preview"
                className={"rounded-md px-3 flex items-center gap-x-2"}
              >
                <EyeIcon className="size-4" />
                <span>Demo</span>
              </TabsTrigger>

              <TabsTrigger
                value="code"
                className={"rounded-md px-3 flex items-center gap-x-2"}
              >
                <Code className="size-4" />
                <span>Visualise</span>
              </TabsTrigger>
            </TabsList>

            <div className="ml-auto flex items-center gap-x-2">
              {upgradeButton}
            </div>
          </div>

          <TabsContent value="preview" className={"flex-1 h-[calc(100%-4rem)] overflow-hidden"}>
            {preview}
          </TabsContent>

          <TabsContent value="code" className={"flex-1 h-[calc(100%-4rem)] overflow-hidden"}>
            {code}
          </TabsContent>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

const ProjectView = ({ projectId }) => {
  const isMobile = useIsMobile();
  const [layoutTabState, setLayoutTabState] = useState("chat");

  return (
    <div className="h-screen">
      <ProjectWorkspace
        projectId={projectId}
        layoutTabState={layoutTabState}
        setLayoutTabState={setLayoutTabState}
        isMobile={isMobile}
      />
    </div>
  );
};

export default ProjectView;
