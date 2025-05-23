-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pix', 'credit_card', 'cash')),
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create orders table with payment information
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    payment_method_id UUID REFERENCES payment_methods(id),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_details JSONB DEFAULT '{}',
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    selected_options JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON orders(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Add RLS policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for payment_methods
CREATE POLICY "Enable read access for all users" ON payment_methods
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON payment_methods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON payment_methods
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON payment_methods
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for orders
CREATE POLICY "Enable read access for own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for order_items
CREATE POLICY "Enable read access for own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for authenticated users" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Add triggers for updated_at
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment methods
INSERT INTO payment_methods (name, type, config) VALUES
    ('PIX', 'pix', '{"instructions": "Escaneie o QR Code para pagar"}'),
    ('Cartão de Crédito', 'credit_card', '{"provider": "stripe"}'),
    ('Dinheiro', 'cash', '{"instructions": "Pagamento na entrega"}'); 