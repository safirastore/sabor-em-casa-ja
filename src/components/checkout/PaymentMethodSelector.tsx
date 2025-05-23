import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod } from '@/types/payment';
import { toast } from 'sonner';

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod) => void;
  selectedMethodId?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onSelect,
  selectedMethodId
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar métodos de pagamento: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Carregando métodos de pagamento...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Forma de Pagamento</h3>
      
      <RadioGroup
        value={selectedMethodId}
        onValueChange={(value) => {
          const method = paymentMethods.find(m => m.id === value);
          if (method) onSelect(method);
        }}
        className="space-y-4"
      >
        {paymentMethods.map((method) => (
          <Card key={method.id}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{method.name}</div>
                  {method.config.instructions && (
                    <p className="text-sm text-muted-foreground">
                      {method.config.instructions}
                    </p>
                  )}
                </Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
}; 