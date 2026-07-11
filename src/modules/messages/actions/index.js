"use server"

import { MessageRole,MessageType } from "@prisma/client"
import db from "@/lib/db"
import { inngest } from "@/inngest/client"
import { getCurrentUser } from "@/modules/authentication/actions"
import { consumeCredits } from "@/lib/usage"

// Matches the frontend stall window - after this a run is considered dead and
// the user may retry even though no assistant reply ever arrived
const GENERATION_TIMEOUT_MS = 3 * 60 * 1000;

export const createMessage = async(value,projectId) => {
    const user = await getCurrentUser()

    if(!user || !user.id) throw new Error("Unauthorised")

    const project = await db.project.findUnique({
        where:{
            id:projectId,
            userId : user.id
        }
    })

    if(!project) throw new Error("Project not found!!!")

    // Anti-spam guard: one generation at a time per project. The last message
    // being from the user means a run is (or should be) in flight; block new
    // messages until it replies or the stall window has passed.
    const lastMessage = await db.message.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
    })

    if (
        lastMessage?.role === MessageRole.USER &&
        Date.now() - new Date(lastMessage.createdAt).getTime() < GENERATION_TIMEOUT_MS
    ) {
        throw new Error("A generation is already in progress. Please wait for it to finish.")
    }

    //This logic is to support rate limiting
    try {
      await consumeCredits();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error({
          code: "BAD_REQUEST",
          message: "Something went wrong",
        });
      } else {
        throw new Error({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests",
        });
      }
    }

    const newMessage = await db.message.create({
        data:{
            projectId:projectId,
            content:value,
            role:MessageRole.USER,
            type:MessageType.RESULT
        }
    })

    await inngest.send({
        name:"code-agent/run",
        data:{
            value:value,
            projectId:projectId
        }
    })

    return newMessage
}

export const getMessages = async(projectId) => {
    const user = await getCurrentUser()

    if(!user || !user.id) throw new Error("Unauthorised")

    const project = await db.project.findUnique({
        where:{
            id:projectId,
            userId : user.id
        }
    })

    if(!project) throw new Error("Project not found!!!")

    const messages = await db.message.findMany({
        where:{
            projectId:projectId
        },
        orderBy:{
            updatedAt:"asc"
        },
        include:{
            fragments:true
        }
    })

    return messages
}

