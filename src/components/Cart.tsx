import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/types/product';

interface CartItemWithVariations extends CartItem {
  variationDetails?: {
    [key: string]: {
      optionTitle: string;
      variationName: string;
      price: number;
    };
  };
}

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, total } = useCart();
  const [itemsWithDetails, setItemsWithDetails] = useState<CartItemWithVariations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVariationDetails = async () => {
      try {
        const itemsWithVariations = await Promise.all(
          items.map(async (item) => {
            const variationDetails: { [key: string]: any } = {};

            if (item.selectedOptions) {
              for (const [optionId, variationIds] of Object.entries(item.selectedOptions)) {
                // Fetch option details
                const { data: optionData } = await supabase
                  .from('product_options')
                  .select('title')
                  .eq('id', optionId)
                  .single();

                // Fetch variation details
                const { data: variationData } = await supabase
                  .from('option_variations')
                  .select('name, price')
                  .eq('id', variationIds[0])
                  .single();

                if (optionData && variationData) {
                  variationDetails[optionId] = {
                    optionTitle: optionData.title,
                    variationName: variationData.name,
                    price: variationData.price
                  };
                }
              }
            }

            return {
              ...item,
              variationDetails
            };
          })
        );

        setItemsWithDetails(itemsWithVariations);
      } catch (error) {
        console.error('Error fetching variation details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariationDetails();
  }, [items]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-lg text-muted-foreground">Seu carrinho está vazio</p>
        <Button onClick={() => navigate('/')}>Continuar Comprando</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {itemsWithDetails.map((item) => (
          <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg">
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-md"
            />
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <h3 className="font-medium">{item.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.id)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {item.variationDetails && Object.entries(item.variationDetails).length > 0 && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {Object.entries(item.variationDetails).map(([optionId, details]) => (
                    <div key={optionId}>
                      <span className="font-medium">{details.optionTitle}:</span>{' '}
                      {details.variationName}
                      {details.price > 0 && (
                        <span className="ml-1">(+R$ {details.price.toFixed(2)})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="font-medium">
                  R$ {item.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex justify-between text-lg font-medium">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>

        <Button
          className="w-full"
          onClick={() => navigate('/checkout')}
        >
          Finalizar Pedido
        </Button>
      </div>
    </div>
  );
}; 