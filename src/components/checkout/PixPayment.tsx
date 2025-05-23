import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QrCode } from 'lucide-react';

interface PixPaymentProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
}

export const PixPayment: React.FC<PixPaymentProps> = ({
  orderId,
  amount,
  onSuccess
}) => {
  const [pixCode, setPixCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generatePixCode();
  }, [orderId, amount]);

  const generatePixCode = async () => {
    try {
      setIsLoading(true);

      // Here you would integrate with your PIX payment provider
      // For now, we'll simulate a PIX code generation
      const mockPixCode = `00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540599.905802BR5915LOJA EXEMPLO6008BRASILIA62070503***6304E2CA`;

      // Update order with PIX code
      const { error } = await supabase
        .from('orders')
        .update({
          payment_details: {
            pix_code: mockPixCode,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', orderId);

      if (error) throw error;

      setPixCode(mockPixCode);
    } catch (error: any) {
      toast.error('Erro ao gerar código PIX: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success('Código PIX copiado!');
  };

  if (isLoading) {
    return <div>Gerando código PIX...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento via PIX</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
            <QrCode className="w-48 h-48" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Escaneie o QR Code acima ou copie o código PIX abaixo:
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
              {pixCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyPixCode}
            >
              Copiar
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Após o pagamento, seu pedido será confirmado automaticamente.</p>
          <p>Valor: R$ {amount.toFixed(2)}</p>
        </div>

        <Button
          className="w-full"
          onClick={onSuccess}
        >
          Já realizei o pagamento
        </Button>
      </CardContent>
    </Card>
  );
}; 