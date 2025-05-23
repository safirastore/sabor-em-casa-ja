import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';

interface ProductOption {
  id: string;
  title: string;
  required: boolean;
  variations: {
    id: string;
    name: string;
    price: number;
  }[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  options: ProductOption[];
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productError) throw productError;

        // Fetch product options
        const { data: optionsData, error: optionsError } = await supabase
          .from('product_options')
          .select(`
            id,
            title,
            required,
            option_variations (
              id,
              name,
              price
            )
          `)
          .eq('product_id', id);

        if (optionsError) throw optionsError;

        setProduct({
          ...productData,
          options: optionsData.map(option => ({
            id: option.id,
            title: option.title,
            required: option.required,
            variations: option.option_variations
          }))
        });
      } catch (error: any) {
        toast.error('Erro ao carregar produto: ' + error.message);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const handleOptionChange = (optionId: string, variationId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: variationId
    }));
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Check if all required options are selected
    const missingRequired = product.options
      .filter(option => option.required)
      .some(option => !selectedOptions[option.id]);

    if (missingRequired) {
      toast.error('Selecione todas as opções obrigatórias');
      return;
    }

    // Calculate total price including variations
    let totalPrice = product.price;
    Object.entries(selectedOptions).forEach(([optionId, variationId]) => {
      const option = product.options.find(opt => opt.id === optionId);
      const variation = option?.variations.find(v => v.id === variationId);
      if (variation) {
        totalPrice += variation.price;
      }
    });

    addToCart({
      id: `${product.id}-${Object.values(selectedOptions).join('-')}`,
      productId: product.id,
      name: product.name,
      price: totalPrice,
      quantity,
      selectedOptions
    });

    toast.success('Produto adicionado ao carrinho');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Produto não encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-auto rounded-lg"
            />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground mt-2">{product.description}</p>
            </div>

            <div className="space-y-4">
              {product.options.map(option => (
                <Card key={option.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {option.title}
                      {option.required && <span className="text-red-500 ml-1">*</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedOptions[option.id]}
                      onValueChange={(value) => handleOptionChange(option.id, value)}
                    >
                      {option.variations.map(variation => (
                        <div key={variation.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={variation.id} id={variation.id} />
                          <Label htmlFor={variation.id} className="flex-1">
                            {variation.name}
                            {variation.price > 0 && (
                              <span className="text-muted-foreground ml-2">
                                +R$ {variation.price.toFixed(2)}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                >
                  -
                </Button>
                <span className="w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(prev => prev + 1)}
                >
                  +
                </Button>
              </div>

              <Button
                className="flex-1"
                onClick={handleAddToCart}
              >
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
