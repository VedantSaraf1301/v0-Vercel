"use client"
import React from 'react'
import { useGetProjects } from '@/modules/projects/hooks/project'
import { Spinner } from "@/components/ui/spinner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FolderKanban } from "lucide-react";
import Link from 'next/link';
import ProjectCard from './project-card';
const ProjectList = () => {

    const {data:projects,isPending} = useGetProjects()

    if (isPending) {
      return (
        <div className="w-full mt-16 flex items-center justify-center">
          <Spinner className="text-emerald-400" />
        </div>
      );
    }
  
    if(!projects || projects.length===0){
        return (
          <div className="w-full mt-16 flex flex-col items-center gap-3 text-center">
            <div className="p-4 rounded-full bg-emerald-500/10">
              <FolderKanban className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold">No projects yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Describe what you want to build above and we&apos;ll create your first project.
            </p>
          </div>
        )
    }


    return (
      <div className="w-full mt-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Your Projects
        </h2>

        <div className="hidden lg:grid grid-cols-3 gap-4 max-w-6xl mx-auto">
          {projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>

        <div className="lg:hidden max-w-4xl mx-auto px-4">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {projects.map((project) => (
                <CarouselItem key={project.id} className="pl-4 md:basis-1/2">
                  <Link href={`/projects/${project.id}`}>
                    <ProjectCard project={project} />
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" />
            <CarouselNext className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" />
          </Carousel>
        </div>
      </div>
    );
}

export default ProjectList