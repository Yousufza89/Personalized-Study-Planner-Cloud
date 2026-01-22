import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSession() {
  try {
    const session = await getServerSession(authOptions);
    if (session) {
      console.log("getSession - session found, user ID:", session.user?.id);
    } else {
      console.log("getSession - no session found");
    }
    return session;
  } catch (error) {
    console.error("getSession error:", error);
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

