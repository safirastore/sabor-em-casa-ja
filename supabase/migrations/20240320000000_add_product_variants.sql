-- Create product_options table
CREATE TABLE IF NOT EXISTS product_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create option_variations table
CREATE TABLE IF NOT EXISTS option_variations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_options_product_id ON product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_option_variations_option_id ON option_variations(option_id);

-- Add RLS policies
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_variations ENABLE ROW LEVEL SECURITY;

-- Policies for product_options
CREATE POLICY "Enable read access for all users" ON product_options
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON product_options
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON product_options
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON product_options
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for option_variations
CREATE POLICY "Enable read access for all users" ON option_variations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON option_variations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON option_variations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON option_variations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_options_updated_at
    BEFORE UPDATE ON product_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_option_variations_updated_at
    BEFORE UPDATE ON option_variations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 