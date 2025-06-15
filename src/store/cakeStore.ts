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
        console.log('=== SAVING DESIGN ===');
        console.log('Design name:', design.name);
        console.log('User ID:', userId);
        console.log('Design layers:', design.layers.length);
        
        const { savedDesigns } = get();
        const designWithUser = { ...design, userId };
        
        try {
          // For database users, save to Supabase
          const userIdMatch = userId.match(/^db-(\d+)$/);
          if (userIdMatch) {
            const userDbId = parseInt(userIdMatch[1]);
            console.log('💾 Saving to database for user DB ID:', userDbId);
            
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

            console.log('📝 Design data to save:', designData);

            let savedDesign;
            if (design.dbId) {
              console.log('🔄 Updating existing design with ID:', design.dbId);
              // Update existing design
              const { data, error } = await supabase
                .from('cake_designs')
                .update(designData)
                .eq('id', design.dbId)
                .select()
                .single();

              if (error) {
                console.error('❌ Error updating design:', error);
                throw error;
              }
              savedDesign = data;
              console.log('✅ Design updated successfully');
            } else {
              console.log('➕ Creating new design');
              // Create new design
              const { data, error } = await supabase
                .from('cake_designs')
                .insert(designData)
                .select()
                .single();

              if (error) {
                console.error('❌ Error creating design:', error);
                throw error;
              }
              savedDesign = data;
              console.log('✅ Design created successfully with ID:', savedDesign.id);
            }

            if (savedDesign) {
              designWithUser.dbId = savedDesign.id;
              designWithUser.userDbId = userDbId;

              console.log('🎂 Saving tiers for design ID:', savedDesign.id);
              
              // Delete existing tiers for this design
              const { error: deleteError } = await supabase
                .from('cake_tiers')
                .delete()
                .eq('design_id', savedDesign.id);

              if (deleteError) {
                console.error('⚠️ Error deleting existing tiers:', deleteError);
              } else {
                console.log('🗑️ Existing tiers deleted successfully');
              }

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

                console.log('📊 Tier data to save:', tierData);

                const { data: tiersData, error: tiersError } = await supabase
                  .from('cake_tiers')
                  .insert(tierData)
                  .select();

                if (tiersError) {
                  console.error('❌ Error saving tiers:', tiersError);
                  throw tiersError;
                } else {
                  console.log('✅ Tiers saved successfully:', tiersData?.length || 0, 'tiers');
                }
              }

              console.log('🎉 Design saved successfully to database with ID:', savedDesign.id);
            }
          } else {
            // For non-database users (like admin), save locally only
            console.log('💻 Saving design locally for user:', userId);
          }
        } catch (error) {
          console.error('❌ Database save failed, saving locally:', error);
          console.error('Error details:', error.message);
        }
        
        // Always save locally as well
        const existingIndex = savedDesigns.findIndex(d => d.id === design.id && d.userId === userId);
        
        if (existingIndex >= 0) {
          // Update existing design
          const updatedDesigns = [...savedDesigns];
          updatedDesigns[existingIndex] = { ...designWithUser, updatedAt: new Date() };
          set({ savedDesigns: updatedDesigns });
          console.log('🔄 Design updated in local storage');
        } else {
          // Add new design
          set({ 
            savedDesigns: [...savedDesigns, { ...designWithUser, updatedAt: new Date() }] 
          });
          console.log('➕ Design added to local storage');
        }
        
        console.log('=== SAVE COMPLETE ===');
        console.log('Total saved designs:', get().savedDesigns.length);
      },
      
      deleteDesign: async (id: string, userId: string) => {
        console.log('=== DELETING DESIGN ===');
        console.log('Design ID:', id);
        console.log('User ID:', userId);
        
        const { savedDesigns } = get();
        const design = savedDesigns.find(d => d.id === id && d.userId === userId);
        
        try {
          // Try to delete from database if it has dbId
          if (design?.dbId) {
            console.log('🗑️ Deleting from database, design DB ID:', design.dbId);
            
            // Delete design (tiers will be deleted by CASCADE)
            const { error } = await supabase
              .from('cake_designs')
              .delete()
              .eq('id', design.dbId);

            if (error) {
              console.error('❌ Error deleting design from database:', error);
            } else {
              console.log('✅ Design deleted successfully from database');
            }
          }
        } catch (error) {
          console.error('❌ Database delete failed:', error);
        }
        
        // Always delete locally
        set((state) => ({
          savedDesigns: state.savedDesigns.filter((design) => !(design.id === id && design.userId === userId)),
        }));
        console.log('✅ Design deleted from local storage');
        console.log('=== DELETE COMPLETE ===');
      },
      
      setCurrentDesign: (design: CakeDesign | null) =>
        set({ currentDesign: design }),
        
      getUserDesigns: (userId: string) => {
        const { savedDesigns } = get();
        const userDesigns = savedDesigns.filter(design => design.userId === userId);
        console.log(`📋 Getting designs for user ${userId}: ${userDesigns.length} designs`);
        return userDesigns;
      },
      
      loadUserDesigns: async (userId: string) => {
        console.log('=== LOADING USER DESIGNS ===');
        console.log('User ID:', userId);
        
        try {
          const userIdMatch = userId.match(/^db-(\d+)$/);
          if (userIdMatch) {
            const userDbId = parseInt(userIdMatch[1]);
            
            console.log('📥 Loading designs for user DB ID:', userDbId);
            
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

            if (designsError) {
              console.error('❌ Error loading designs:', designsError);
              return;
            }

            if (designsData) {
              console.log('✅ Loaded designs from database:', designsData.length);
              
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
              
              console.log('✅ Merged designs total:', allDesigns.length);
              console.log('Database designs:', dbDesigns.length);
              console.log('Local designs:', localDesigns.length);
            }
          } else {
            console.log('👤 User is not a database user, skipping database load');
          }
        } catch (error) {
          console.error('❌ Failed to load designs from database:', error);
        }
        
        console.log('=== LOAD COMPLETE ===');
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