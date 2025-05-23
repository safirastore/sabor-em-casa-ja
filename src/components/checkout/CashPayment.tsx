import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Banknote } from 'lucide-react';

interface CashPaymentProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
}

export const CashPayment: React.FC<CashPaymentProps> = ({
  orderId,
  amount,
  onSuccess
}) => {
  const handleConfirm = async () => {
    try {
      // Update order with payment details
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'pending',
          payment_details: {
            payment_type: 'cash',
            amount: amount,
            confirmed_at: new Date().toISOString()
          }
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Pedido confirmado! Aguarde a entrega.');
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao confirmar pedido: ' + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento em Dinheiro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center p-4">
          <Banknote className="w-16 h-16 text-muted-foreground" />
        </div>

        <div className="text-center space-y-2">
          <p className="text-lg font-medium">
            Valor total: R$ {amount.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">
            O pagamento será realizado no momento da entrega.
          </p>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>Instruções:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Tenha o valor exato em mãos</li>
            <li>O entregador não carrega troco</li>
            <li>Confira o valor antes de pagar</li>
          </ul>
        </div>

        <Button
          className="w-full"
          onClick={handleConfirm}
        >
          Confirmar Pedido
        </Button>
      </CardContent>
    </Card>
  );
}; 