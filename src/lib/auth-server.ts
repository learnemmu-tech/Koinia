import { auth } from "@clerk/nextjs/server";

export async function isAuthenticatedServer(): Promise<boolean> {
  const { userId } = await auth();
  return Boolean(userId);
}
