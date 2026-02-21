import { create } from "zustand";
import type { UpdateCard, UpdateCardSubtask } from "@/types/update-card";

type SessionPhase = "idle" | "thinking" | "researching" | "building" | "complete";

interface UpdateCardStore {
  cards: UpdateCard[];
  activeCardId: string | null;
  currentStreamingFile: string | null;
  thinkingStartedAt: number | null;

  // Session progress tracking
  sessionPhase: SessionPhase;
  toolCallCount: number;
  sessionStartedAt: number | null;
  filesTotal: number;

  openCard: (artifactId: string, title: string, previousFiles: Record<string, string>) => void;
  closeCard: (artifactId: string) => void;
  addSubtask: (artifactId: string, subtask: UpdateCardSubtask) => void;
  completeSubtask: (artifactId: string, subtaskId: string) => void;
  setCurrentStreamingFile: (filePath: string | null) => void;
  startThinking: () => void;
  stopThinking: () => void;
  incrementFileStat: (artifactId: string, type: "created" | "modified") => void;
  setSessionPhase: (phase: SessionPhase) => void;
  incrementToolCalls: () => void;
  startSession: () => void;
  endSession: () => void;
  reset: () => void;
}

export const useUpdateCardStore = create<UpdateCardStore>((set) => ({
  cards: [],
  activeCardId: null,
  currentStreamingFile: null,
  thinkingStartedAt: null,
  sessionPhase: "idle" as SessionPhase,
  toolCallCount: 0,
  sessionStartedAt: null,
  filesTotal: 0,

  openCard: (artifactId, title, previousFiles) =>
    set((state) => {
      const card: UpdateCard = {
        id: `card-${Date.now()}`,
        artifactId,
        title,
        subtasks: [],
        status: "streaming",
        previousFiles,
        filesCreated: 0,
        filesModified: 0,
        createdAt: Date.now(),
      };
      return {
        cards: [...state.cards, card],
        activeCardId: card.id,
      };
    }),

  closeCard: (artifactId) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.artifactId === artifactId ? { ...c, status: "completed" as const } : c
      ),
      activeCardId: null,
      currentStreamingFile: null,
    })),

  addSubtask: (artifactId, subtask) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.artifactId === artifactId
          ? { ...c, subtasks: [...c.subtasks, subtask] }
          : c
      ),
    })),

  completeSubtask: (artifactId, subtaskId) =>
    set((state) => ({
      cards: state.cards.map((c) =>
        c.artifactId === artifactId
          ? {
              ...c,
              subtasks: c.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, status: "completed" as const } : s
              ),
            }
          : c
      ),
    })),

  setCurrentStreamingFile: (filePath) =>
    set({ currentStreamingFile: filePath }),

  startThinking: () => set({ thinkingStartedAt: Date.now() }),
  stopThinking: () => set({ thinkingStartedAt: null }),

  incrementFileStat: (artifactId, type) =>
    set((state) => {
      const newCards = state.cards.map((c) =>
        c.artifactId === artifactId
          ? {
              ...c,
              filesCreated: type === "created" ? c.filesCreated + 1 : c.filesCreated,
              filesModified: type === "modified" ? c.filesModified + 1 : c.filesModified,
            }
          : c
      );
      const total = newCards.reduce((sum, c) => sum + c.filesCreated + c.filesModified, 0);
      return { cards: newCards, filesTotal: total };
    }),

  setSessionPhase: (phase) => set({ sessionPhase: phase }),

  incrementToolCalls: () =>
    set((state) => ({ toolCallCount: state.toolCallCount + 1 })),

  startSession: () =>
    set({
      sessionPhase: "thinking" as SessionPhase,
      toolCallCount: 0,
      sessionStartedAt: Date.now(),
      filesTotal: 0,
    }),

  endSession: () => set({ sessionPhase: "complete" as SessionPhase }),

  reset: () =>
    set({
      cards: [],
      activeCardId: null,
      currentStreamingFile: null,
      thinkingStartedAt: null,
      sessionPhase: "idle" as SessionPhase,
      toolCallCount: 0,
      sessionStartedAt: null,
      filesTotal: 0,
    }),
}));
