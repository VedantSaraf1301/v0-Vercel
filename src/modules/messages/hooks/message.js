import { useEffect, useState } from "react";
import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { createMessage,getMessages } from "../actions";
import { getGenerationSteps } from "@/modules/projects/actions";
import { MessageRole } from "@prisma/client";

// A run is considered dead after this much time with NO activity - where
// activity is either the user's message or the latest progress step written
// by the run. A healthy long run keeps writing steps, so this is a rolling
// heartbeat window rather than a hard cap on total generation time.
const GENERATION_TIMEOUT_MS = 3 * 60 * 1000;

export const useIsGenerating = (projectId, messages) => {
    const lastMessage = messages?.[messages.length - 1];
    const isGenerating = !!lastMessage && lastMessage.role === MessageRole.USER;
    const [isStalled, setIsStalled] = useState(false);

    const { data: allSteps } = useQuery({
        queryKey: ["generation-steps", projectId],
        queryFn: () => getGenerationSteps(projectId),
        enabled: isGenerating && !isStalled,
        refetchInterval: 2000,
    });

    // Only steps written after the triggering message belong to this run -
    // cached or not-yet-deleted rows from a previous run must not show up
    const messageTime = lastMessage ? new Date(lastMessage.createdAt).getTime() : 0;
    const steps = (allSteps || []).filter(
        (step) => new Date(step.createdAt).getTime() >= messageTime
    );

    const lastStep = steps[steps.length - 1];
    const lastActivityAt = Math.max(
        messageTime,
        lastStep ? new Date(lastStep.createdAt).getTime() : 0
    );

    useEffect(() => {
        if (!isGenerating) {
            const resetId = setTimeout(() => setIsStalled(false), 0);
            return () => clearTimeout(resetId);
        }

        const elapsed = Date.now() - lastActivityAt;
        const remaining = Math.max(GENERATION_TIMEOUT_MS - elapsed, 0);

        const timeoutId = setTimeout(() => setIsStalled(true), remaining);
        return () => clearTimeout(timeoutId);
    }, [isGenerating, lastActivityAt]);

    return {
        isGenerating,
        isStalled: isGenerating && isStalled,
        lastMessage,
        steps,
    };
}

export const preFetchMessages = async (queryClient,projectId) => {
    await queryClient.prefetchQuery({
        queryKey:["messages",projectId],
        queryFn:()=>getMessages(projectId),
        staleTime:10000
    })
}

export const useGetMessages = (projectId)=>{
    return useQuery({
        queryKey:["messages" , projectId],
        queryFn:()=>getMessages(projectId),
        staleTime:10000,
        refetchInterval:(data)=>{
            return data?.length ? 5000 : false;
        }
    })
}

export const useCreateMessages = (projectId)=>{
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn:(value)=>createMessage(value , projectId),
        onSuccess:()=>{
            queryClient.invalidateQueries({
                queryKey:["messages" , projectId]
            }),
            queryClient.invalidateQueries({
                queryKey:["status"]
            })
        }
    })
}