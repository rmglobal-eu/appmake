"use client";

interface UserMessageProps {
  content: string;
  userName?: string;
  userImage?: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="px-4 py-3">
      <div className="inline-block rounded-2xl bg-primary px-4 py-2 text-primary-foreground">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
