import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { verifySandboxOwnership } from "@/lib/auth/ownership";
import { randomBytes, createHmac } from "crypto";

const WS_TOKEN_SECRET = process.env.WS_TOKEN_SECRET || "appmake-ws-default-secret";
const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Issue a short-lived token for WebSocket authentication.
 * Token format: base64(JSON({ userId, containerId, exp })) + "." + hmac
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sandboxId, containerId } = (await req.json()) as {
    sandboxId: string;
    containerId: string;
  };

  if (!sandboxId || !containerId) {
    return NextResponse.json(
      { error: "sandboxId and containerId required" },
      { status: 400 }
    );
  }

  const owns = await verifySandboxOwnership(sandboxId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = {
    userId: session.user.id,
    containerId,
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: randomBytes(8).toString("hex"),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = createHmac("sha256", WS_TOKEN_SECRET)
    .update(payloadB64)
    .digest("base64url");
  const token = `${payloadB64}.${hmac}`;

  return NextResponse.json({ token });
}

/**
 * Verify a WebSocket token. Returns the payload if valid, null otherwise.
 */
export function verifyWsToken(
  token: string
): { userId: string; containerId: string; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, hmac] = parts;
  const expectedHmac = createHmac("sha256", WS_TOKEN_SECRET)
    .update(payloadB64)
    .digest("base64url");

  if (hmac !== expectedHmac) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    );
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
