import { inngest } from "./client";
import {
  gemini,
  createAgent,
  createTool,
  createNetwork,
  createState,
} from "@inngest/agent-kit";
import Sandbox from "e2b";
import z from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import {
  getSandbox,
  lastAssistantTextMessageContent,
  SANDBOX_TIMEOUT_MS,
} from "./utils";
import db from "@/lib/db";
import { MessageRole, MessageType } from "@prisma/client";

// Best-effort progress log for the live activity feed - must never break a run
const recordProgress = async (projectId, content) => {
  try {
    await db.generationStep.create({
      data: { projectId, content },
    });
  } catch (error) {
    console.log("Failed to record progress step:", error);
  }
};

const getAgentFailureMessage = (error) => {
  const text = `${error?.message || error}`.toLowerCase();

  if (
    text.includes("429") ||
    text.includes("resource_exhausted") ||
    text.includes("quota") ||
    text.includes("rate limit")
  ) {
    return "The AI model has hit its usage limit. Please wait a bit and try again.";
  }

  if (text.includes("404") || text.includes("not_found")) {
    return "The AI model is temporarily unavailable. Please try again shortly.";
  }

  return "Something went wrong while generating your app. Please try again.";
};

export const codeAgentFunction = inngest.createFunction(
  {
    id: "code-agent",
    triggers: { event: "code-agent/run" },
    // One run at a time per project - overlapping runs would share a sandbox,
    // race on file writes, and wipe each other's activity feed
    concurrency: [{ key: "event.data.projectId", limit: 1 }],
    onFailure: async ({ event, error }) => {
      const projectId = event.data.event.data.projectId;

      if (!projectId) return;

      await db.message.create({
        data: {
          projectId,
          content: getAgentFailureMessage(error),
          role: MessageRole.ASSISTANT,
          type: MessageType.ERROR,
        },
      });
    },
  },

  async ({ event, step }) => {
    const projectId = event.data.projectId;

    // Step-1
    const sandboxId = await step.run("get-sandbox-id", async () => {
      // Fresh run - clear the previous run's activity feed
      await db.generationStep.deleteMany({ where: { projectId } });
      await recordProgress(projectId, "Starting up the sandbox...");

      const project = await db.project.findUnique({
        where: { id: event.data.projectId },
        select: { sandboxId: true },
      });

      if (project?.sandboxId) {
        try {
          const sandbox = await getSandbox(project.sandboxId);
          return sandbox.sandboxId;
        } catch (error) {
          // Previous sandbox expired or was removed - fall through and create a new one
        }
      }

      const sandbox = await Sandbox.create("v0-nextjs-build-new", {
        timeoutMs: SANDBOX_TIMEOUT_MS,
      });

      await db.project.update({
        where: { id: event.data.projectId },
        data: { sandboxId: sandbox.sandboxId },
      });

      return sandbox.sandboxId;
    });

    await step.run("progress-sandbox-ready", async () => {
      await recordProgress(projectId, "Sandbox ready. Reading your request...");
    });

    //Implementing agent memory
    const previousMessages = await step.run(
      "get-previous-messages",
      async()=>{
        const formattedMessages = [];

        const messages = await db.message.findMany({
          where:{
            projectId:event.data.projectId
          },
          orderBy:{
            createdAt:"desc"
          }
        })

        for(const message of messages){
          formattedMessages.push({
            type:"text",
            role:message.role === "ASSISTANT" ? "assistant" : "user",
            content:message.content
          })
        }

        return formattedMessages
      }
    )

    const state = createState({
      summary:"",
      files:{}
    }
    ,
    {
      messages:previousMessages
    }
    )

    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: gemini({ model: "gemini-2.5-flash" }),
      tools: [
        // 1. Terminal
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              await recordProgress(projectId, `Running: ${command.slice(0, 120)}`);

              try {
                const sandbox = await getSandbox(sandboxId);

                const result = await sandbox.commands.run(command, {
                  onStdout: (data) => {
                    buffers.stdout += data;
                  },

                  onStderr: (data) => {
                    buffers.stderr += data;
                  },
                });

                return result.stdout;
              } catch (error) {
                console.log(
                  `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`
                );

                return `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`;
              }
            });
          },
        }),

        // 2. createOrUpdateFiles
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sanbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),

          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                const fileNames = files.map((f) => f.path).join(", ");
                await recordProgress(
                  projectId,
                  `Writing ${files.length} file${files.length === 1 ? "" : "s"}: ${fileNames.slice(0, 150)}`
                );

                try {
                  const updatedFiles = network?.state?.data.files || {};

                  const sanbox = await getSandbox(sandboxId);

                  for (const file of files) {
                    await sanbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (error) {
                  return "Error" + error;
                }
              }
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),
        // 3. readFiles
        createTool({
          name: "readFiles",
          description: "Read files in the sandbox",

          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              await recordProgress(
                projectId,
                `Reading ${files.length} file${files.length === 1 ? "" : "s"}...`
              );

              try {
                const sanbox = await getSandbox(sandboxId);

                const contents = [];

                for (const file of files) {
                  const content = await sanbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return "Error" + error;
              }
            });
          },
        }),
      ],

      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 10,

      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      },
    });

    let result = await network.run(event.data.value , {state});

    // Self-healing loop: verify the generated app actually renders inside the
    // sandbox, and if it doesn't, feed the real error back to the agent for a
    // repair pass before saving anything.
    const MAX_REPAIR_ATTEMPTS = 1;

    for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
      const hasFiles =
        Object.keys(result.state.data.files || {}).length > 0;

      if (!hasFiles) break;

      const check = await step.run(`verify-app-${attempt}`, async () => {
        await recordProgress(projectId, "Verifying the app renders correctly...");

        try {
          const sandbox = await getSandbox(sandboxId);

          // Retry while the dev server is still booting: curl reports "000"
          // for connection-refused, which is "not ready", not "broken"
          const status = await sandbox.commands.run(
            'for i in $(seq 1 10); do code=$(curl -s -o /tmp/verify.html -w "%{http_code}" --max-time 15 http://localhost:3000); if [ "$code" != "000" ]; then break; fi; sleep 3; done; echo "$code"'
          );
          const statusCode = status.stdout.trim().split("\n").pop().trim();

          if (statusCode === "200") {
            await recordProgress(projectId, "App verified - it renders successfully.");
            return { ok: true };
          }

          if (statusCode === "000") {
            // Server never became reachable - we cannot tell good from broken,
            // so skip verification instead of feeding the agent an empty error
            await recordProgress(
              projectId,
              "Could not reach the app to verify it - skipping verification."
            );
            return { ok: true };
          }

          const body = await sandbox.commands.run(
            "head -c 3000 /tmp/verify.html"
          );

          await recordProgress(
            projectId,
            `App returned HTTP ${statusCode} - sending the error back to the agent to fix...`
          );

          return { ok: false, statusCode, error: body.stdout };
        } catch (error) {
          // If verification itself breaks (curl missing, sandbox hiccup),
          // fail open rather than blocking an otherwise good generation
          return { ok: true };
        }
      });

      if (check.ok) break;
      if (attempt === MAX_REPAIR_ATTEMPTS) break;

      // Clear the summary so the network router routes back to the code agent,
      // but keep the original: if the repair run never emits a new
      // <task_summary>, restoring it prevents a working app from being
      // saved as an error just because the summary went missing
      const previousSummary = result.state.data.summary;
      result.state.data.summary = "";

      result = await network.run(
        `The app you just generated fails to render: loading http://localhost:3000 returns HTTP ${check.statusCode}. Fix the error so the page renders correctly. Here is the server's error output:\n\n${check.error}`,
        { state: result.state }
      );

      if (!result.state.data.summary) {
        result.state.data.summary = previousSummary;
      }
    }

    const fragmentTitleGenerator = createAgent({
      name:"fragment-title-generator",
      description:"Generate a title for the fragment",
      system:FRAGMENT_TITLE_PROMPT,
      model:gemini({model:"gemini-2.5-flash"})
    })

    const responseGenerator = createAgent({
      name:"response-generator",
      description:"Generate a response for the fragment",
      system:RESPONSE_PROMPT,
      model:gemini
      ({model:"gemini-2.5-flash"})
    })


    const {output:fragmentTitleOutput} = await fragmentTitleGenerator.run(result.state.data.summary)
    const {output:responseOutput} = await responseGenerator.run(
      result.state.data.summary
    )

    const generateFragmentTitle = ()=>{
      if(fragmentTitleOutput[0].type !=="text"){
        return "Untitled"
      }

      if(Array.isArray(fragmentTitleOutput[0].content)){
            return fragmentTitleOutput[0].content.map((c) => c).join("");
      }
      else{
        return fragmentTitleOutput[0].content
      }
    }

    const generateResponse = ()=>{
       if (responseOutput[0].type !== "text") {
        return "Here you go";
      }

      if (Array.isArray(responseOutput[0].content)) {
        return responseOutput[0].content.map((c) => c).join("");
      } else {
        return responseOutput[0].content;
      }
    }

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);

      return `http://${host}`;
    });

    await step.run("save-result", async () => {
      await recordProgress(projectId, "Finalizing and saving your app...");

      if (isError) {
        return await db.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again",
            role: MessageRole.ASSISTANT,
            type: MessageType.ERROR,
          },
        });
      }

      return await db.message.create({
        data: {
          projectId: event.data.projectId,
          content: generateResponse(),
          role: MessageRole.ASSISTANT,
          type: MessageType.RESULT,
          fragments: {
            create: {
              sandboxUrl: sandboxUrl,
              title: generateFragmentTitle(),
              files: result.state.data.files,
            },
          },
        },
      });
    });

   

    return {
      url: sandboxUrl,
      title: "Untitled",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);