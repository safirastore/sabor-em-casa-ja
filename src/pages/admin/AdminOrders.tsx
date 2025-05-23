import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, PackageOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { OrderDB, OrderStatus, OrderItem } from '@/types/product';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '@/components/Header';

const OrderStatusMap = {
  'pending': { label: 'Pendente', color: 'bg-yellow-500' },
  'processing': { label: 'Em preparação', color: 'bg-amber-500' },
  'delivering': { label: 'Em entrega', color: 'bg-blue-500' },
  'delivered': { label: 'Entregue', color: 'bg-green-500' },
  'cancelled': { label: 'Cancelado', color: 'bg-red-500' }
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<OrderDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDB | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchTerm]);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles (
            name,
            phone,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (searchTerm) {
        query = query.or(`id.ilike.%${searchTerm}%,profiles.name.ilike.%${searchTerm}%,profiles.email.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      const processedOrders: OrderDB[] = (data || []).map(order => {
        const parsedItems = typeof order.items === 'string' 
          ? JSON.parse(order.items) 
          : (Array.isArray(order.items) ? order.items : []);
        
        const parsedAddress = typeof order.address === 'string' 
          ? JSON.parse(order.address) 
          : order.address;
        
        let profilesData = null;
        if (order.profiles && typeof order.profiles === 'object' && !('error' in order.profiles)) {
          profilesData = order.profiles;
        }

        return {
          id: order.id,
          user_id: order.user_id,
          items: parsedItems,
          status: order.status,
          total: order.total,
          delivery_fee: order.delivery_fee,
          address: parsedAddress,
          created_at: order.created_at || '',
          updated_at: order.updated_at || '',
          profiles: profilesData
        } as OrderDB;
      });
      
      setOrders(processedOrders);
    } catch (error: any) {
      toast.error(`Erro ao buscar pedidos: ${error.message}`);
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      if (error) throw error;
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() } 
          : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          updated_at: new Date().toISOString()
        });
      }
      
      toast.success('Status do pedido atualizado com sucesso');
    } catch (error: any) {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  };
  
  const viewOrderDetails = (order: OrderDB) => {
    const parsedOrder = {
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      address: typeof order.address === 'string' ? JSON.parse(order.address) : order.address
    };
    
    setSelectedOrder(parsedOrder);
    setIsDetailsOpen(true);
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      console.error('Error parsing date:', error);
      return dateString;
    }
  };
  
  const filteredOrders = orders;
  
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Pedidos</h1>

        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Pedido #{order.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "PPpp", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={`${OrderStatusMap[order.status as OrderStatus]?.color || 'bg-gray-500'} hover:${OrderStatusMap[order.status as OrderStatus]?.color || 'bg-gray-500'}`}>
                      {OrderStatusMap[order.status as OrderStatus]?.label || 'Desconhecido'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Itens do Pedido</h3>
                    <div className="space-y-2">
                      {Array.isArray(order.items) && order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x - R$ {item.unit_price.toFixed(2)}
                          </span>
                          <span className="font-medium">
                            R$ {(item.quantity * item.unit_price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Endereço de Entrega</h3>
                    <p className="text-sm">{order.address?.street}, {order.address?.number}</p>
                    <p className="text-sm">{order.address?.neighborhood}</p>
                    <p className="text-sm">{order.address?.city}, {order.address?.state}</p>
                    <p className="text-sm">{order.address?.zipCode}</p>
                  </div>

                  {order.notes && (
                    <div>
                      <h3 className="font-medium mb-2">Observações</h3>
                      <p className="text-sm">{order.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium">Status do Pedido</label>
                        <Select
                          value={order.status}
                          onValueChange={(value: OrderStatus) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="processing">Em preparação</SelectItem>
                            <SelectItem value="delivering">Em entrega</SelectItem>
                            <SelectItem value="delivered">Entregue</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">R$ {order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
