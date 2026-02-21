import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { customDomains, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { verifyProjectOwnership } from "@/lib/auth/ownership";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ domains: [] });
  }

  const owns = await verifyProjectOwnership(projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const domains = await db.select().from(customDomains).where(eq(customDomains.projectId, projectId));
  return NextResponse.json({ domains });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, domain } = (await req.json()) as {
    projectId: string;
    domain: string;
  };

  const owns = await verifyProjectOwnership(projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
  if (!domainRegex.test(domain)) {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
  }

  const verificationToken = `appmake-verify-${randomBytes(16).toString("hex")}`;

  const [newDomain] = await db.insert(customDomains).values({
    projectId,
    domain,
    verificationToken,
  }).returning();

  return NextResponse.json({
    domain: newDomain,
    instructions: {
      type: "TXT",
      name: `_appmake.${domain}`,
      value: verificationToken,
      description: `Add a TXT record with name "_appmake.${domain}" and value "${verificationToken}" to verify ownership.`,
    },
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domainId } = (await req.json()) as { domainId: string };

  // Get the domain record
  const domainRecord = await db.query.customDomains.findFirst({
    where: eq(customDomains.id, domainId),
  });
  if (!domainRecord) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const owns = await verifyProjectOwnership(domainRecord.projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify DNS TXT record
  try {
    const { resolve } = await import("dns/promises");
    const records = await resolve(`_appmake.${domainRecord.domain}`, "TXT");
    const found = records.some((r) =>
      r.some((txt) => txt === domainRecord.verificationToken)
    );

    if (found) {
      await db.update(customDomains)
        .set({ status: "verified", verifiedAt: new Date() })
        .where(eq(customDomains.id, domainId));
      return NextResponse.json({ status: "verified" });
    } else {
      await db.update(customDomains)
        .set({ status: "failed" })
        .where(eq(customDomains.id, domainId));
      return NextResponse.json({ status: "failed", message: "TXT record not found" });
    }
  } catch {
    return NextResponse.json({ status: "failed", message: "DNS lookup failed" });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domainId } = (await req.json()) as { domainId: string };

  const domainRecord = await db.query.customDomains.findFirst({
    where: eq(customDomains.id, domainId),
  });
  if (!domainRecord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owns = await verifyProjectOwnership(domainRecord.projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(customDomains).where(eq(customDomains.id, domainId));
  return NextResponse.json({ success: true });
}
