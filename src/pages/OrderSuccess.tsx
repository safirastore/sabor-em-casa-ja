import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Header from '@/components/Header';

const OrderSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <CardTitle className="text-2xl">Pedido Realizado com Sucesso!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Seu pedido foi recebido e está sendo processado.
                </p>
                <p className="text-muted-foreground">
                  Você receberá atualizações sobre o status do seu pedido.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Continuar Comprando
                </Button>
                <Button
                  onClick={() => navigate('/orders')}
                >
                  Ver Meus Pedidos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess; 