import Image from "next/image";
import React from "react";
import { useState, useEffect } from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SHIMMER_MESSAGES = [
  "Thinking...",
  "Loading...",
  "Generating...",
  "Processing...",
  "Analyzing your prompt....",
  "Generating response....",
  "Adding final touches to response....",
  "Almost there....",
];

const ShimmerMessages = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % SHIMMER_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-base text-muted-foreground animate-pulse">
        {SHIMMER_MESSAGES[currentMessageIndex]}
      </span>
    </div>
  );
};

const VISIBLE_STEPS = 5;

const ActivityFeed = ({ steps }) => {
  const visible = steps.slice(-VISIBLE_STEPS);
  const hiddenCount = steps.length - visible.length;

  return (
    <div className="flex flex-col gap-1.5">
      {hiddenCount > 0 && (
        <span className="text-xs text-muted-foreground/60">
          + {hiddenCount} earlier step{hiddenCount === 1 ? "" : "s"}
        </span>
      )}
      {visible.map((step, index) => {
        const isLatest = index === visible.length - 1;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-start gap-2 text-sm",
              isLatest
                ? "text-foreground"
                : "text-muted-foreground/70"
            )}
          >
            {isLatest ? (
              <span className="mt-1 size-3 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : (
              <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
            )}
            <span className={cn("break-words font-mono text-xs leading-5", isLatest && "animate-pulse")}>
              {step.content}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const MessageLoader = ({ steps }) => {
  const hasSteps = Array.isArray(steps) && steps.length > 0;

  return (
    <div className="flex flex-col group px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          src={"/v0-logo-dark.svg"}
          alt="Vibe"
          width={28}
          height={28}
          className="shrink-0 invert dark:invert-0"
        />
      </div>

      <div className="pl-8.5 flex flex-col gap-y-4">
        {hasSteps ? <ActivityFeed steps={steps} /> : <ShimmerMessages />}
      </div>
    </div>
  );
};

export default MessageLoader;
