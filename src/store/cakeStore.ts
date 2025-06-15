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
  dbId?: number;
  userDbId?: number;
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
          // Try to save to database if user has userDbId
          const userIdMatch = userId.match(/^db-(\d+)$/);
          if (userIdMatch) {
            const userDbId = parseInt(userIdMatch[1]);
            
            // Save cake design to database
            const designData = {
              name: design.name,
              user_id: userDbId,
              shape: design.shape,
              buttercream: design.buttercream,
              toppings: design.toppings,
              top_text: design.topText || null,
              preview_image: design.preview || null
            };

            let savedDesign;
            if (design.dbId) {
              // Update existing design
              const { data, error } = await supabase
                .from('cake_designs')
                .update(designData)
                .eq('id', design.dbId)
                .select()
                .single();

              if (error) throw error;
              savedDesign = data;
            } else {
              // Create new design
              const { data, error } = await supabase
                .from('cake_designs')
                .insert(designData)
                .select()
                .single();

              if (error) throw error;
              savedDesign = data;
            }

            if (savedDesign) {
              designWithUser.dbId = savedDesign.id;
              designWithUser.userDbId = userDbId;

              // Delete existing tiers for this design
              await supabase
                .from('cake_tiers')
                .delete()
                .eq('design_id', savedDesign.id);

              // Save each tier to cake_tiers table
              if (design.layers && design.layers.length > 0) {
                const tierData = design.layers.map((layer, index) => ({
                  design_id: savedDesign.id,
                  tier_order: index + 1,
                  flavor: layer.flavor,
                  color: layer.color,
                  frosting: layer.frosting || 'american buttercream',
                  frosting_color: layer.frostingColor || '#FFFFFF',
                  top_design: layer.topDesign || 'none'
                }));

                const { error: tiersError } = await supabase
                  .from('cake_tiers')
                  .insert(tierData);

                if (tiersError) {
                  console.error('Error saving tiers:', tiersError);
                }
              }
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
          // Try to delete from database if it has dbId
          if (design?.dbId) {
            // Delete tiers first (cascade should handle this, but being explicit)
            await supabase
              .from('cake_tiers')
              .delete()
              .eq('design_id', design.dbId);

            // Delete design
            await supabase
              .from('cake_designs')
              .delete()
              .eq('id', design.dbId);
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
            const userDbId = parseInt(userIdMatch[1]);
            
            // Load designs with their tiers
            const { data: designsData, error: designsError } = await supabase
              .from('cake_designs')
              .select(`
                *,
                cake_tiers (
                  id,
                  tier_order,
                  flavor,
                  color,
                  frosting,
                  frosting_color,
                  top_design
                )
              `)
              .eq('user_id', userDbId)
              .order('updated_at', { ascending: false });

            if (!designsError && designsData) {
              // Convert database designs to local format
              const dbDesigns: CakeDesign[] = designsData.map(dbDesign => {
                // Sort tiers by tier_order and convert to layers format
                const sortedTiers = (dbDesign.cake_tiers || []).sort((a: any, b: any) => a.tier_order - b.tier_order);
                const layers = sortedTiers.map((tier: any) => ({
                  flavor: tier.flavor,
                  color: tier.color,
                  frosting: tier.frosting,
                  frostingColor: tier.frosting_color,
                  topDesign: tier.top_design
                }));

                // If no tiers exist, create a default layer
                if (layers.length === 0) {
                  layers.push({
                    flavor: 'chocolate',
                    color: '#8B4513',
                    topDesign: 'none',
                    frosting: 'american buttercream',
                    frostingColor: '#FFFFFF'
                  });
                }

                return {
                  id: `db-${dbDesign.id}`,
                  name: dbDesign.name,
                  shape: dbDesign.shape || 'round',
                  layers: layers,
                  buttercream: dbDesign.buttercream || { flavor: 'vanilla', color: '#FFFFFF' },
                  toppings: dbDesign.toppings || [],
                  topText: dbDesign.top_text || '',
                  updatedAt: new Date(dbDesign.updated_at || dbDesign.created_at),
                  userId: userId,
                  preview: dbDesign.preview_image || undefined,
                  dbId: dbDesign.id,
                  userDbId: dbDesign.user_id
                };
              });

              // Merge with existing local designs
              const { savedDesigns } = get();
              const localDesigns = savedDesigns.filter(d => d.userId === userId && !d.dbId);
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