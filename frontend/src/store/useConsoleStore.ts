import { create } from "zustand";
import type { PageId } from "../types/domain";
import { contentItems } from "../data/operations";

interface ConsoleState {
  activePage: PageId;
  selectedContentId: string;
  setActivePage: (pageId: PageId) => void;
  setSelectedContentId: (contentId: string) => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  activePage: "overview",
  selectedContentId: contentItems[0]?.id ?? "",
  setActivePage: (pageId) => set({ activePage: pageId }),
  setSelectedContentId: (contentId) => set({ selectedContentId: contentId })
}));
