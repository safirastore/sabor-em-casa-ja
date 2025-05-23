import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '@/integrations/stripe/client';
import { createPaymentIntent } from '@/integrations/stripe/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

interface CreditCardPaymentProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
}

const PaymentForm = ({ orderId, amount, onSuccess }: CreditCardPaymentProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        throw error;
      }

      // Atualizar status do pedido
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing'
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      toast.success('Pagamento realizado com sucesso!');
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao processar pagamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button
        type="submit"
        className="w-full mt-4"
        disabled={!stripe || loading}
      >
        {loading ? 'Processando...' : 'Pagar'}
      </Button>
    </form>
  );
};

const CreditCardPayment = (props: CreditCardPaymentProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  React.useEffect(() => {
    const initializePayment = async () => {
      try {
        const { clientSecret: secret } = await createPaymentIntent(props.amount, props.orderId);
        setClientSecret(secret);
      } catch (error: any) {
        toast.error('Erro ao inicializar pagamento: ' + error.message);
      }
    };

    initializePayment();
  }, [props.amount, props.orderId]);

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pagamento com Cartão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Elements stripe={getStripe()} options={{ clientSecret }}>
          <PaymentForm {...props} />
        </Elements>
      </CardContent>
    </Card>
  );
};

export default CreditCardPayment; 