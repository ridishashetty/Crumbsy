import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

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
  // Database fields
  id_cd?: number;
  id_ua?: number;
}

interface CakeState {
  savedDesigns: CakeDesign[];
  currentDesign: CakeDesign | null;
  saveDesign: (design: CakeDesign, userId: string) => Promise<void>;
  deleteDesign: (id: string, userId: string) => Promise<void>;
  setCurrentDesign: (design: CakeDesign | null) => void;
  getUserDesigns: (userId: string) => CakeDesign[];
  loadUserDesigns: (userId: string) => Promise<void>;
}

export const useCakeStore = create<CakeState>()(
  persist(
    (set, get) => ({
      savedDesigns: [],
      currentDesign: null,
      
      saveDesign: async (design: CakeDesign, userId: string) => {
        const { savedDesigns } = get();
        const designWithUser = { ...design, userId };
        
        try {
          // Try to save to database if user has id_ua
          const userIdMatch = userId.match(/^db-(\d+)$/);
          if (userIdMatch) {
            const id_ua = parseInt(userIdMatch[1]);
            
            // Save to database
            const { data, error } = await supabase
              .from('CakeDesign')
              .upsert({
                id_cd: design.id_cd || undefined,
                cd_Name: design.name,
                id_ua: id_ua,
                cd_TextOnCake: design.topText || null,
                created_by: id_ua,
                updated_by: id_ua
              })
              .select()
              .limit(1);

            if (!error && data && data.length > 0) {
              designWithUser.id_cd = data[0].id_cd;
              designWithUser.id_ua = id_ua;
            }
          }
        } catch (error) {
          console.log('Database save failed, saving locally:', error);
        }
        
        // Always save locally as well
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
      
      deleteDesign: async (id: string, userId: string) => {
        const { savedDesigns } = get();
        const design = savedDesigns.find(d => d.id === id && d.userId === userId);
        
        try {
          // Try to delete from database if it has id_cd
          if (design?.id_cd) {
            await supabase
              .from('CakeDesign')
              .delete()
              .eq('id_cd', design.id_cd);
          }
        } catch (error) {
          console.log('Database delete failed:', error);
        }
        
        // Always delete locally
        set((state) => ({
          savedDesigns: state.savedDesigns.filter((design) => !(design.id === id && design.userId === userId)),
        }));
      },
      
      setCurrentDesign: (design: CakeDesign | null) =>
        set({ currentDesign: design }),
        
      getUserDesigns: (userId: string) => {
        const { savedDesigns } = get();
        return savedDesigns.filter(design => design.userId === userId);
      },
      
      loadUserDesigns: async (userId: string) => {
        try {
          const userIdMatch = userId.match(/^db-(\d+)$/);
          if (userIdMatch) {
            const id_ua = parseInt(userIdMatch[1]);
            
            const { data, error } = await supabase
              .from('CakeDesign')
              .select('*')
              .eq('id_ua', id_ua);

            if (!error && data) {
              // Convert database designs to local format
              const dbDesigns: CakeDesign[] = data.map(dbDesign => ({
                id: `db-${dbDesign.id_cd}`,
                name: dbDesign.cd_Name,
                shape: 'round' as const, // Default shape
                layers: [
                  { flavor: 'chocolate', color: '#8B4513', topDesign: 'none', frosting: 'american buttercream', frostingColor: '#FFFFFF' }
                ], // Default layer
                buttercream: { flavor: 'vanilla', color: '#FFFFFF' },
                toppings: [],
                topText: dbDesign.cd_TextOnCake || '',
                updatedAt: new Date(dbDesign.updated_at || dbDesign.created_at),
                userId: userId,
                id_cd: dbDesign.id_cd,
                id_ua: dbDesign.id_ua
              }));

              // Merge with existing local designs
              const { savedDesigns } = get();
              const localDesigns = savedDesigns.filter(d => d.userId === userId && !d.id_cd);
              const allDesigns = [...localDesigns, ...dbDesigns];
              
              set({ 
                savedDesigns: savedDesigns.filter(d => d.userId !== userId).concat(allDesigns)
              });
            }
          }
        } catch (error) {
          console.log('Failed to load designs from database:', error);
        }
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