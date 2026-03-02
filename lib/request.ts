import { headers } from "next/headers";

export async function getClientIdentifier(): Promise<string> {
  const headerStore = await headers();

  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = headerStore.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "local-client";
}
