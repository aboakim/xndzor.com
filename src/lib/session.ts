import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export type AppSession = {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    isAdmin?: boolean;
  };
};

export async function getSession(): Promise<AppSession | null> {
  try {
    return (await getServerSession(authOptions)) as AppSession | null;
  } catch (error) {
    console.error(
      "[Xndzor] getSession failed — continuing as signed out.",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
