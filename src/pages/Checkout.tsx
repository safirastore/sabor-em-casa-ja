import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentMethod } from '@/types/payment';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { PixPayment } from '@/components/checkout/PixPayment';
import { CreditCardPayment } from '@/components/checkout/CreditCardPayment';
import { CashPayment } from '@/components/checkout/CashPayment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { storeInfo } = useStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const createOrder = async () => {
    if (!selectedMethod) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    if (!address) {
      toast.error('Informe o endereço de entrega');
      return;
    }

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          payment_method_id: selectedMethod.id,
          payment_status: 'pending',
          total_amount: total,
          delivery_address: address,
          notes: notes
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        selected_options: Object.entries(item.selectedOptions || {}).map(([optionId, variationIds]) => ({
          optionId,
          variationIds
        }))
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderId(order.id);
    } catch (error: any) {
      toast.error('Erro ao criar pedido: ' + error.message);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    navigate('/order-success');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h1>
            <Button onClick={() => navigate('/')}>
              Continuar Comprando
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Endereço Completo</label>
                  <Textarea
                    placeholder="Rua, número, complemento, bairro..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea
                    placeholder="Instruções para entrega..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}x R$ {item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {!orderId ? (
              <>
                <PaymentMethodSelector
                  onSelect={handlePaymentMethodSelect}
                  selectedMethodId={selectedMethod?.id}
                />

                <Button
                  className="w-full"
                  onClick={createOrder}
                  disabled={!selectedMethod || !address}
                >
                  Finalizar Pedido
                </Button>
              </>
            ) : (
              <>
                {selectedMethod?.type === 'pix' && (
                  <PixPayment
                    orderId={orderId}
                    amount={total}
                    onSuccess={handlePaymentSuccess}
                  />
                )}

                {selectedMethod?.type === 'credit_card' && (
                  <CreditCardPayment
                    orderId={orderId}
                    amount={total}
                    onSuccess={handlePaymentSuccess}
                  />
                )}

                {selectedMethod?.type === 'cash' && (
                  <CashPayment
                    orderId={orderId}
                    amount={total}
                    onSuccess={handlePaymentSuccess}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
