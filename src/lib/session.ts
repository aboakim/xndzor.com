import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export type AppSession = {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export function getSession(): Promise<AppSession | null> {
  return getServerSession(authOptions) as Promise<AppSession | null>;
}
