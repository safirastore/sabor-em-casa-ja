import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod, PaymentMethodType } from '@/types/payment';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  type: z.enum(['pix', 'credit_card', 'cash'] as const),
  is_active: z.boolean().default(true),
  config: z.object({
    instructions: z.string().optional(),
    provider: z.string().optional(),
  }).default({}),
});

type FormData = z.infer<typeof formSchema>;

export const PaymentMethods: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'pix',
      is_active: true,
      config: {},
    },
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name');

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar métodos de pagamento: ' + error.message);
    }
  };

  const onSubmit = async (formData: FormData) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('payment_methods')
        .insert({
          name: formData.name,
          type: formData.type,
          is_active: formData.is_active,
          config: formData.config,
        });

      if (error) throw error;

      toast.success('Método de pagamento adicionado com sucesso!');
      form.reset();
      fetchPaymentMethods();
    } catch (error: any) {
      toast.error('Erro ao adicionar método de pagamento: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: !method.is_active })
        .eq('id', method.id);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
      fetchPaymentMethods();
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Método de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: PIX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativo</FormLabel>
                      <FormDescription>
                        Este método de pagamento estará disponível para os clientes
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adicionando..." : "Adicionar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{method.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Tipo: {method.type === 'pix' ? 'PIX' : method.type === 'credit_card' ? 'Cartão de Crédito' : 'Dinheiro'}
                  </p>
                </div>
                <Switch
                  checked={method.is_active}
                  onCheckedChange={() => toggleActive(method)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 