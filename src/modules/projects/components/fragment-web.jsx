import React, { useState } from "react";
import { ExternalLink, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { Spinner } from "@/components/ui/spinner";
const FragmentWeb = ({ data }) => {
  const [fragmentKey, setFragmentKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loadedKey, setLoadedKey] = useState(null);

  const currentKey = `${fragmentKey}:${data.sandboxUrl}`;
  const isLoading = loadedKey !== currentKey;

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const onCopy = () => {
    navigator.clipboard.writeText(data.sandboxUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text={"Refresh"} side={"bottom"} align={"start"}>
          <Button size={"sm"} variant={"outline"} onClick={onRefresh}>
            <RefreshCcw />
          </Button>
        </Hint>

        <Hint
          text={copied ? "Copied" : "Click to Copy"}
          side={"bottom"}
          align={"start"}
        >
          <Button
            size={"sm"}
            variant={"outline"}
            onClick={onCopy}
            disabled={!data.sandboxUrl || copied}
            className={"flex-1 justify-start text-start font-normal"}
          >
            <span className="truncate">{data.sandboxUrl}</span>
          </Button>
        </Hint>

        <Hint text={"Open in New Tab"} side="bottom" align="start">
          <Button
            size={"sm"}
            variant={"outline"}
            onClick={() => {
              if (!data.sandboxUrl) return;

              window.open(data.sandboxUrl, "_blank");
            }}
          >
            <ExternalLink />
          </Button>
        </Hint>
      </div>

      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background text-muted-foreground">
            <Spinner />
            <span className="text-sm">Loading preview...</span>
          </div>
        )}
        <iframe
          key={fragmentKey}
          className="h-full w-full"
          sandbox="allow-scripts allow-same-origin "
          loading="lazy"
          src={data.sandboxUrl}
          onLoad={() => setLoadedKey(currentKey)}
        />
      </div>
    </div>
  );
};

export default FragmentWeb;
