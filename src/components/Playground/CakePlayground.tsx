import React, { useState, useRef, useEffect } from 'react';
import { useCakeStore } from '../../store/cakeStore';
import { useAuthStore } from '../../store/authStore';
import { Save, Plus, X, Palette, Layers, Cookie, Square, Circle, ChevronDown, ChevronUp, Droplets, Sparkles, Crown, Wand2, Type } from 'lucide-react';

export const CakePlayground: React.FC = () => {
  const { currentDesign, setCurrentDesign, saveDesign, getUserDesigns } = useCakeStore();
  const { user } = useAuthStore();
  
  // Get user's saved designs for unique name generation
  const savedDesigns = user ? getUserDesigns(user.id) : [];
  
  // Collapsible sections state - only collapse when user manually collapses
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [collapsedTiers, setCollapsedTiers] = useState<Record<number, boolean>>({});
  const [showColorPicker, setShowColorPicker] = useState<Record<number, boolean>>({});
  const colorPickerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  
  // Generate unique cake name
  const generateUniqueName = () => {
    const baseName = 'Custom Cake';
    const existingNames = savedDesigns.map(d => d.name);
    
    // Start with 'Custom Cake 1' as the first default name
    let counter = 1;
    while (existingNames.includes(`${baseName} ${counter}`)) {
      counter++;
    }
    
    return `${baseName} ${counter}`;
  };
  
  // Initialize with default design with only 1 tier
  const [design, setDesign] = useState(() => {
    if (currentDesign) {
      return currentDesign;
    }
    return {
      id: Date.now().toString(),
      name: generateUniqueName(),
      shape: 'round' as const,
      layers: [
        { flavor: 'chocolate', color: '#8B4513', topDesign: 'none', frosting: 'american buttercream', frostingColor: '#FFFFFF' }
      ],
      buttercream: { flavor: 'vanilla', color: '#FFFFFF' },
      toppings: [] as string[],
      topText: '',
      updatedAt: new Date(),
      userId: user?.id || ''
    };
  });

  // Update local state when design changes from external sources
  useEffect(() => {
    if (currentDesign) {
      setDesign(currentDesign);
    } else {
      // If no current design, create a new one with unique name
      const newDesign = {
        id: Date.now().toString(),
        name: generateUniqueName(),
        shape: 'round' as const,
        layers: [
          { flavor: 'chocolate', color: '#8B4513', topDesign: 'none', frosting: 'american buttercream', frostingColor: '#FFFFFF' }
        ],
        buttercream: { flavor: 'vanilla', color: '#FFFFFF' },
        toppings: [] as string[],
        topText: '',
        updatedAt: new Date(),
        userId: user?.id || ''
      };
      setDesign(newDesign);
      setCurrentDesign(newDesign);
    }
  }, [currentDesign, savedDesigns.length, setCurrentDesign, user?.id]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(showColorPicker).forEach(tierIndexStr => {
        const tierIndex = parseInt(tierIndexStr);
        if (showColorPicker[tierIndex] && colorPickerRefs.current[tierIndex]) {
          if (!colorPickerRefs.current[tierIndex]?.contains(event.target as Node)) {
            setShowColorPicker(prev => ({
              ...prev,
              [tierIndex]: false
            }));
          }
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  const flavorOptions = [
    { name: 'Vanilla', color: '#FFF8DC' },
    { name: 'Chocolate', color: '#8B4513' },
    { name: 'Strawberry', color: '#FFB6C1' },
    { name: 'Lemon', color: '#FFFACD' },
    { name: 'Red Velvet', color: '#DC143C' },
    { name: 'Carrot', color: '#FF8C00' }
  ];

  const buttercreamOptions = [
    { name: 'Vanilla', color: '#FFFFFF' },
    { name: 'Chocolate', color: '#D2691E' },
    { name: 'Strawberry', color: '#FFB6C1' },
    { name: 'Lemon', color: '#FFFACD' },
    { name: 'Mint', color: '#98FB98' },
    { name: 'Coffee', color: '#8B4513' },
    { name: 'Peanut Butter', color: '#DEB887' }
  ];

  const frostingOptions = [
    { name: 'American Buttercream', color: '#FFFFFF', hasColor: true },
    { name: 'Italian Buttercream', color: '#FFFEF7', hasColor: true },
    { name: 'French Buttercream', color: '#FFF8DC', hasColor: true },
    { name: 'Whipped Cream', color: '#FFFAFA', hasColor: true },
    { name: 'Ganache', color: '#654321', hasColor: false },
    { name: 'Cream Cheese Frosting', color: '#F5F5DC', hasColor: true },
    { name: 'Swiss Meringue', color: '#FFFEF7', hasColor: true }
  ];

  const shapeOptions = [
    { name: 'Round', value: 'round', icon: Circle },
    { name: 'Square', value: 'square', icon: Square }
  ];

  const tierDecorationOptions = [
    { name: 'None', value: 'none', icon: Circle, description: 'Plain top' },
    { name: 'Ganache Drips', value: 'drip', icon: Droplets, description: 'Chocolate or caramel drips' },
    { name: 'Fresh Berries', value: 'berries', icon: Sparkles, description: 'Fresh strawberries or mixed berries' },
    { name: 'Buttercream Flowers', value: 'flowers', icon: Crown, description: 'Decorative buttercream flowers' },
    { name: 'Creative Liberty', value: 'creative', icon: Wand2, description: 'Let the baker surprise you' }
  ];

  const toppingOptions = [
    { name: 'Fresh Berries', icon: '🍓' },
    { name: 'Chocolate Chips', icon: '🍫' },
    { name: 'Sprinkles', icon: '✨' },
    { name: 'Edible Flowers', icon: '🌸' },
    { name: 'Chocolate Drizzle', icon: '🍯' },
    { name: 'Caramel Sauce', icon: '🍮' },
    { name: 'Chopped Nuts', icon: '🥜' },
    { name: 'Candy Pieces', icon: '🍬' }
  ];

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleTier = (tierIndex: number) => {
    setCollapsedTiers(prev => ({
      ...prev,
      [tierIndex]: !prev[tierIndex]
    }));
  };

  const toggleColorPicker = (tierIndex: number) => {
    setShowColorPicker(prev => ({
      ...prev,
      [tierIndex]: !prev[tierIndex]
    }));
  };

  const updateDesign = (updates: any) => {
    const newDesign = { ...design, ...updates, updatedAt: new Date(), userId: user?.id || '' };
    setDesign(newDesign);
    setCurrentDesign(newDesign);
  };

  const addTier = () => {
    if (design.layers.length >= 3) {
      alert('Maximum 3 tiers allowed');
      return;
    }
    
    // Collapse all existing tiers when adding a new one
    const newCollapsedTiers: Record<number, boolean> = {};
    design.layers.forEach((_, index) => {
      newCollapsedTiers[index] = true;
    });
    setCollapsedTiers(newCollapsedTiers);
    
    // Copy settings from the previous tier (last tier in array)
    const previousTier = design.layers[design.layers.length - 1];
    const newTier = {
      flavor: previousTier.flavor,
      color: previousTier.color,
      topDesign: 'none', // Reset top design for new tier
      frosting: previousTier.frosting,
      frostingColor: previousTier.frostingColor
    };
    
    updateDesign({ layers: [...design.layers, newTier] });
  };

  const removeTier = (index: number) => {
    if (design.layers.length > 1) {
      const newTiers = design.layers.filter((_, i) => i !== index);
      updateDesign({ layers: newTiers });
      // Remove collapsed state for removed tier
      setCollapsedTiers(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
      // Remove color picker state for removed tier
      setShowColorPicker(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
  };

  const updateTier = (index: number, updates: any) => {
    const newTiers = design.layers.map((tier, i) => 
      i === index ? { ...tier, ...updates } : tier
    );
    updateDesign({ layers: newTiers });
  };

  const toggleTopping = (topping: string) => {
    if (design.toppings.includes(topping)) {
      // Remove topping
      const newToppings = design.toppings.filter(t => t !== topping);
      updateDesign({ toppings: newToppings });
    } else if (design.toppings.length < 2) {
      // Add topping only if less than 2 selected
      const newToppings = [...design.toppings, topping];
      updateDesign({ toppings: newToppings });
    }
  };

  const getToppingIcon = (toppingName: string) => {
    const topping = toppingOptions.find(t => t.name === toppingName);
    return topping ? topping.icon : '🎂';
  };

  const getShapeStyle = (shape: string) => {
    switch (shape) {
      case 'round':
        return { borderRadius: '50%' };
      case 'square':
        return { borderRadius: '8px' };
      default:
        return { borderRadius: '50%' };
    }
  };

  const getFrostingColor = (tier: any) => {
    // Use the custom color if set, or the default frosting color
    return tier.frostingColor || frostingOptions.find(f => f.name.toLowerCase() === (tier.frosting || 'american buttercream').toLowerCase())?.color || '#FFFFFF';
  };

  const getDecorationElement = (topDesign: string, tierIndex: number, isTopTier: boolean) => {
    if (!isTopTier || topDesign === 'none') return null;

    switch (topDesign) {
      case 'drip':
        return (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {[1, 2, 3].map(i => (
              <div 
                key={i}
                className="w-0.5 bg-amber-600 rounded-b-full"
                style={{ height: `${4 + Math.random() * 4}px` }}
              />
            ))}
          </div>
        );
      case 'berries':
        return (
          <div className="absolute -top-1 inset-x-0 flex justify-center space-x-1">
            {[1, 2].map(i => (
              <div key={i} className="text-xs">🍓</div>
            ))}
          </div>
        );
      case 'flowers':
        return (
          <div className="absolute -top-1 inset-x-0 flex justify-center">
            <div className="text-xs" style={{ color: design.buttercream.color }}>
              ❀ ❀
            </div>
          </div>
        );
      case 'creative':
        return (
          <div className="absolute -top-1 inset-x-0 flex justify-center">
            <div className="text-xs">✨</div>
          </div>
        );
      default:
        return null;
    }
  };

  // Generate cake preview as data URL for saving
  const generateCakePreview = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 225; // 4:3 aspect ratio
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 225);
    gradient.addColorStop(0, '#f0f9ff');
    gradient.addColorStop(1, '#dbeafe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 225);
    
    // Draw cake layers
    const centerX = 150;
    const baseY = 180;
    
    design.layers.forEach((tier, index) => {
      const baseDiameter = design.shape === 'round' ? 50 : 45;
      const layerWidth = (design.layers.length - index + 1) * baseDiameter;
      const layerHeight = 40;
      const y = baseY - (index * 35);
      const frostingColor = getFrostingColor(tier);
      
      // Cake layer
      ctx.fillStyle = tier.color;
      if (design.shape === 'round') {
        ctx.beginPath();
        ctx.ellipse(centerX, y, layerWidth / 2, layerHeight / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        const radius = 8;
        ctx.beginPath();
        ctx.roundRect(centerX - layerWidth / 2, y - layerHeight / 2, layerWidth, layerHeight, radius);
        ctx.fill();
      }
      
      // Frosting border
      ctx.strokeStyle = frostingColor;
      ctx.lineWidth = 6;
      if (design.shape === 'round') {
        ctx.beginPath();
        ctx.ellipse(centerX, y, layerWidth / 2, layerHeight / 2, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        const radius = 8;
        ctx.beginPath();
        ctx.roundRect(centerX - layerWidth / 2, y - layerHeight / 2, layerWidth, layerHeight, radius);
        ctx.stroke();
      }
      
      // Frosting lines
      ctx.strokeStyle = frostingColor;
      ctx.lineWidth = 3;
      const lineWidth = layerWidth * 0.7;
      const lineSpacing = layerHeight / 4;
      
      for (let i = 1; i <= 3; i++) {
        const lineY = y - layerHeight / 2 + (i * lineSpacing);
        ctx.beginPath();
        ctx.moveTo(centerX - lineWidth / 2, lineY);
        ctx.lineTo(centerX + lineWidth / 2, lineY);
        ctx.stroke();
      }
    });
    
    // Add toppings indicator
    if (design.toppings.length > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${design.toppings.length} toppings`, 290, 30);
    }
    
    return canvas.toDataURL('image/png', 0.8);
  };

  const handleSave = () => {
    if (!user) {
      alert('Please log in to save designs');
      return;
    }

    const designToSave = {
      ...design,
      id: design.id || Date.now().toString(),
      preview: generateCakePreview(),
      userId: user.id
    };
    
    saveDesign(designToSave, user.id);
    
    // Clear current design to refresh playground
    setCurrentDesign(null);
    
    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    successDiv.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Cake design saved successfully!</span>
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 3000);
  };

  const CollapsibleSection = ({ 
    id, 
    title, 
    icon: Icon, 
    children, 
    defaultOpen = false 
  }: { 
    id: string; 
    title: string; 
    icon: any; 
    children: React.ReactNode; 
    defaultOpen?: boolean;
  }) => {
    const isCollapsed = collapsedSections[id] ?? !defaultOpen;
    
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Icon className="h-5 w-5 mr-2" />
            {title}
          </h3>
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {!isCollapsed && (
          <div className="px-6 pb-6">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Cake Playground</h1>
            <p className="text-gray-600 mt-2">Design and customize your perfect cake</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save Design</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cake Preview - Smaller main box */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Editable Cake Name with clear label */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Design Name:</label>
              <input
                type="text"
                value={design.name}
                onChange={(e) => updateDesign({ name: e.target.value })}
                className="text-xl font-semibold text-gray-900 bg-transparent border-2 border-transparent hover:border-gray-200 focus:border-primary-500 focus:bg-gray-50 px-3 py-2 rounded-lg transition-all w-full outline-none"
                placeholder="Enter cake name"
              />
            </div>
            
            {/* Cake Visualization - Bigger shapes, no overlapping */}
            <div className="w-full h-80 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden">
              {/* Cake Tiers - Bigger and more beautiful, no overlapping */}
              <div className="relative flex flex-col-reverse items-center">
                {design.layers.map((tier, index) => {
                  // Increased base diameter for bigger, more beautiful shapes
                  const baseDiameter = design.shape === 'round' ? 80 : 75;
                  const diameter = (design.layers.length - index + 1) * baseDiameter;
                  const height = 70;
                  const isTopTier = index === design.layers.length - 1;
                  const frostingColor = getFrostingColor(tier);
                  
                  return (
                    <div
                      key={index}
                      className="relative shadow-lg flex items-center justify-center overflow-visible"
                      style={{
                        width: `${diameter}px`,
                        height: `${height}px`,
                        backgroundColor: tier.color,
                        zIndex: design.layers.length - index,
                        border: `4px solid ${frostingColor}`, // Thicker border for better visibility
                        marginTop: index > 0 ? '0px' : '0', // No overlap - tiers touch exactly
                        ...getShapeStyle(design.shape),
                      }}
                    >
                      {/* Enhanced frosting lines with better spacing */}
                      <div className="absolute inset-0 flex flex-col justify-center">
                        <div className="flex flex-col justify-between h-full py-4">
                          {[1, 2, 3].map((lineIndex) => (
                            <div 
                              key={lineIndex}
                              className="h-1" // Thicker lines
                              style={{ 
                                backgroundColor: frostingColor,
                                width: '75%', // Slightly wider
                                margin: '0 auto',
                                borderRadius: design.shape === 'round' ? '50px' : '3px',
                                opacity: 0.9
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Tier Decoration Element */}
                      {getDecorationElement(tier.topDesign, index, isTopTier)}
                    </div>
                  );
                })}
              </div>
              
              {/* Text on Cake */}
              {design.topText && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200">
                    <span className="text-sm font-semibold text-gray-800">{design.topText}</span>
                  </div>
                </div>
              )}
              
              {/* Toppings Icons */}
              {design.toppings.length > 0 && (
                <div className="absolute top-4 right-4 flex space-x-1">
                  {design.toppings.map((topping, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center"
                      title={topping}
                    >
                      <span className="text-sm">{getToppingIcon(topping)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Cake Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">{design.name}</h3>
              
              {/* Overall Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Tiers:</span> {design.layers.length}
                </div>
                <div>
                  <span className="font-medium">Shape:</span> {design.shape}
                </div>
                <div>
                  <span className="font-medium">Buttercream:</span> {design.buttercream.flavor}
                </div>
                <div>
                  <span className="font-medium">Toppings:</span> {design.toppings.length}/2
                </div>
              </div>

              {/* Per-Tier Details */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 text-sm">Tier Details:</h4>
                {design.layers.map((tier, index) => {
                  const isTopTier = index === design.layers.length - 1;
                  const frostingOption = frostingOptions.find(f => f.name.toLowerCase() === (tier.frosting || 'american buttercream').toLowerCase());
                  const frostingColor = getFrostingColor(tier);
                  
                  return (
                    <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-900">
                          Tier {index + 1} {index === 0 ? '(Bottom)' : isTopTier ? '(Top)' : ''}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: tier.color }}
                            title="Cake flavor color"
                          />
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: frostingColor }}
                            title="Frosting color"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Frosting:</span> {frostingOption?.name || 'American Buttercream'}
                        </div>
                        <div>
                          <span className="font-medium">Frosting Flavor:</span> {design.buttercream.flavor}
                        </div>
                        {isTopTier && tier.topDesign && tier.topDesign !== 'none' && (
                          <div className="col-span-2">
                            <span className="font-medium">Decoration:</span> {tierDecorationOptions.find(opt => opt.value === tier.topDesign)?.name || tier.topDesign}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Toppings List */}
              {design.toppings.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Selected Toppings:</h4>
                  <div className="flex flex-wrap gap-2">
                    {design.toppings.map((topping, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs"
                      >
                        <span>{getToppingIcon(topping)}</span>
                        <span>{topping}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Text on Cake */}
              {design.topText && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Text on Cake:</h4>
                  <p className="text-sm text-gray-600 italic">"{design.topText}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="space-y-6">
          {/* Cake Shape */}
          <CollapsibleSection id="shape" title="Cake Shape" icon={Square}>
            <div className="grid grid-cols-2 gap-3">
              {shapeOptions.map(shape => {
                const IconComponent = shape.icon;
                return (
                  <button
                    key={shape.value}
                    onClick={() => updateDesign({ shape: shape.value })}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 ${
                      design.shape === shape.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <IconComponent className="h-6 w-6" />
                    <span className="text-xs font-medium">{shape.name}</span>
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* Tiers - Limited to 3 */}
          <CollapsibleSection id="tiers" title="Tiers" icon={Layers} defaultOpen={true}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={addTier}
                disabled={design.layers.length >= 3}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                  design.layers.length >= 3
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="space-y-3">
              {design.layers.map((tier, index) => {
                const isTierCollapsed = collapsedTiers[index] ?? false;
                const isTopTier = index === design.layers.length - 1;
                const frostingOption = frostingOptions.find(f => f.name.toLowerCase() === (tier.frosting || 'american buttercream').toLowerCase());
                const canCustomizeColor = frostingOption?.hasColor ?? true;
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Tier Header */}
                    <button
                      onClick={() => toggleTier(index)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: tier.color }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Tier {index + 1} - {tier.flavor}
                          {index === 0 ? ' (Bottom)' : isTopTier ? ' (Top)' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {design.layers.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTier(index);
                            }}
                            className="text-error-600 hover:text-error-700 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {isTierCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    {/* Tier Content */}
                    {!isTierCollapsed && (
                      <div className="p-3 border-t border-gray-100">
                        {/* Cake Flavor for this tier */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Cake Flavor</label>
                          <div className="grid grid-cols-2 gap-2">
                            {flavorOptions.map(flavor => (
                              <button
                                key={flavor.name}
                                onClick={() => updateTier(index, { flavor: flavor.name.toLowerCase(), color: flavor.color })}
                                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                                  tier.flavor === flavor.name.toLowerCase()
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div 
                                  className="w-4 h-4 rounded-full mx-auto mb-1"
                                  style={{ backgroundColor: flavor.color }}
                                />
                                {flavor.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Frosting Type for this tier */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-gray-700 flex items-center">
                              Frosting Type
                              {canCustomizeColor && (
                                <button
                                  onClick={() => toggleColorPicker(index)}
                                  className="ml-2 w-6 h-6 rounded-full border-2 border-gray-400 hover:border-gray-600 transition-all shadow-sm hover:shadow-md cursor-pointer relative"
                                  style={{ backgroundColor: getFrostingColor(tier) }}
                                  title="Click to customize frosting color"
                                >
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Palette className="w-3 h-3 text-gray-600" />
                                  </div>
                                </button>
                              )}
                            </label>
                          </div>
                          
                          {/* Color Picker */}
                          {showColorPicker[index] && canCustomizeColor && (
                            <div 
                              ref={(el) => colorPickerRefs.current[index] = el}
                              className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-lg"
                            >
                              <label className="block text-xs font-medium text-gray-700 mb-3">Custom Frosting Color</label>
                              
                              {/* Simplified Color Palette */}
                              <div className="grid grid-cols-6 gap-2 mb-3">
                                {[
                                  '#FFFFFF', '#FFF8DC', '#FFB6C1', '#F5F5DC', '#D2691E', '#8B4513',
                                  '#DAA520', '#FFD700', '#98FB98', '#87CEEB', '#F0E68C', '#FAEBD7'
                                ].map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => updateTier(index, { frostingColor: color })}
                                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                                      (tier.frostingColor || frostingOption?.color) === color 
                                        ? 'border-gray-800 shadow-md' 
                                        : 'border-gray-300 hover:border-gray-500'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                              
                              {/* Custom Color Input */}
                              <div className="space-y-2">
                                <label className="block text-xs text-gray-600">Or choose custom color:</label>
                                <input
                                  type="color"
                                  value={tier.frostingColor || frostingOption?.color || '#FFFFFF'}
                                  onChange={(e) => updateTier(index, { frostingColor: e.target.value })}
                                  className="w-full h-8 rounded border border-gray-300"
                                />
                              </div>
                              
                              <p className="text-xs text-gray-500 mt-2">
                                Note: The final color will vary slightly from your selection.
                              </p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 gap-2">
                            {frostingOptions.map(frosting => (
                              <button
                                key={frosting.name}
                                onClick={() => {
                                  const updates: any = { frosting: frosting.name.toLowerCase() };
                                  // Reset custom color when changing frosting type
                                  if (frosting.hasColor) {
                                    updates.frostingColor = frosting.color;
                                  } else {
                                    updates.frostingColor = undefined;
                                  }
                                  updateTier(index, updates);
                                }}
                                className={`p-2 rounded-lg border-2 transition-all text-xs text-left ${
                                  (tier.frosting || 'american buttercream') === frosting.name.toLowerCase()
                                    ? 'border-secondary-500 bg-secondary-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: frosting.color }}
                                  />
                                  <span>{frosting.name}</span>
                                  {!frosting.hasColor && (
                                    <span className="text-xs text-gray-500">(fixed color)</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Frosting Flavor */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Frosting Flavor</label>
                          <div className="grid grid-cols-2 gap-2">
                            {buttercreamOptions.map(buttercream => (
                              <button
                                key={buttercream.name}
                                onClick={() => updateDesign({ 
                                  buttercream: { flavor: buttercream.name.toLowerCase(), color: buttercream.color }
                                })}
                                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                                  design.buttercream.flavor === buttercream.name.toLowerCase()
                                    ? 'border-secondary-500 bg-secondary-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div 
                                  className="w-4 h-4 rounded-full mx-auto mb-1"
                                  style={{ backgroundColor: buttercream.color }}
                                />
                                {buttercream.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tier Decoration (only for top tier) */}
                        {isTopTier && (
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 mb-2">Tier Decoration</label>
                            <div className="grid grid-cols-1 gap-2">
                              {tierDecorationOptions.map(decoration => {
                                const IconComponent = decoration.icon;
                                return (
                                  <button
                                    key={decoration.value}
                                    onClick={() => updateTier(index, { topDesign: decoration.value })}
                                    className={`p-2 rounded-lg border-2 transition-all text-xs text-left ${
                                      (tier.topDesign || 'none') === decoration.value
                                        ? 'border-accent-500 bg-accent-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <IconComponent className="h-4 w-4" />
                                      <div>
                                        <div className="font-medium">{decoration.name}</div>
                                        <div className="text-gray-500">{decoration.description}</div>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* Toppings */}
          <CollapsibleSection id="toppings" title={`Toppings (${design.toppings.length}/2)`} icon={Cookie}>
            {design.toppings.length >= 2 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Maximum 2 toppings selected. Deselect one to choose a different topping.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-2">
              {toppingOptions.map(topping => {
                const isSelected = design.toppings.includes(topping.name);
                const isDisabled = !isSelected && design.toppings.length >= 2;
                
                return (
                  <button
                    key={topping.name}
                    onClick={() => toggleTopping(topping.name)}
                    disabled={isDisabled}
                    className={`p-2 text-sm rounded-lg border transition-all text-left flex items-center space-x-2 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : isDisabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-lg">{topping.icon}</span>
                    <span>{topping.name}</span>
                  </button>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* Text on Cake - Moved outside collapsible section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <Type className="h-5 w-5 mr-2" />
              Text on Cake
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom writing on top of cake
              </label>
              <input
                type="text"
                value={design.topText}
                onChange={(e) => updateDesign({ topText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter text for cake top (e.g., Happy Birthday!)"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum 50 characters. Leave blank for no text.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};