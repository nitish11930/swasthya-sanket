import { auth } from "./auth";
import { Permission, hasPermission } from "./permissions";
import { z } from "zod";

type ServerActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * A wrapper for Server Actions to guarantee Authentication, Authorization (Role/Permission),
 * and payload validation via Zod, before executing the actual action.
 * 
 * Never expose raw errors or stack traces to the client.
 */
export async function authenticatedAction<TInput, TOutput>(
  schema: z.ZodType<TInput>,
  requiredPermission: Permission,
  input: unknown,
  actionHandler: (parsedInput: TInput, userId: string, facilityId: string) => Promise<TOutput>
): Promise<ServerActionResponse<TOutput>> {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthenticated request." };
    }

    // 2. Authorization (Role -> Permission)
    if (!hasPermission(session.user.role, requiredPermission)) {
      return { success: false, error: "Unauthorized action for your role." };
    }

    // 3. Validation
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid request payload." };
    }

    // 4. Execution
    const result = await actionHandler(parsed.data, session.user.id, session.user.phcId);
    return { success: true, data: result };

  } catch (error) {
    console.error("[Server Action Error]:", error);
    // Safe error handling — no stack trace leaked
    return { success: false, error: "An unexpected internal error occurred." };
  }
}
