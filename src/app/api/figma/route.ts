import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  style?: Record<string, unknown>;
  characters?: string;
  cornerRadius?: number;
  strokeWeight?: number;
  strokes?: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
}

function figmaColorToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function describeFigmaTree(node: FigmaNode, depth = 0): string {
  const indent = "  ".repeat(depth);
  let desc = `${indent}- ${node.type}: "${node.name}"`;

  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    desc += ` (${Math.round(width)}x${Math.round(height)})`;
  }

  if (node.fills?.length) {
    const solidFill = node.fills.find((f) => f.type === "SOLID" && f.color);
    if (solidFill?.color) {
      desc += ` bg:${figmaColorToHex(solidFill.color)}`;
    }
  }

  if (node.characters) {
    desc += ` text:"${node.characters.slice(0, 80)}"`;
  }

  if (node.cornerRadius) {
    desc += ` radius:${node.cornerRadius}`;
  }

  let result = desc + "\n";
  if (node.children) {
    for (const child of node.children.slice(0, 50)) {
      result += describeFigmaTree(child, depth + 1);
    }
  }
  return result;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { figmaUrl, accessToken } = (await req.json()) as {
    figmaUrl: string;
    accessToken: string;
  };

  if (!figmaUrl || !accessToken) {
    return NextResponse.json({ error: "Figma URL and access token required" }, { status: 400 });
  }

  // Parse Figma URL to extract file key and node ID
  const urlMatch = figmaUrl.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  if (!urlMatch) {
    return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 });
  }

  const fileKey = urlMatch[1];
  const nodeMatch = figmaUrl.match(/node-id=([^&]+)/);
  const nodeId = nodeMatch ? decodeURIComponent(nodeMatch[1]) : undefined;

  try {
    // Fetch from Figma API
    let apiUrl = `https://api.figma.com/v1/files/${fileKey}`;
    if (nodeId) {
      apiUrl += `?ids=${nodeId}`;
    }

    const res = await fetch(apiUrl, {
      headers: { "X-Figma-Token": accessToken },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.err || "Failed to fetch from Figma API" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Get the target node(s)
    let targetNode: FigmaNode;
    if (nodeId && data.nodes) {
      const node = data.nodes[nodeId];
      targetNode = node?.document || data.document;
    } else {
      targetNode = data.document;
    }

    // Build a text description of the design tree
    const description = describeFigmaTree(targetNode);

    // Also try to get images for the selected frame
    let imageUrl: string | null = null;
    if (nodeId) {
      try {
        const imgRes = await fetch(
          `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=png&scale=2`,
          { headers: { "X-Figma-Token": accessToken } }
        );
        const imgData = await imgRes.json();
        imageUrl = imgData.images?.[nodeId] || null;
      } catch {
        // Image export is optional
      }
    }

    return NextResponse.json({
      fileName: data.name,
      description,
      imageUrl,
      nodeId,
    });
  } catch (error) {
    console.error("Figma API error:", error);
    return NextResponse.json({ error: "Failed to connect to Figma" }, { status: 500 });
  }
}
