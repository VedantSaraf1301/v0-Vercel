import React,{useEffect,useRef} from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {useGetMessages,preFetchMessages,useIsGenerating,useCreateMessages} from "@/modules/messages/hooks/message"
import { useQueryClient } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import MessageCard from './message-card'
import MessageForm from './message-form'
import { MessageRole } from '@prisma/client'
import MessageLoader from './message-loader'

const StalledNotice = ({ projectId, content }) => {
  const { mutateAsync, isPending } = useCreateMessages(projectId)

  const handleRetry = async () => {
    try {
      await mutateAsync(content)
    } catch (error) {
      toast.error(error.message || "Failed to retry")
    }
  }

  return (
    <div className="flex flex-col group px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          alt="Vibe"
          src={"/v0-logo-dark.svg"}
          height={28}
          width={28}
          className="shrink-0 invert dark:invert-0"
        />
      </div>
      <div className="pl-8.5 flex flex-col gap-y-2">
        <p className="text-sm text-muted-foreground">
          This is taking longer than expected. The generation may have been cancelled or failed silently.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-fit"
          onClick={handleRetry}
          disabled={isPending}
        >
          {isPending ? <Spinner /> : "Try again"}
        </Button>
      </div>
    </div>
  )
}

const MessageContainer = ({projectId,activeFragment,setActiveFragment}) => {
  const queryClient = useQueryClient()
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const lastAssistantMessageIdRef = useRef(null);

  const {data:messages,isPending,isError,error} = useGetMessages(projectId)
  const { isGenerating, isStalled, lastMessage, steps } = useIsGenerating(projectId, messages)

  useEffect(()=>{
    if(projectId){
      preFetchMessages(queryClient,projectId)
    }
  },[projectId,queryClient])


  useEffect(() => {
    const lastAssistantMessage = messages?.findLast(
      (message) => message.role === MessageRole.ASSISTANT,
    );

    if (lastAssistantMessage?.fragments && lastAssistantMessage.id !== lastAssistantMessageIdRef.current) {
      setActiveFragment(lastAssistantMessage?.fragments);
      lastAssistantMessageIdRef.current = lastAssistantMessage.id;
    }
  }, [messages, setActiveFragment]);


  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"})
  },[messages?.length])

  // Follow the activity feed only if the user is already near the bottom -
  // never yank them down while they're reading earlier messages
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [steps?.length]);


  if (isPending) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className={"text-emerald-400"} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error: {error?.message || "Failed to load messages"}
      </div>
    );
  }

  if(!messages || messages.length===0){
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No Messages yet. Start a conversation!
        </div>

        <div className="relative p-3 pt-1">
          <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background pointer-events-none" />
          <MessageForm projectId={projectId}/>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        {messages.map((message) => (
          <MessageCard
            key={message.id}
            content={message.content}
            role={message.role}
            fragment={message.fragments}
            createdAt={message.createdAt}
            isActiveFragment={activeFragment?.id === message.fragments?.id}
            onFragmentClick={() => setActiveFragment(message.fragments)}
            type={message.type}
          />
        ))}
        {isGenerating && !isStalled && <MessageLoader steps={steps}/>}
        {isStalled && (
          <StalledNotice projectId={projectId} content={lastMessage.content} />
        )}
        <div ref={bottomRef}/>
      </div>

       <div className="relative p-2 pt-1">
           <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background pointer-events-none" />
           <MessageForm projectId={projectId} disabled={isGenerating && !isStalled}/>
      </div>

    </div>
  );
}

export default MessageContainer
