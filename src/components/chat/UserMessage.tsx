"use client";

interface UserMessageProps {
  content: string;
  userName?: string;
  userImage?: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end px-4 py-2">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-r from-violet-600/25 to-pink-600/25 border border-white/10 px-4 py-2.5 text-white backdrop-blur-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
