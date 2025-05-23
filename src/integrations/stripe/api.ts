import { supabase } from '../supabase/client';

export const createPaymentIntent = async (amount: number, orderId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { amount, orderId }
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error('Erro ao criar intenção de pagamento: ' + error.message);
  }
}; 