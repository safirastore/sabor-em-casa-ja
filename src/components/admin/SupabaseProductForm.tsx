import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { ProductOptionDB, OptionVariationDB } from '@/types/product';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';

// Schema for product options (variants)
const productOptionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: "Título da opção é obrigatório" }),
  required: z.boolean().default(false),
  variations: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, { message: "Nome da variante é obrigatório" }),
    price: z.preprocess(
      (val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val),
      z.number().min(0, { message: "Preço deve ser maior ou igual a zero." })
    ),
  })).min(1, { message: "Adicione ao menos uma variante" })
});

// Main form schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Nome do produto é obrigatório" }),
  description: z.string().optional(),
  price: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val),
    z.number().min(0, { message: "Preço deve ser maior ou igual a zero." })
  ),
  category_id: z.string().min(1, { message: "Categoria é obrigatória" }),
  image_url: z.string().url({ message: "URL da imagem inválida" }),
  popular: z.boolean().default(false),
  vegetarian: z.boolean().default(false),
  product_options: z.array(productOptionSchema).optional()
});

type FormData = z.infer<typeof formSchema>;

interface SupabaseProductFormProps {
  product?: Tables['products'];
  onSuccess: () => void;
  onCancel: () => void;
}

const SupabaseProductForm: React.FC<SupabaseProductFormProps> = ({ product, onSuccess, onCancel }) => {
  const [categories, setCategories] = useState<Tables['categories'][]>([]);
  const [productOptions, setProductOptions] = useState<ProductOptionDB[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price ? Number(product.price) : 0,
      category_id: product?.category_id || '',
      image_url: product?.image_url || '',
      popular: product?.popular || false,
      vegetarian: product?.vegetarian || false,
      product_options: []
    }
  });

  const { fields: optionsFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: "product_options"
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (error: any) {
        toast.error("Erro ao carregar categorias: " + error.message);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProductOptions = async () => {
      if (!product?.id) return;
      
      try {
        const { data: optionsData, error: optionsError } = await supabase
          .from('product_options')
          .select('*')
          .eq('product_id', product.id)
          .order('title');
        
        if (optionsError) throw optionsError;
        
        if (!optionsData || optionsData.length === 0) {
          setProductOptions([]);
          form.setValue('product_options', []);
          return;
        }
        
        const optionsWithVariations: ProductOptionDB[] = [];
        
        for (const option of optionsData) {
          const { data: variationsData, error: variationsError } = await supabase
            .from('option_variations')
            .select('*')
            .eq('option_id', option.id)
            .order('name');
          
          if (variationsError) throw variationsError;
          
          optionsWithVariations.push({
            ...option,
            option_variations: variationsData || []
          });
        }
        
        setProductOptions(optionsWithVariations);
        
        // Transform data for form
        const formattedOptions = optionsWithVariations.map((option) => ({
          id: option.id,
          title: option.title,
          required: option.required,
          variations: option.option_variations ? option.option_variations.map((variation) => ({
            id: variation.id,
            name: variation.name,
            price: Number(variation.price || 0),
          })) : []
        }));
        
        form.setValue('product_options', formattedOptions);
      } catch (error: any) {
        toast.error("Erro ao buscar opções do produto: " + error.message);
        console.error(error);
      }
    };
    
    fetchProductOptions();
  }, [product, form]);

  const addOption = () => {
    appendOption({ 
      title: '',
      required: false,
      variations: [{ name: '', price: 0 }]
    });
  };

  const addVariation = (optionIndex: number) => {
    const currentOptions = form.getValues().product_options || [];
    if (!currentOptions[optionIndex]) return;
    
    const updatedOptions = [...currentOptions];
    updatedOptions[optionIndex].variations.push({ name: '', price: 0 });
    
    form.setValue('product_options', updatedOptions);
  };

  const removeVariation = (optionIndex: number, variationIndex: number) => {
    const currentOptions = form.getValues().product_options || [];
    if (!currentOptions[optionIndex]) return;
    
    const updatedOptions = [...currentOptions];
    updatedOptions[optionIndex].variations.splice(variationIndex, 1);
    
    form.setValue('product_options', updatedOptions);
  };

  const onSubmit = async (formData: FormData) => {
    try {
      setIsLoading(true);

      let productId = product?.id;

      if (!productId) {
        // Insert new product
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            name: formData.name,
            description: formData.description,
            price: formData.price,
            category_id: formData.category_id,
            image_url: formData.image_url,
            popular: formData.popular,
            vegetarian: formData.vegetarian
          })
          .select()
          .single();

        if (insertError) throw insertError;
        productId = newProduct.id;
      } else {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            price: formData.price,
            category_id: formData.category_id,
            image_url: formData.image_url,
            popular: formData.popular,
            vegetarian: formData.vegetarian
          })
          .eq('id', productId);

        if (updateError) throw updateError;
      }

      // Handle product options
      if (productId && formData.product_options && formData.product_options.length > 0) {
        // Get existing options to compare
        const { data: existingOptions } = await supabase
          .from('product_options')
          .select('id')
          .eq('product_id', productId);

        const existingOptionIds = new Set((existingOptions || []).map(o => o.id));
        const newOptionIds = new Set(formData.product_options.filter(o => o.id).map(o => o.id as string));

        // Delete options that no longer exist
        const optionsToDelete = [...existingOptionIds].filter(id => !newOptionIds.has(id));
        if (optionsToDelete.length > 0) {
          const { error } = await supabase
            .from('product_options')
            .delete()
            .in('id', optionsToDelete);

          if (error) throw error;
        }

        // Process each option
        for (const option of formData.product_options) {
          if (option.id) {
            // Update existing option
            const { error } = await supabase
              .from('product_options')
              .update({
                title: option.title,
                required: option.required
              })
              .eq('id', option.id);

            if (error) throw error;

            // Get existing variations
            const { data: existingVariations } = await supabase
              .from('option_variations')
              .select('id')
              .eq('option_id', option.id);

            const existingVariationIds = new Set((existingVariations || []).map(v => v.id));
            const newVariationIds = new Set(option.variations.filter(v => v.id).map(v => v.id as string));

            // Delete variations that no longer exist
            const variationsToDelete = [...existingVariationIds].filter(id => !newVariationIds.has(id));
            if (variationsToDelete.length > 0) {
              const { error } = await supabase
                .from('option_variations')
                .delete()
                .in('id', variationsToDelete);

              if (error) throw error;
            }

            // Update or insert variations
            for (const variation of option.variations) {
              if (variation.id) {
                // Update existing variation
                const { error } = await supabase
                  .from('option_variations')
                  .update({
                    name: variation.name,
                    price: variation.price
                  })
                  .eq('id', variation.id);

                if (error) throw error;
              } else {
                // Insert new variation
                const { error } = await supabase
                  .from('option_variations')
                  .insert({
                    option_id: option.id,
                    name: variation.name,
                    price: variation.price
                  });

                if (error) throw error;
              }
            }
          } else {
            // Insert new option
            const { data: newOption, error } = await supabase
              .from('product_options')
              .insert({
                product_id: productId,
                title: option.title,
                required: option.required
              })
              .select();

            if (error) throw error;

            if (newOption && newOption[0]) {
              // Insert all variations for this new option
              const variationsToInsert = option.variations.map(variation => ({
                option_id: newOption[0].id,
                name: variation.name,
                price: variation.price
              }));

              const { error: variationError } = await supabase
                .from('option_variations')
                .insert(variationsToInsert);

              if (variationError) throw variationError;
            }
          }
        }
      }

      toast.success(product ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao salvar produto: " + error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{product ? "Editar Produto" : "Novo Produto"}</CardTitle>
            <CardDescription>
              {product ? "Atualize as informações do produto" : "Preencha as informações do novo produto"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: X-Burger" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o produto..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-4">
              <FormField
                control={form.control}
                name="popular"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Produto Popular</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vegetarian"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Opção Vegetariana</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Opções de Produto (Variantes)</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addOption}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Adicionar Opção
            </Button>
          </div>
          
          {optionsFields.map((optionField, optionIndex) => (
            <div key={optionField.id} className="border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Opção {optionIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(optionIndex)}
                  className="h-7 w-7 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`product_options.${optionIndex}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Opção</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Tamanho" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`product_options.${optionIndex}.required`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Obrigatório</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="text-sm font-medium">Variantes</h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addVariation(optionIndex)}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Variante
                  </Button>
                </div>
                
                {form.getValues().product_options?.[optionIndex]?.variations.map((_, variationIndex) => (
                  <div key={variationIndex} className="flex items-end gap-2 border-b pb-2">
                    <FormField
                      control={form.control}
                      name={`product_options.${optionIndex}.variations.${variationIndex}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Calabresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`product_options.${optionIndex}.variations.${variationIndex}.price`}
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormLabel className="text-xs">Preço Adicional</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariation(optionIndex, variationIndex)}
                      className="h-7 w-7 p-0 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : product ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SupabaseProductForm;
