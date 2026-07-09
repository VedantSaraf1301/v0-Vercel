import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const components = {
  p: ({ className, ...props }) => (
    <p className={cn("leading-relaxed", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("text-primary underline underline-offset-2 hover:opacity-80", className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("list-disc pl-5 space-y-1", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("list-decimal pl-5 space-y-1", className)} {...props} />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-relaxed", className)} {...props} />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold", className)} {...props} />
  ),
  h1: ({ className, ...props }) => (
    <h1 className={cn("text-lg font-semibold mt-3 mb-1.5", className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={cn("text-base font-semibold mt-3 mb-1.5", className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn("text-sm font-semibold mt-2 mb-1", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn("border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground", className)}
      {...props}
    />
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className?.includes("language-");

    if (isInline) {
      return (
        <code
          className={cn("bg-muted rounded px-1 py-0.5 text-xs font-mono", className)}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code className={cn("font-mono text-xs", className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn("bg-muted rounded-md p-3 overflow-x-auto my-2", className)}
      {...props}
    />
  ),
};

export const Markdown = ({ children, className }) => {
  return (
    <div className={cn("text-sm", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};
