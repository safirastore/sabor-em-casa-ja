import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CartItem } from '@/types/product';
import { supabase } from '@/integrations/supabase/client';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // Load cart from localStorage on mount
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const calculateItemTotal = (item: CartItem) => {
    let total = item.price * item.quantity;

    // Add prices from selected variations
    if (item.selectedOptions) {
      Object.entries(item.selectedOptions).forEach(([optionId, variationIds]) => {
        variationIds.forEach(variationId => {
          // Find the variation price from the database
          const fetchVariationPrice = async () => {
            const { data, error } = await supabase
              .from('option_variations')
              .select('price')
              .eq('id', variationId)
              .single();

            if (!error && data) {
              total += data.price * item.quantity;
            }
          };

          fetchVariationPrice();
        });
      });
    }

    return total;
  };

  const addToCart = (newItem: CartItem) => {
    setItems(prevItems => {
      // Check if item with same ID and options already exists
      const existingItemIndex = prevItems.findIndex(item => {
        if (item.id !== newItem.id) return false;

        // Compare selected options
        const itemOptions = JSON.stringify(item.selectedOptions);
        const newItemOptions = JSON.stringify(newItem.selectedOptions);
        return itemOptions === newItemOptions;
      });

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        updatedItems[existingItemIndex].totalPrice = calculateItemTotal(updatedItems[existingItemIndex]);
        return updatedItems;
      }

      // Add new item
      return [...prevItems, { ...newItem, totalPrice: calculateItemTotal(newItem) }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    setItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, quantity };
          updatedItem.totalPrice = calculateItemTotal(updatedItem);
          return updatedItem;
        }
        return item;
      });
      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
