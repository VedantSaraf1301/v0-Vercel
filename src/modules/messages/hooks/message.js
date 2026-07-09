import { useEffect, useState } from "react";
import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { createMessage,getMessages } from "../actions";
import { MessageRole } from "@prisma/client";

const GENERATION_TIMEOUT_MS = 3 * 60 * 1000;

export const useIsGenerating = (messages) => {
    const lastMessage = messages?.[messages.length - 1];
    const isGenerating = !!lastMessage && lastMessage.role === MessageRole.USER;
    const [isStalled, setIsStalled] = useState(false);

    useEffect(() => {
        if (!isGenerating) {
            const resetId = setTimeout(() => setIsStalled(false), 0);
            return () => clearTimeout(resetId);
        }

        const elapsed = Date.now() - new Date(lastMessage.createdAt).getTime();
        const remaining = Math.max(GENERATION_TIMEOUT_MS - elapsed, 0);

        const timeoutId = setTimeout(() => setIsStalled(true), remaining);
        return () => clearTimeout(timeoutId);
    }, [isGenerating, lastMessage?.id, lastMessage?.createdAt]);

    return { isGenerating, isStalled: isGenerating && isStalled, lastMessage };
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