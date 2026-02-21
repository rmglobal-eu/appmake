import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encryptApiKey, maskApiKey } from "@/lib/security/api-key-manager";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (!settings) {
      return NextResponse.json({
        account: {
          name: session.user.name || "",
          email: session.user.email || "",
          avatar: session.user.image || "",
        },
        ai: {
          defaultModel: null,
          temperature: 0.7,
          maxTokens: 4096,
          autoFixEnabled: true,
        },
        editor: {
          theme: "oneDark",
          fontSize: 14,
          tabSize: 2,
          lineNumbers: true,
          wordWrap: true,
          minimap: false,
        },
        notifications: {},
        apiKeys: {
          openaiMasked: "",
          anthropicMasked: "",
        },
      });
    }

    // Parse notifications JSON
    let notificationsData = {};
    if (settings.notifications) {
      try {
        notificationsData = JSON.parse(settings.notifications);
      } catch {
        // ignore parse errors
      }
    }

    // Parse custom API key JSON (stores both openai and anthropic keys)
    let apiKeysRaw: Record<string, string> = {};
    if (settings.customApiKey) {
      try {
        apiKeysRaw = JSON.parse(settings.customApiKey);
      } catch {
        // single key fallback
        apiKeysRaw = { openaiKey: settings.customApiKey };
      }
    }

    return NextResponse.json({
      account: {
        name: session.user.name || "",
        email: session.user.email || "",
        avatar: session.user.image || "",
      },
      ai: {
        defaultModel: settings.aiModel,
        temperature: settings.temperature
          ? parseFloat(settings.temperature)
          : 0.7,
        maxTokens: settings.maxTokens ?? 4096,
        autoFixEnabled: true,
      },
      editor: {
        theme: settings.editorTheme || "oneDark",
        fontSize: settings.editorFontSize ?? 14,
        tabSize: settings.tabSize ?? 2,
        lineNumbers: true,
        wordWrap: true,
        minimap: false,
      },
      notifications: notificationsData,
      apiKeys: {
        openaiMasked: maskApiKey(apiKeysRaw.openaiKey),
        anthropicMasked: maskApiKey(apiKeysRaw.anthropicKey),
      },
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Get existing settings
    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    // Build update object with only changed fields
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // AI settings
    if (body.ai) {
      if (body.ai.defaultModel !== undefined) {
        updateFields.aiModel = body.ai.defaultModel;
      }
      if (body.ai.temperature !== undefined) {
        updateFields.temperature = String(body.ai.temperature);
      }
      if (body.ai.maxTokens !== undefined) {
        updateFields.maxTokens = body.ai.maxTokens;
      }
    }

    // Editor settings
    if (body.editor) {
      if (body.editor.theme !== undefined) {
        updateFields.editorTheme = body.editor.theme;
      }
      if (body.editor.fontSize !== undefined) {
        updateFields.editorFontSize = body.editor.fontSize;
      }
      if (body.editor.tabSize !== undefined) {
        updateFields.tabSize = body.editor.tabSize;
      }
    }

    // Notification settings (stored as JSON string)
    if (body.notifications) {
      let existingNotifications = {};
      if (existing?.notifications) {
        try {
          existingNotifications = JSON.parse(existing.notifications);
        } catch {
          // ignore
        }
      }
      updateFields.notifications = JSON.stringify({
        ...existingNotifications,
        ...body.notifications,
      });
    }

    // API keys (stored as encrypted JSON string in customApiKey column)
    if (body.apiKeys) {
      let existingKeys: Record<string, string> = {};
      if (existing?.customApiKey) {
        try {
          existingKeys = JSON.parse(existing.customApiKey);
        } catch {
          existingKeys = { openaiKey: existing.customApiKey };
        }
      }

      const updatedKeys = { ...existingKeys };

      if (body.apiKeys.openaiKey === null) {
        delete updatedKeys.openaiKey;
      } else if (body.apiKeys.openaiKey) {
        updatedKeys.openaiKey = encryptApiKey(body.apiKeys.openaiKey);
      }

      if (body.apiKeys.anthropicKey === null) {
        delete updatedKeys.anthropicKey;
      } else if (body.apiKeys.anthropicKey) {
        updatedKeys.anthropicKey = encryptApiKey(body.apiKeys.anthropicKey);
      }

      updateFields.customApiKey = JSON.stringify(updatedKeys);
    }

    // Upsert
    if (existing) {
      await db
        .update(userSettings)
        .set(updateFields)
        .where(eq(userSettings.userId, userId));
    } else {
      await db.insert(userSettings).values({
        userId,
        ...updateFields,
      });
    }

    // Build response with masked API keys
    let maskedKeys = { openaiMasked: "", anthropicMasked: "" };
    const customApiKeyStr =
      (updateFields.customApiKey as string) || existing?.customApiKey;
    if (customApiKeyStr) {
      try {
        const parsed = JSON.parse(customApiKeyStr);
        maskedKeys = {
          openaiMasked: maskApiKey(parsed.openaiKey),
          anthropicMasked: maskApiKey(parsed.anthropicKey),
        };
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      apiKeys: maskedKeys,
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
