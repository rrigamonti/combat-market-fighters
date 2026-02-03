import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface ColumnMapping {
  name: number;
  brand?: number;
  price: number;
  external_url: number;
  image_url?: number;
  category?: number;
  short_description?: number;
  network_product_id?: number;
}

interface ProductFeedMapperProps {
  content: string;
  onMappingChange: (mapping: ColumnMapping | null) => void;
}

const FIELD_OPTIONS = [
  { value: 'name', label: 'Product Name *', required: true },
  { value: 'brand', label: 'Brand', required: false },
  { value: 'price', label: 'Price *', required: true },
  { value: 'external_url', label: 'Product URL *', required: true },
  { value: 'image_url', label: 'Image URL', required: false },
  { value: 'category', label: 'Category', required: false },
  { value: 'short_description', label: 'Description', required: false },
  { value: 'network_product_id', label: 'Product ID', required: false },
  { value: '', label: '— Skip —', required: false },
];

function parseCSVPreview(content: string, delimiter: string = ','): string[][] {
  const rows: string[][] = [];
  const lines = content.split(/\r?\n/).slice(0, 6); // Header + 5 rows
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}

export function ProductFeedMapper({ content, onMappingChange }: ProductFeedMapperProps) {
  const [columnMappings, setColumnMappings] = useState<Record<number, string>>({});
  
  const parsedData = useMemo(() => parseCSVPreview(content), [content]);
  const headers = parsedData[0] || [];
  const previewRows = parsedData.slice(1, 4);

  // Auto-detect common column names
  useEffect(() => {
    const autoMappings: Record<number, string> = {};
    
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase().trim();
      
      if (lowerHeader.includes('name') || lowerHeader === 'title' || lowerHeader === 'product') {
        autoMappings[index] = 'name';
      } else if (lowerHeader.includes('brand') || lowerHeader === 'manufacturer') {
        autoMappings[index] = 'brand';
      } else if (lowerHeader.includes('price') || lowerHeader === 'cost') {
        autoMappings[index] = 'price';
      } else if (lowerHeader.includes('url') || lowerHeader === 'link' || lowerHeader === 'href') {
        if (lowerHeader.includes('image') || lowerHeader.includes('img') || lowerHeader.includes('photo')) {
          autoMappings[index] = 'image_url';
        } else {
          autoMappings[index] = 'external_url';
        }
      } else if (lowerHeader.includes('category') || lowerHeader === 'type') {
        autoMappings[index] = 'category';
      } else if (lowerHeader.includes('description') || lowerHeader === 'desc') {
        autoMappings[index] = 'short_description';
      } else if (lowerHeader.includes('id') || lowerHeader === 'sku' || lowerHeader === 'product_id') {
        autoMappings[index] = 'network_product_id';
      }
    });
    
    setColumnMappings(autoMappings);
  }, [headers]);

  // Update parent with mapping changes
  useEffect(() => {
    const mapping: Partial<ColumnMapping> = {};
    
    Object.entries(columnMappings).forEach(([indexStr, field]) => {
      if (field) {
        const index = parseInt(indexStr, 10);
        (mapping as Record<string, number>)[field] = index;
      }
    });

    // Check if required fields are mapped
    if (
      typeof mapping.name === 'number' &&
      typeof mapping.price === 'number' &&
      typeof mapping.external_url === 'number'
    ) {
      onMappingChange(mapping as ColumnMapping);
    } else {
      onMappingChange(null);
    }
  }, [columnMappings, onMappingChange]);

  const handleMappingChange = (columnIndex: number, field: string) => {
    setColumnMappings((prev) => {
      const newMappings = { ...prev };
      
      // Remove this field from any other column
      Object.keys(newMappings).forEach((key) => {
        if (newMappings[parseInt(key, 10)] === field) {
          delete newMappings[parseInt(key, 10)];
        }
      });
      
      // Set new mapping
      if (field) {
        newMappings[columnIndex] = field;
      } else {
        delete newMappings[columnIndex];
      }
      
      return newMappings;
    });
  };

  const getMissingFields = () => {
    const mappedFields = new Set(Object.values(columnMappings));
    return FIELD_OPTIONS.filter(
      (opt) => opt.required && !mappedFields.has(opt.value)
    ).map((opt) => opt.label);
  };

  const missingFields = getMissingFields();

  if (!headers.length) {
    return (
      <div className="p-4 text-center text-muted-foreground border rounded-lg">
        No data to preview. Please upload or paste valid CSV content.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Column Mapping</Label>
        {missingFields.length > 0 && (
          <p className="text-xs text-destructive">
            Missing: {missingFields.join(', ')}
          </p>
        )}
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} className="min-w-[140px]">
                  <div className="space-y-1">
                    <p className="font-medium truncate" title={header}>
                      {header || `Column ${index + 1}`}
                    </p>
                    <Select
                      value={columnMappings[index] || ''}
                      onValueChange={(value) => handleMappingChange(index, value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Map to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value || '_skip'}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((_, colIndex) => (
                  <TableCell key={colIndex} className="text-xs truncate max-w-[200px]">
                    {row[colIndex] || '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing first {previewRows.length} rows. Map columns to product fields. * = required.
      </p>
    </div>
  );
}
