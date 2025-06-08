import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PortfolioItem {
  id: string;
  bakerId: string;
  image: string; // URL to the image
  caption: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PortfolioState {
  portfolioItems: PortfolioItem[];
  addPortfolioItem: (item: Omit<PortfolioItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePortfolioItem: (id: string, updates: Partial<PortfolioItem>) => void;
  deletePortfolioItem: (id: string, bakerId: string) => void;
  getBakerPortfolio: (bakerId: string) => PortfolioItem[];
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      portfolioItems: [],
      addPortfolioItem: (itemData) => {
        const newItem: PortfolioItem = {
          ...itemData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          portfolioItems: [...state.portfolioItems, newItem],
        }));
      },
      updatePortfolioItem: (id, updates) => {
        set((state) => ({
          portfolioItems: state.portfolioItems.map(item =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date() }
              : item
          ),
        }));
      },
      deletePortfolioItem: (id, bakerId) => {
        set((state) => ({
          portfolioItems: state.portfolioItems.filter(item => 
            !(item.id === id && item.bakerId === bakerId)
          ),
        }));
      },
      getBakerPortfolio: (bakerId) => {
        const { portfolioItems } = get();
        return portfolioItems.filter(item => item.bakerId === bakerId);
      },
    }),
    {
      name: 'crumbsy-portfolio-storage',
    }
  )
);