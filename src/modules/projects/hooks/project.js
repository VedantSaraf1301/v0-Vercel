import {useQuery,useQueryClient,useMutation} from "@tanstack/react-query"
import { createProject,getProjectById,getProjects,renameProject,deleteProject } from "../actions"

export const useGetProjects = ()=>{
    return useQuery({
        queryKey:["projects"],
        queryFn:()=>getProjects()
    })
}

export const useCreateProject = ()=>{
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn:(value)=>createProject(value),
        onSuccess:()=>queryClient.invalidateQueries({queryKey:["projects","status"]})
    })
}

export const useGetProjectById = (projectId)=>{
    return useQuery({
        queryKey:["project" , projectId],
        queryFn:()=>getProjectById(projectId)
    })
}

export const useRenameProject = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ projectId, name }) => renameProject(projectId, name),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] })
            queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] })
        }
    })
}

export const useDeleteProject = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (projectId) => deleteProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] })
        }
    })
}