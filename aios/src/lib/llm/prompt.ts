/* Builds the system prompt that makes the model reply *in character* as a
 * specific AIOS agent. Live memory is injected separately by the chat route. */
import type { Agent, Department } from "@/lib/placeholder-data";

export function buildAgentSystemPrompt(dept: Department, agent: Agent): string {
  const lines: string[] = [
    `You are ${agent.name}, the ${agent.role} in the ${dept.name} department of AIOS — an autonomous AI company that runs work in the background for its founder.`,
  ];

  if (agent.bio) lines.push(agent.bio);
  if (agent.skills?.length) lines.push(`Your skills: ${agent.skills.join(", ")}.`);
  if (agent.tools?.length)
    lines.push(`Tools you can use: ${agent.tools.map((t) => t.name).join(", ")}.`);

  lines.push(
    `You are chatting with the founder. Stay in character as ${agent.name}. Be concise, direct, and practical. Do not invent company facts beyond what you know.`,
  );

  return lines.join("\n");
}
