import { create } from "zustand";
import type { UpdateCard, UpdateCardSubtask } from "@/types/update-card";

interface UpdateCardStore {
  cards: UpdateCard[];
  activeCardId: string | null;
  currentStreamingFile: string | null;
  thinkingStartedAt: number | null;

  openCard: (artifactId: string, title: string, previousFiles: Record<string, string>) => void;
  closeCard: (artifactId: string) => void;
  addSubtask: (artifactId: string, subtask: UpdateCardSubtask) => void;
  completeSubtask: (artifactId: string, subtaskId: string) => void;
  setCurrentStreamingFile: (filePath: string | null) => void;
  startThinking: () => void;
  stopThinking: () => void;
  incrementFileStat: (artifactId: string, type: "created" | "modified") => void;
  reset: () => void;
}

export const useUpdateCardStore = create<UpdateCardStore>((set) => ({
  cards: [],
  activeCardId: null,
  currentStreamingFile: null,
  thinkingStartedAt: null,

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
    set((state) => ({
      cards: state.cards.map((c) =>
        c.artifactId === artifactId
          ? {
              ...c,
              filesCreated: type === "created" ? c.filesCreated + 1 : c.filesCreated,
              filesModified: type === "modified" ? c.filesModified + 1 : c.filesModified,
            }
          : c
      ),
    })),

  reset: () =>
    set({
      cards: [],
      activeCardId: null,
      currentStreamingFile: null,
      thinkingStartedAt: null,
    }),
}));
