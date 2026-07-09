"use client";

import React from "react";
import { useState } from "react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextAreaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { onInvoke } from "../actions";
import { useCreateMessages } from "@/modules/messages/hooks/message";
import { useStatus } from "@/modules/usage/hooks/usage";
import { Usage } from "@/modules/usage/components/usage";

const formSchema = z.object({
  content: z
    .string()
    .min(1, "Message description is required")
    .max(1000, "Description is too long"),
});

const MessageForm = ({ projectId }) => {
  const [isFocused, setIsFocused] = useState(false);

  const { mutateAsync, isPending } = useCreateMessages(projectId);

  const {data:usage} = useStatus()

  const showUsage = !!usage

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values) => {
    try {
      const res = await mutateAsync(values.content);
      form.reset();
      toast.success("Message Created Successfully");
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const contentLength = form.watch("content")?.length ?? 0;

  return (
    <Form {...form}>
      {
        showUsage && (
          <Usage/>
        )
      }
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-lg ring-2 ring-primary/20",
        )}
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <TextAreaAutosize
              {...field}
              disabled={isPending}
              placeholder="Create anything"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              minRows={3}
              maxRows={8}
              className={cn(
                "pt-4 resize-none border-none w-full outline-none bg-transparent",
                isPending && "opacity-50"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)(e);
                }
              }}
            />
          )}
        />

        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span>&#8984;</span>Enter
            </kbd>
            &nbsp; to submit
          </div>
          <div className="flex items-center gap-x-2">
            <span
              className={cn(
                "text-[10px] text-muted-foreground font-mono tabular-nums",
                contentLength > 1000 && "text-destructive"
              )}
            >
              {contentLength}/1000
            </span>
            <Button
              className={cn(
                "size-8 rounded-full",
                isPending && "bg-muted-foreground border",
              )}
              disabled={isPending}
              type="submit"
            >
              {isPending ? <Spinner /> : <ArrowUpIcon className="size-4" />}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default MessageForm;
