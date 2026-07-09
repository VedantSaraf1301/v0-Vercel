import Sandbox from "e2b";

export const SANDBOX_TIMEOUT_MS = 60_000 * 30; // 30 minutes

export async function getSandbox(sandboxId) {
  const sandbox = await Sandbox.connect(sandboxId);
  await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
  return sandbox;
}

export function lastAssistantTextMessageContent(result){
    const lastAssistantTextMessageIndex = result.output.findLastIndex(
        (message) => message.role === "assistant"
    )

    const message = result.output[lastAssistantTextMessageIndex] 


    return message?.content ? typeof message.content === "string" ? message.content : message.content.map((c)=>c.text).join("") : undefined
}