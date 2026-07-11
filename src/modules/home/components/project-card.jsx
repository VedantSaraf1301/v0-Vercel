"use client"
import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRenameProject, useDeleteProject } from '@/modules/projects/hooks/project';
import { FolderKanban, Calendar, ArrowRight, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatUpdated = (date) => {
  return `Updated ${formatDistanceToNow(new Date(date), { addSuffix: true })}`;
};

const ProjectCard = ({ project }) => {
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState("")

  // Radix closes the dropdown on pointerdown, before the paired click event
  // fires. That click then lands on whatever is now under the cursor - the
  // card itself - and Link would treat it as a navigation click. This flag,
  // set on every menu interaction and checked in Link's own onClick, blocks
  // that ghost click regardless of how it reaches the anchor.
  const suppressNavRef = useRef(false)

  const markMenuInteraction = () => {
    suppressNavRef.current = true
    // Safety net: if no ghost click ever arrives to consume this, don't let
    // it block a genuine future navigation click on this card.
    setTimeout(() => {
      suppressNavRef.current = false
    }, 300)
  }

  const { mutateAsync: rename, isPending: isRenaming } = useRenameProject()
  const { mutateAsync: remove, isPending: isDeleting } = useDeleteProject()

  const openRename = () => {
    setNameDraft(project.name)
    setRenameOpen(true)
  }

  const handleRename = async (e) => {
    e.preventDefault()
    try {
      await rename({ projectId: project.id, name: nameDraft })
      toast.success("Project renamed")
      setRenameOpen(false)
    } catch (error) {
      toast.error(error.message || "Failed to rename project")
    }
  }

  const handleDelete = async () => {
    try {
      await remove(project.id)
      toast.success("Project deleted")
    } catch (error) {
      toast.error(error.message || "Failed to delete project")
    }
  }

  return (
    <>
      <Link
        href={`/projects/${project.id}`}
        onClick={(e) => {
          if (suppressNavRef.current) {
            e.preventDefault()
            suppressNavRef.current = false
          }
        }}
      >
      <Card className="group hover:shadow-xl transition-all duration-300 border-zinc-800/50 hover:border-emerald-500/50 cursor-pointer bg-zinc-900/30 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/80 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  markMenuInteraction()
                }}
              >
                <MoreVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  markMenuInteraction()
                  openRename()
                }}
              >
                <PencilIcon className="size-4" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault()
                  markMenuInteraction()
                  setDeleteOpen(true)
                }}
              >
                <Trash2Icon className="size-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <FolderKanban className="w-5 h-5 text-emerald-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all mr-7" />
          </div>
          <CardTitle className="text-lg text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
            {project.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-zinc-400">
            <Calendar className="w-3.5 h-3.5 mr-2" />
            <span>{formatDate(project.createdAt)}</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {formatUpdated(project.updatedAt)}
          </div>
        </CardContent>
      </Card>
      </Link>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
            </DialogHeader>
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Project name"
              className="mt-4"
              autoFocus
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isRenaming || !nameDraft.trim()}>
                {isRenaming ? <Spinner /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{project.name}&quot; and all of its
              messages and generated code. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? <Spinner /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ProjectCard
