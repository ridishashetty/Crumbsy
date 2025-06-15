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
  preview?: string;
  userId: string;
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
        console.log('💾 Saving design:', design.name);
        
        // Extract database user ID
        const userIdMatch = userId.match(/^user-(\d+)$/);
        if (!userIdMatch) {
          console.log('❌ Invalid user ID format:', userId);
          return;
        }
        
        const userDbId = parseInt(userIdMatch[1]);
        console.log('👤 User DB ID:', userDbId);
        
        try {
          // Prepare design data
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
            console.log('🔄 Updating existing design:', design.dbId);
            const { data, error } = await supabase
              .from('cake_designs')
              .update(designData)
              .eq('id', design.dbId)
              .select()
              .single();

            if (error) throw error;
            savedDesign = data;
          } else {
            console.log('➕ Creating new design');
            const { data, error } = await supabase
              .from('cake_designs')
              .insert(designData)
              .select()
              .single();

            if (error) throw error;
            savedDesign = data;
          }

          // Save tiers
          if (savedDesign) {
            console.log('🎂 Saving tiers for design:', savedDesign.id);
            
            // Delete existing tiers
            await supabase
              .from('cake_tiers')
              .delete()
              .eq('design_id', savedDesign.id);

            // Insert new tiers
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

              if (tiersError) throw tiersError;
            }

            // Update local state
            const designWithDb = {
              ...design,
              dbId: savedDesign.id,
              userDbId: userDbId,
              userId: userId,
              updatedAt: new Date()
            };

            const { savedDesigns } = get();
            const existingIndex = savedDesigns.findIndex(d => d.id === design.id);
            
            if (existingIndex >= 0) {
              const updatedDesigns = [...savedDesigns];
              updatedDesigns[existingIndex] = designWithDb;
              set({ savedDesigns: updatedDesigns });
            } else {
              set({ savedDesigns: [...savedDesigns, designWithDb] });
            }

            console.log('✅ Design saved successfully');
          }
        } catch (error) {
          console.error('❌ Save design error:', error);
          throw error;
        }
      },
      
      deleteDesign: async (id: string, userId: string) => {
        console.log('🗑️ Deleting design:', id);
        
        const { savedDesigns } = get();
        const design = savedDesigns.find(d => d.id === id && d.userId === userId);
        
        try {
          if (design?.dbId) {
            console.log('🗑️ Deleting from database:', design.dbId);
            const { error } = await supabase
              .from('cake_designs')
              .delete()
              .eq('id', design.dbId);

            if (error) throw error;
          }

          // Remove from local state
          set((state) => ({
            savedDesigns: state.savedDesigns.filter((design) => !(design.id === id && design.userId === userId)),
          }));
          
          console.log('✅ Design deleted');
        } catch (error) {
          console.error('❌ Delete design error:', error);
        }
      },
      
      setCurrentDesign: (design: CakeDesign | null) =>
        set({ currentDesign: design }),
        
      getUserDesigns: (userId: string) => {
        const { savedDesigns } = get();
        return savedDesigns.filter(design => design.userId === userId);
      },
      
      loadUserDesigns: async (userId: string) => {
        console.log('📥 Loading user designs for:', userId);
        
        const userIdMatch = userId.match(/^user-(\d+)$/);
        if (!userIdMatch) {
          console.log('❌ Invalid user ID format:', userId);
          return;
        }
        
        const userDbId = parseInt(userIdMatch[1]);
        
        try {
          const { data: designsData, error } = await supabase
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

          if (error) throw error;

          if (designsData) {
            console.log('✅ Loaded designs:', designsData.length);
            
            const dbDesigns: CakeDesign[] = designsData.map(dbDesign => {
              const sortedTiers = (dbDesign.cake_tiers || []).sort((a: any, b: any) => a.tier_order - b.tier_order);
              const layers = sortedTiers.map((tier: any) => ({
                flavor: tier.flavor,
                color: tier.color,
                frosting: tier.frosting,
                frostingColor: tier.frosting_color,
                topDesign: tier.top_design
              }));

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
                id: `design-${dbDesign.id}`,
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

            // Update local state
            const { savedDesigns } = get();
            const otherDesigns = savedDesigns.filter(d => d.userId !== userId);
            set({ savedDesigns: [...otherDesigns, ...dbDesigns] });
            
            console.log('✅ Designs loaded and merged');
          }
        } catch (error) {
          console.error('❌ Load designs error:', error);
        }
      },
    }),
    {
      name: 'crumbsy-cake-storage',
      partialize: (state) => ({ 
        savedDesigns: state.savedDesigns,
      }),
    }
  )
);