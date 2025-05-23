import React from 'react';
import { ProductOption, OptionVariation } from '@/types/product';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ProductVariantsProps {
  options: ProductOption[];
  selectedOptions: Record<string, string[]>;
  onOptionChange: (optionId: string, value: string[]) => void;
  className?: string;
}

export const ProductVariants: React.FC<ProductVariantsProps> = ({
  options,
  selectedOptions,
  onOptionChange,
  className
}) => {
  const handleSingleSelect = (optionId: string, value: string) => {
    onOptionChange(optionId, [value]);
  };

  const handleMultiSelect = (optionId: string, value: string, checked: boolean) => {
    const currentValues = selectedOptions[optionId] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    onOptionChange(optionId, newValues);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {options.map((option) => (
        <div key={option.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">
              {option.title}
              {option.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>

          {option.variations.length > 0 && (
            <div className="space-y-2">
              {option.variations.map((variation) => (
                <div key={variation.id} className="flex items-center space-x-2">
                  {option.required ? (
                    <RadioGroup
                      value={selectedOptions[option.id]?.[0] || ''}
                      onValueChange={(value) => handleSingleSelect(option.id, value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={variation.id} id={variation.id} />
                        <Label htmlFor={variation.id} className="flex-1">
                          {variation.name}
                          {variation.price > 0 && (
                            <span className="text-sm text-muted-foreground ml-2">
                              (+R$ {variation.price.toFixed(2)})
                            </span>
                          )}
                        </Label>
                      </div>
                    </RadioGroup>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={variation.id}
                        checked={selectedOptions[option.id]?.includes(variation.id) || false}
                        onCheckedChange={(checked) => 
                          handleMultiSelect(option.id, variation.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={variation.id} className="flex-1">
                        {variation.name}
                        {variation.price > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            (+R$ {variation.price.toFixed(2)})
                          </span>
                        )}
                      </Label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 