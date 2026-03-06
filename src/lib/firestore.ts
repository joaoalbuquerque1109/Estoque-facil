import { supabase } from './supabase';
import { parseISO } from 'date-fns';

export type Product = {
    id: string;
    image?: string;
    name: string;
    name_lowercase: string;
    code: string;
    patrimony: string;
    type: 'consumo' | 'permanente';
    quantity: number;
    unit: string;
    category: string;
    reference: string;
};

export type Movement = {
    id: string;
    productId: string;
    date: string; 
    type: 'Entrada' | 'Saída' | 'Devolução' | "Auditoria";
    entryType?: 'Oficial' | 'Não Oficial';
    quantity: number;
    responsible: string;
    department?: string;
    supplier?: string;
    invoice?: string;
    productType?: 'consumo' | 'permanente';
    changes?: string;
};

type EntryData = {
    items: { id: string; quantity: number }[];
    date: string;
    supplier: string;
    invoice?: string;
    responsible: string;
    entryType: 'Oficial' | 'Não Oficial';
}

type ExitData = {
    items: { id: string; quantity: number }[];
    date: string;
    requester: string;
    department: string;
    purpose?: string;
    responsible: string;
}

type ReturnData = {
    items: { id: string; quantity: number }[];
    date: string;
    department: string;
    reason: string;
    responsible: string;
}

type MovementFilters = {
  startDate?: string;
  endDate?: string;
  movementType?: string;
  materialType?: string;
  department?: string;
};

type ProductFilters = {
    searchTerm?: string;
    materialType?: 'consumo' | 'permanente';
}

export const getUserRole = async (uid: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', uid)
      .single();
    
    if (error || !data) {
      return null;
    }
    return data.role || null;
  } catch (error) {
    console.error("Erro ao buscar a função do utilizador:", error);
    return null;
  }
};

export const getProducts = async (filters: ProductFilters = {}): Promise<Product[]> => {
    const { searchTerm, materialType } = filters;
    
    try {
        let query = supabase.from('products').select('*');
        
        if (materialType) {
            query = query.eq('type', materialType);
        }
        
        if (searchTerm && searchTerm.length > 0) {
            const lowercasedTerm = searchTerm.toLowerCase();
            query = query.or(
                `name_lowercase.ilike.%${lowercasedTerm}%,code.eq.${searchTerm}`
            );
        }
        
        const { data, error } = await query.order('name_lowercase', { ascending: true });
        
        if (error) {
            console.error("Erro ao buscar produtos:", error);
            return [];
        }
        
        return data.map(doc => ({
            id: doc.id,
            ...doc
        })) as Product[];
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        return [];
    }
};


export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select('id')
            .single();
        
        if (error) {
            throw error;
        }
        
        return data.id;
    } catch (error) {
        console.error("Erro ao adicionar produto:", error);
        throw error;
    }
};

export const updateProduct = async (productId: string, productData: Partial<Product>): Promise<void> => {
    try {
        const { error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', productId);
        
        if (error) {
            throw error;
        }
    } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        throw error;
    }
};

export const deleteProduct = async (productId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) {
            throw error;
        }
    } catch (error) {
        console.error("Erro ao eliminar produto:", error);
        throw error;
    }
};

type ImageObject = {
  base64: string;
  fileName: string;
  contentType: string;
};

export const uploadImage = async (imageObject: ImageObject) => {
  if (!imageObject || !imageObject.base64) {
    return "https://placehold.co/40x40.png";
  }
  try {
    const { base64, fileName, contentType } = imageObject;
    const fileNameWithTimestamp = `products/${Date.now()}_${fileName}`;
    
    // Convert base64 to blob
    const byteCharacters = atob(base64.split(',')[1] || base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileNameWithTimestamp, blob, {
        contentType: contentType,
        upsert: false
      });
    
    if (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      return "https://placehold.co/40x40.png";
    }
    
    const { data: publicData } = supabase.storage
      .from('products')
      .getPublicUrl(fileNameWithTimestamp);
    
    return publicData.publicUrl;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem com Base64:", error);
    return "https://placehold.co/40x40.png";
  }
};

export const generateNextItemCode = async (prefix: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('code')
      .ilike('code', `${prefix}%`)
      .order('code', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return `${prefix}-001`;
    }
    
    const lastCode = data[0].code;
    const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
    const nextNumber = lastNumber + 1;
    const formattedNextNumber = nextNumber.toString().padStart(3, '0');
    
    return `${prefix}-${formattedNextNumber}`;
  } catch (error) {
    console.error("Erro ao gerar próximo código de item:", error);
    return `${prefix}-001`;
  }
};

export const finalizeEntry = async (entryData: EntryData): Promise<void> => {
    try {
        for (const item of entryData.items) {
            // Get current product
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('id, quantity, type')
                .eq('id', item.id)
                .single();
            
            if (productError || !productData) {
                throw new Error(`Produto com ID ${item.id} não encontrado.`);
            }
            
            // Update product quantity
            const newQuantity = productData.quantity + item.quantity;
            await supabase
                .from('products')
                .update({ quantity: newQuantity })
                .eq('id', item.id);
            
            // Add movement record
            const movementData: Omit<Movement, 'id'> = {
                productId: item.id,
                date: entryData.date,
                type: 'Entrada',
                quantity: item.quantity,
                responsible: entryData.responsible,
                supplier: entryData.supplier,
                entryType: entryData.entryType,
                productType: productData.type,
            };
            
            if (entryData.invoice) {
                movementData.invoice = entryData.invoice;
            }
            
            await supabase
                .from('movements')
                .insert([movementData]);
        }
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const finalizeExit = async (exitData: ExitData): Promise<void> => {
    try {
        for (const item of exitData.items) {
            // Get current product
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('id, quantity, type, name')
                .eq('id', item.id)
                .single();
            
            if (productError || !productData) {
                throw new Error(`Produto com ID ${item.id} não encontrado.`);
            }
            
            const currentQuantity = productData.quantity;
            if (currentQuantity < item.quantity) {
                throw new Error(`Estoque insuficiente para ${productData.name}.`);
            }
            
            // Update product quantity
            const newQuantity = currentQuantity - item.quantity;
            await supabase
                .from('products')
                .update({ quantity: newQuantity })
                .eq('id', item.id);
            
            // Add movement record
            const movementData: Omit<Movement, 'id'> = {
                productId: item.id,
                date: exitData.date,
                type: 'Saída',
                quantity: item.quantity,
                responsible: exitData.responsible,
                department: exitData.department,
                productType: productData.type,
            };
            
            await supabase
                .from('movements')
                .insert([movementData]);
        }
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const finalizeReturn = async (returnData: ReturnData): Promise<void> => {
     try {
        for (const item of returnData.items) {
            // Get current product
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('id, quantity, type')
                .eq('id', item.id)
                .single();
            
            if (productError || !productData) {
                throw new Error(`Produto com ID ${item.id} não encontrado.`);
            }
            
            // Update product quantity
            const newQuantity = productData.quantity + item.quantity;
            await supabase
                .from('products')
                .update({ quantity: newQuantity })
                .eq('id', item.id);
            
            // Add movement record
            const movementData: Omit<Movement, 'id'> = {
                productId: item.id,
                date: returnData.date,
                type: 'Devolução',
                quantity: item.quantity,
                responsible: returnData.responsible,
                department: returnData.department,
                productType: productData.type,
            };
            
            await supabase
                .from('movements')
                .insert([movementData]);
        }
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const getMovements = async (filters: MovementFilters = {}): Promise<Movement[]> => {
    const { startDate, endDate, movementType, materialType, department } = filters;
    
    try {
        let query = supabase.from('movements').select('*');
        
        if (startDate) {
            query = query.gte('date', startDate);
        }
        
        if (endDate) {
            const toDate = new Date(parseISO(endDate));
            toDate.setHours(23, 59, 59, 999);
            query = query.lte('date', toDate.toISOString());
        }
        
        if (movementType && movementType !== 'all') {
            query = query.eq('type', movementType);
        }
        
        if (department && department !== 'all') {
            query = query.eq('department', department);
        }
        
        if (materialType && materialType !== 'all') {
            query = query.eq('productType', materialType);
        }
        
        const { data, error } = await query.order('date', { ascending: false });
        
        if (error) {
            console.error("Erro ao buscar movimentos:", error);
            return [];
        }
        
        return data.map(doc => ({
            id: doc.id,
            ...doc
        })) as Movement[];
    } catch (error) {
        console.error("Erro ao buscar movimentos:", error);
        return [];
    }
};

export const getMovementsForItem = async (productId: string): Promise<Movement[]> => {
    try {
        const { data, error } = await supabase
            .from('movements')
            .select('*')
            .eq('productId', productId)
            .order('date', { ascending: false });
        
        if (error) {
            console.error("Erro ao buscar movimentos do produto:", error);
            return [];
        }
        
        return data.map(doc => ({
            id: doc.id,
            ...doc
        })) as Movement[];
    } catch (error) {
        console.error("Erro ao buscar movimentos do produto:", error);
        return [];
    }
}

export const addMovement = async (movementData: Omit<Movement, 'id'>): Promise<string> => {
    try {
        const { data, error } = await supabase
            .from('movements')
            .insert([movementData])
            .select('id')
            .single();
        
        if (error) {
            throw error;
        }
        
        return data.id;
    } catch (error) {
        console.error("Erro ao adicionar movimento:", error);
        throw error;
    }
};

export interface User {
  uid: string;
  email: string;
  role: 'Admin' | 'Operator';
}

export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role');
    
    if (error) {
      throw error;
    }
    
    return data.map(doc => ({
      uid: doc.id,
      email: doc.email,
      role: doc.role as 'Admin' | 'Operator'
    }));
  } catch (error) {
    console.error("Erro ao buscar utilizadores:", error);
    throw new Error("Não foi possível buscar os utilizadores.");
  }
};

export const updateUserRole = async (uid: string, role: 'Admin' | 'Operator'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: role })
      .eq('id', uid);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Erro ao atualizar a role do utilizador:", error);
    throw new Error("Não foi possível atualizar a role do utilizador.");
  }
};
