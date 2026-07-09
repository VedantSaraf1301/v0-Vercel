import React, { useState } from 'react'
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  EditIcon,
  SunMoonIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { useGetProjectById, useRenameProject, useDeleteProject } from '../hooks/project';
import { Spinner } from '@/components/ui/spinner';


const ProjectHeader = ({projectId}) => {
    const {data:project,isPending} = useGetProjectById(projectId)
    const {setTheme,theme} = useTheme()
    const router = useRouter()

    const [renameOpen, setRenameOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [nameDraft, setNameDraft] = useState("")

    const { mutateAsync: rename, isPending: isRenaming } = useRenameProject()
    const { mutateAsync: remove, isPending: isDeleting } = useDeleteProject()

    const openRename = () => {
      setNameDraft(project?.name || "")
      setRenameOpen(true)
    }

    const handleRename = async (e) => {
      e.preventDefault()
      try {
        await rename({ projectId, name: nameDraft })
        toast.success("Project renamed")
        setRenameOpen(false)
      } catch (error) {
        toast.error(error.message || "Failed to rename project")
      }
    }

    const handleDelete = async () => {
      try {
        await remove(projectId)
        toast.success("Project deleted")
        router.push("/")
      } catch (error) {
        toast.error(error.message || "Failed to delete project")
      }
    }

  return (
    <header className="p-2 flex justify-between items-center border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={"ghost"}
            size={"sm"}
            className={
              "focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity !pl-2"
            }
          >
            <Image
              src={"/v0-logo-dark.svg"}
              alt="Vibe"
              width={28}
              height={28}
              className="shrink-0 invert dark:invert-0"
            />
            <span className="text-sm font-medium">
              {isPending ? <Spinner /> : project?.name || "Untitled Project"}
            </span>
            <ChevronDownIcon className="size-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side={"bottom"} align={"start"}>
          <DropdownMenuItem asChild>
            <Link href={"/"}>
              <ChevronLeftIcon className="size-4" />
              <span>Go to Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              openRename()
            }}
          >
            <PencilIcon className="size-4" />
            <span>Rename Project</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setDeleteOpen(true)
            }}
          >
            <Trash2Icon className="size-4" />
            <span>Delete Project</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={"gap-2"}>
              <SunMoonIcon className="size-4 text-muted-foreground" />
              <span>Appearance</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={5}>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

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
              This will permanently delete &quot;{project?.name}&quot; and all of its
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
    </header>
  );
}

export default ProjectHeader