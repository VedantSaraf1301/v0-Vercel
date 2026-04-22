"use server"

import { MessageRole,MessageType } from "@prisma/client"
import db from "@/lib/db"
import { inngest } from "@/inngest/client"
import { getCurrentUser } from "@/modules/authentication/actions"
import { consumeCredits } from "@/lib/usage"



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

