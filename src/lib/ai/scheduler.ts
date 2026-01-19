import { HfInference } from "@huggingface/inference";
import { env } from "~/env";

// Initialize Hugging Face client
const hf = env.HUGGINGFACE_API_KEY
  ? new HfInference(env.HUGGINGFACE_API_KEY)
  : null;

// Model to use for text generation - Mistral is good for structured outputs
const TEXT_MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

interface ScheduleSlot {
  startTime: string; // ISO date string
  endTime: string;
  reason: string;
}

interface TaskToSchedule {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedMinutes: number | null;
  dueDate: Date | null;
}

interface SchedulingContext {
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  bufferMinutes: number;
  maxChunkMinutes: number;
  existingBlocks: Array<{
    startTime: Date;
    endTime: Date;
  }>;
  currentDate: Date;
}

/**
 * Uses AI to suggest optimal scheduling for a task based on context
 */
export async function suggestTaskSchedule(
  task: TaskToSchedule,
  context: SchedulingContext
): Promise<ScheduleSlot | null> {
  if (!hf) {
    console.warn("Hugging Face API key not configured");
    return null;
  }

  // Format existing blocks for the prompt
  const busySlots = context.existingBlocks
    .map(
      (block) =>
        `- ${block.startTime.toISOString()} to ${block.endTime.toISOString()}`
    )
    .join("\n");

  const prompt = `<s>[INST] You are a task scheduling assistant. Suggest the best time slot for the following task.

Task: "${task.title}"
Priority: ${task.priority}
Estimated duration: ${task.estimatedMinutes ?? 60} minutes
Due date: ${task.dueDate ? task.dueDate.toISOString() : "No deadline"}

Current date/time: ${context.currentDate.toISOString()}
Working hours: ${context.workingHoursStart} to ${context.workingHoursEnd}
Working days: ${context.workingDays.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}
Buffer between tasks: ${context.bufferMinutes} minutes
Max task block: ${context.maxChunkMinutes} minutes

Currently blocked times:
${busySlots || "None"}

Respond with ONLY a JSON object in this exact format:
{
  "startTime": "ISO date string",
  "endTime": "ISO date string", 
  "reason": "Brief explanation of why this time was chosen"
}
[/INST]</s>`;

  try {
    const response = await hf.textGeneration({
      model: TEXT_MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.3,
        return_full_text: false,
      },
    });

    // Parse the JSON response
    const jsonRegex = /\{[\s\S]*\}/;
    const jsonMatch = jsonRegex.exec(response.generated_text);
    if (!jsonMatch) {
      console.error("Failed to parse AI response:", response.generated_text);
      return null;
    }

    const result = JSON.parse(jsonMatch[0]) as ScheduleSlot;
    return result;
  } catch (error) {
    console.error("AI scheduling error:", error);
    return null;
  }
}

interface ParsedTask {
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedMinutes: number;
  dueDate: string | null; // ISO date string
}

/**
 * Uses AI to parse natural language into task details
 */
export async function parseTaskFromText(
  text: string,
  currentDate: Date
): Promise<ParsedTask | null> {
  if (!hf) {
    console.warn("Hugging Face API key not configured");
    return null;
  }

  const prompt = `<s>[INST] Parse the following natural language task description into structured data.

Input: "${text}"
Current date: ${currentDate.toISOString()}

Respond with ONLY a JSON object:
{
  "title": "Clear, concise task title",
  "priority": "low" | "medium" | "high" | "urgent",
  "estimatedMinutes": number (reasonable estimate),
  "dueDate": "ISO date string or null if not specified"
}

Examples:
- "Fix the login bug by Friday" -> urgent priority, dueDate = next Friday
- "Write documentation for the API" -> medium priority, ~60 minutes
- "Quick email to John" -> low priority, ~15 minutes
[/INST]</s>`;

  try {
    const response = await hf.textGeneration({
      model: TEXT_MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 150,
        temperature: 0.3,
        return_full_text: false,
      },
    });

    const jsonRegex = /\{[\s\S]*\}/;
    const jsonMatch = jsonRegex.exec(response.generated_text);
    if (!jsonMatch) {
      console.error("Failed to parse AI response:", response.generated_text);
      return null;
    }

    const result = JSON.parse(jsonMatch[0]) as ParsedTask;
    
    // Validate priority
    const validPriorities = ["low", "medium", "high", "urgent"];
    if (!validPriorities.includes(result.priority)) {
      result.priority = "medium";
    }
    
    return result;
  } catch (error) {
    console.error("AI parse error:", error);
    return null;
  }
}

/**
 * Uses AI to suggest how to break down a large task into subtasks
 */
export async function suggestTaskBreakdown(
  taskTitle: string,
  taskDescription: string | null
): Promise<string[] | null> {
  if (!hf) {
    console.warn("Hugging Face API key not configured");
    return null;
  }

  const prompt = `<s>[INST] Break down the following task into smaller, actionable subtasks.

Task: "${taskTitle}"
${taskDescription ? `Description: "${taskDescription}"` : ""}

Respond with ONLY a JSON array of subtask titles (3-7 subtasks):
["Subtask 1", "Subtask 2", ...]
[/INST]</s>`;

  try {
    const response = await hf.textGeneration({
      model: TEXT_MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.5,
        return_full_text: false,
      },
    });

    const arrayRegex = /\[[\s\S]*\]/;
    const jsonMatch = arrayRegex.exec(response.generated_text);
    if (!jsonMatch) {
      console.error("Failed to parse AI response:", response.generated_text);
      return null;
    }

    return JSON.parse(jsonMatch[0]) as string[];
  } catch (error) {
    console.error("AI breakdown error:", error);
    return null;
  }
}

/**
 * Check if AI features are available
 */
export function isAIEnabled(): boolean {
  return hf !== null;
}
