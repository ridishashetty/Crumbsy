import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CakeDesign {
  id: string;
  name: string;
  shape: 'round' | 'square';
  layers: Array<{
    flavor: string;
    color: string;
    topDesign?: string;
    frosting?: string;
    frostingColor?: string;
  }>;
  buttercream: {
    flavor: string;
    color: string;
  };
  toppings: string[];
  topText: string;
  updatedAt: Date;
  preview?: string; // Base64 encoded image for card display
  userId: string; // Add user isolation
}

interface CakeState {
  savedDesigns: CakeDesign[];
  currentDesign: CakeDesign | null;
  saveDesign: (design: CakeDesign, userId: string) => void;
  deleteDesign: (id: string, userId: string) => void;
  setCurrentDesign: (design: CakeDesign | null) => void;
  getUserDesigns: (userId: string) => CakeDesign[];
}

export const useCakeStore = create<CakeState>()(
  persist(
    (set, get) => ({
      savedDesigns: [],
      currentDesign: null,
      saveDesign: (design: CakeDesign, userId: string) => {
        const { savedDesigns } = get();
        const designWithUser = { ...design, userId };
        const existingIndex = savedDesigns.findIndex(d => d.id === design.id && d.userId === userId);
        
        if (existingIndex >= 0) {
          // Update existing design
          const updatedDesigns = [...savedDesigns];
          updatedDesigns[existingIndex] = { ...designWithUser, updatedAt: new Date() };
          set({ savedDesigns: updatedDesigns });
        } else {
          // Add new design
          set({ 
            savedDesigns: [...savedDesigns, { ...designWithUser, updatedAt: new Date() }] 
          });
        }
      },
      deleteDesign: (id: string, userId: string) =>
        set((state) => ({
          savedDesigns: state.savedDesigns.filter((design) => !(design.id === id && design.userId === userId)),
        })),
      setCurrentDesign: (design: CakeDesign | null) =>
        set({ currentDesign: design }),
      getUserDesigns: (userId: string) => {
        const { savedDesigns } = get();
        return savedDesigns.filter(design => design.userId === userId);
      },
    }),
    {
      name: 'crumbsy-cake-storage',
      partialize: (state) => ({ 
        savedDesigns: state.savedDesigns,
        // Don't persist currentDesign to avoid stale data
      }),
    }
  )
);