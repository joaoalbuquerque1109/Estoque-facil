import { parseISO } from "date-fns";
import { supabase } from "./supabase";

export type Product = {
  id: string;
  image?: string;
  name: string;
  name_lowercase: string;
  code: string;
  patrimony: string;
  type: "consumo" | "permanente";
  quantity: number;
  unit: string;
  category: string;
  reference: string;
};

export type Movement = {
  id: string;
  productId: string;
  date: string;
  type: "Entrada" | "Saída" | "Devolução" | "Auditoria";
  entryType?: "Oficial" | "Não Oficial";
  quantity: number;
  responsible: string;
  department?: string;
  supplier?: string;
  invoice?: string;
  productType?: "consumo" | "permanente";
  changes?: string;
};

type EntryData = {
  items: { id: string; quantity: number }[];
  date: string;
  supplier: string;
  invoice?: string;
  responsible: string;
  entryType: "Oficial" | "Não Oficial";
};

type ExitData = {
  items: { id: string; quantity: number }[];
  date: string;
  requester: string;
  department: string;
  purpose?: string;
  responsible: string;
};

export type ExitRequestType = "consumption" | "responsibility";
export type ExitRequestStatus = "pending" | "approved" | "completed" | "rejected";

export type ExitRequestItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  patrimony?: string;
};

type ExitRequestInput = {
  requestType: ExitRequestType;
  items: ExitRequestItem[];
  requestDate: string;
  requesterName: string;
  requesterDocument: string;
  responsibleName: string;
  responsibleDocument: string;
  department: string;
  purpose?: string;
  submittedByEmail: string;
};

type ReturnData = {
  items: { id: string; quantity: number }[];
  date: string;
  department: string;
  reason: string;
  responsible: string;
};

type MovementFilters = {
  startDate?: string;
  endDate?: string;
  movementType?: string;
  materialType?: string;
  department?: string;
};

type ProductFilters = {
  searchTerm?: string;
  materialType?: "consumo" | "permanente";
};

type ImageObject = {
  base64: string;
  fileName: string;
  contentType: string;
};

export interface User {
  uid: string;
  email: string;
  role: "Admin" | "Operator";
}

export interface ExitRequest {
  id: string;
  requestType: ExitRequestType;
  status: ExitRequestStatus;
  submittedBy: string | null;
  submittedByEmail: string;
  requesterName: string;
  requesterDocument: string;
  responsibleName: string;
  responsibleDocument: string;
  department: string;
  purpose: string | null;
  requestDate: string;
  items: ExitRequestItem[];
  approvedBy: string | null;
  approvedByEmail: string | null;
  approvedAt: string | null;
  finalizedByEmail: string | null;
  finalizedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapMovement(doc: any): Movement {
  return {
    id: doc.id,
    productId: doc.product_id,
    date: doc.date,
    type: doc.type,
    entryType: doc.entry_type ?? undefined,
    quantity: doc.quantity,
    responsible: doc.responsible,
    department: doc.department ?? undefined,
    supplier: doc.supplier ?? undefined,
    invoice: doc.invoice ?? undefined,
    productType: doc.product_type ?? undefined,
    changes: doc.changes ?? undefined,
  };
}

function mapExitRequest(doc: any): ExitRequest {
  return {
    id: doc.id,
    requestType: doc.request_type,
    status: doc.status,
    submittedBy: doc.submitted_by,
    submittedByEmail: doc.submitted_by_email,
    requesterName: doc.requester_name,
    requesterDocument: doc.requester_document,
    responsibleName: doc.responsible_name,
    responsibleDocument: doc.responsible_document,
    department: doc.department,
    purpose: doc.purpose,
    requestDate: doc.request_date,
    items: Array.isArray(doc.items) ? doc.items : [],
    approvedBy: doc.approved_by,
    approvedByEmail: doc.approved_by_email,
    approvedAt: doc.approved_at,
    finalizedByEmail: doc.finalized_by_email,
    finalizedAt: doc.finalized_at,
    rejectionReason: doc.rejection_reason,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

export const getUserRole = async (uid: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();

    if (error || !data) {
      return null;
    }

    return data.role || null;
  } catch (error) {
    console.error("Erro ao buscar a funcao do utilizador:", error);
    return null;
  }
};

export const getProducts = async (filters: ProductFilters = {}): Promise<Product[]> => {
  const { searchTerm, materialType } = filters;

  try {
    let query = supabase.from("products").select("*");

    if (materialType) {
      query = query.eq("type", materialType);
    }

    if (searchTerm && searchTerm.length > 0) {
      const lowercasedTerm = searchTerm.toLowerCase();
      query = query.or(`name_lowercase.ilike.%${lowercasedTerm}%,code.eq.${searchTerm}`);
    }

    const { data, error } = await query.order("name_lowercase", { ascending: true });

    if (error) {
      console.error("Erro ao buscar produtos:", error);
      return [];
    }

    return data.map((doc) => ({
      id: doc.id,
      ...doc,
    })) as Product[];
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
};

export const addProduct = async (productData: Omit<Product, "id">): Promise<string> => {
  try {
    const { data, error } = await supabase.from("products").insert([productData]).select("id").single();

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
    const { error } = await supabase.from("products").update(productData).eq("id", productId);

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
    const { error } = await supabase.from("products").delete().eq("id", productId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Erro ao eliminar produto:", error);
    throw error;
  }
};

export const uploadImage = async (imageObject: ImageObject) => {
  if (!imageObject || !imageObject.base64) {
    return "https://placehold.co/40x40.png";
  }

  try {
    const { base64, fileName, contentType } = imageObject;
    const fileNameWithTimestamp = `products/${Date.now()}_${fileName}`;

    const byteCharacters = atob(base64.split(",")[1] || base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    const { error } = await supabase.storage.from("products").upload(fileNameWithTimestamp, blob, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      return "https://placehold.co/40x40.png";
    }

    const { data: publicData } = supabase.storage.from("products").getPublicUrl(fileNameWithTimestamp);
    return publicData.publicUrl;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem com Base64:", error);
    return "https://placehold.co/40x40.png";
  }
};

export const generateNextItemCode = async (prefix: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("code")
      .ilike("code", `${prefix}%`)
      .order("code", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return `${prefix}-001`;
    }

    const lastCode = data[0].code;
    const lastNumber = parseInt(lastCode.split("-").pop() || "0", 10);
    const nextNumber = lastNumber + 1;
    const formattedNextNumber = nextNumber.toString().padStart(3, "0");

    return `${prefix}-${formattedNextNumber}`;
  } catch (error) {
    console.error("Erro ao gerar proximo codigo de item:", error);
    return `${prefix}-001`;
  }
};

export const finalizeEntry = async (entryData: EntryData): Promise<void> => {
  try {
    for (const item of entryData.items) {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, quantity, type")
        .eq("id", item.id)
        .single();

      if (productError || !productData) {
        throw new Error(`Produto com ID ${item.id} nao encontrado.`);
      }

      const newQuantity = productData.quantity + item.quantity;

      await supabase.from("products").update({ quantity: newQuantity }).eq("id", item.id);

      const movementData: Omit<Movement, "id"> = {
        productId: item.id,
        date: entryData.date,
        type: "Entrada",
        quantity: item.quantity,
        responsible: entryData.responsible,
        supplier: entryData.supplier,
        entryType: entryData.entryType,
        productType: productData.type,
      };

      if (entryData.invoice) {
        movementData.invoice = entryData.invoice;
      }

      await supabase.from("movements").insert([
        {
          product_id: movementData.productId,
          date: movementData.date,
          type: movementData.type,
          entry_type: movementData.entryType,
          quantity: movementData.quantity,
          responsible: movementData.responsible,
          supplier: movementData.supplier,
          invoice: movementData.invoice,
          product_type: movementData.productType,
        },
      ]);
    }
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
};

export const finalizeExit = async (exitData: ExitData): Promise<void> => {
  try {
    for (const item of exitData.items) {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, quantity, type, name")
        .eq("id", item.id)
        .single();

      if (productError || !productData) {
        throw new Error(`Produto com ID ${item.id} nao encontrado.`);
      }

      const currentQuantity = productData.quantity;
      if (currentQuantity < item.quantity) {
        throw new Error(`Estoque insuficiente para ${productData.name}.`);
      }

      const newQuantity = currentQuantity - item.quantity;
      await supabase.from("products").update({ quantity: newQuantity }).eq("id", item.id);

      const movementData: Omit<Movement, "id"> = {
        productId: item.id,
        date: exitData.date,
        type: "Saída",
        quantity: item.quantity,
        responsible: exitData.responsible,
        department: exitData.department,
        productType: productData.type,
      };

      await supabase.from("movements").insert([
        {
          product_id: movementData.productId,
          date: movementData.date,
          type: movementData.type,
          quantity: movementData.quantity,
          responsible: movementData.responsible,
          department: movementData.department,
          product_type: movementData.productType,
        },
      ]);
    }
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
};

export const createExitRequest = async (requestData: ExitRequestInput): Promise<string> => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Nao foi possivel identificar o usuario autenticado.");
    }

    const { data, error } = await supabase
      .from("exit_requests")
      .insert([
        {
          request_type: requestData.requestType,
          status: "pending",
          submitted_by: user.id,
          submitted_by_email: requestData.submittedByEmail,
          requester_name: requestData.requesterName,
          requester_document: requestData.requesterDocument,
          responsible_name: requestData.responsibleName,
          responsible_document: requestData.responsibleDocument,
          department: requestData.department,
          purpose: requestData.purpose ?? null,
          request_date: requestData.requestDate,
          items: requestData.items,
        },
      ])
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error("Erro ao criar solicitacao de saida:", error);
    throw new Error("Nao foi possivel enviar a solicitacao de saida.");
  }
};

export const getExitRequests = async (status?: ExitRequestStatus): Promise<ExitRequest[]> => {
  try {
    let query = supabase.from("exit_requests").select("*").order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapExitRequest);
  } catch (error) {
    console.error("Erro ao buscar solicitacoes de saida:", error);
    throw new Error("Nao foi possivel carregar as solicitacoes de saida.");
  }
};

export const approveExitRequest = async (
  requestId: string,
  approverEmail: string
): Promise<ExitRequest> => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Nao foi possivel identificar o administrador autenticado.");
    }

    const { data: requestData, error: requestError } = await supabase
      .from("exit_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !requestData) {
      throw new Error("Solicitacao de saida nao encontrada.");
    }

    const request = mapExitRequest(requestData);

    if (request.status !== "pending") {
      throw new Error("A solicitacao selecionada ja foi processada.");
    }

    const { data: updatedData, error: updateError } = await supabase
      .from("exit_requests")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_by_email: approverEmail,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
        finalized_by_email: null,
        finalized_at: null,
      })
      .eq("id", requestId)
      .select("*")
      .single();

    if (updateError || !updatedData) {
      throw updateError ?? new Error("Nao foi possivel atualizar a solicitacao.");
    }

    return mapExitRequest(updatedData);
  } catch (error) {
    console.error("Erro ao aprovar solicitacao de saida:", error);
    throw error instanceof Error
      ? error
      : new Error("Nao foi possivel aprovar a solicitacao de saida.");
  }
};

export const completeExitRequest = async (
  requestId: string,
  finalizerEmail: string
): Promise<ExitRequest> => {
  try {
    const { data: requestData, error: requestError } = await supabase
      .from("exit_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !requestData) {
      throw new Error("Solicitacao de saida nao encontrada.");
    }

    const request = mapExitRequest(requestData);

    if (request.status !== "approved") {
      throw new Error("Somente solicitacoes aprovadas podem gerar termo.");
    }

    await finalizeExit({
      items: request.items.map((item) => ({ id: item.id, quantity: item.quantity })),
      date: new Date().toISOString(),
      requester: `${request.requesterName} (${request.requesterDocument})`,
      department: request.department,
      purpose: request.purpose ?? undefined,
      responsible:
        `Responsavel:${request.responsibleName} CPF:${request.responsibleDocument} ` +
        `Solicitante:${request.requesterName} CPF:${request.requesterDocument} ` +
        `Finalizado por:${finalizerEmail}`,
    });

    const { data: updatedData, error: updateError } = await supabase
      .from("exit_requests")
      .update({
        status: "completed",
        finalized_by_email: finalizerEmail,
        finalized_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select("*")
      .single();

    if (updateError || !updatedData) {
      throw updateError ?? new Error("Nao foi possivel concluir a solicitacao.");
    }

    return mapExitRequest(updatedData);
  } catch (error) {
    console.error("Erro ao concluir solicitacao de saida:", error);
    throw error instanceof Error
      ? error
      : new Error("Nao foi possivel concluir a solicitacao de saida.");
  }
};

export const rejectExitRequest = async (
  requestId: string,
  approverEmail: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Nao foi possivel identificar o administrador autenticado.");
    }

    const { error } = await supabase
      .from("exit_requests")
      .update({
        status: "rejected",
        approved_by: user.id,
        approved_by_email: approverEmail,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason ?? null,
      })
      .eq("id", requestId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Erro ao rejeitar solicitacao de saida:", error);
    throw new Error("Nao foi possivel rejeitar a solicitacao de saida.");
  }
};

export const finalizeReturn = async (returnData: ReturnData): Promise<void> => {
  try {
    for (const item of returnData.items) {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, quantity, type")
        .eq("id", item.id)
        .single();

      if (productError || !productData) {
        throw new Error(`Produto com ID ${item.id} nao encontrado.`);
      }

      const newQuantity = productData.quantity + item.quantity;
      await supabase.from("products").update({ quantity: newQuantity }).eq("id", item.id);

      const movementData: Omit<Movement, "id"> = {
        productId: item.id,
        date: returnData.date,
        type: "Devolução",
        quantity: item.quantity,
        responsible: returnData.responsible,
        department: returnData.department,
        productType: productData.type,
      };

      await supabase.from("movements").insert([
        {
          product_id: movementData.productId,
          date: movementData.date,
          type: movementData.type,
          quantity: movementData.quantity,
          responsible: movementData.responsible,
          department: movementData.department,
          product_type: movementData.productType,
        },
      ]);
    }
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
};

export const getMovements = async (filters: MovementFilters = {}): Promise<Movement[]> => {
  const { startDate, endDate, movementType, materialType, department } = filters;

  try {
    let query = supabase.from("movements").select("*");

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      const toDate = new Date(parseISO(endDate));
      toDate.setHours(23, 59, 59, 999);
      query = query.lte("date", toDate.toISOString());
    }

    if (movementType && movementType !== "all") {
      query = query.eq("type", movementType);
    }

    if (department && department !== "all") {
      query = query.eq("department", department);
    }

    if (materialType && materialType !== "all") {
      query = query.eq("product_type", materialType);
    }

    const { data, error } = await query.order("date", { ascending: false });

    if (error) {
      console.error("Erro ao buscar movimentos:", error);
      return [];
    }

    return (data ?? []).map(mapMovement);
  } catch (error) {
    console.error("Erro ao buscar movimentos:", error);
    return [];
  }
};

export const getMovementsForItem = async (productId: string): Promise<Movement[]> => {
  try {
    const { data, error } = await supabase
      .from("movements")
      .select("*")
      .eq("product_id", productId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Erro ao buscar movimentos do produto:", error);
      return [];
    }

    return (data ?? []).map(mapMovement);
  } catch (error) {
    console.error("Erro ao buscar movimentos do produto:", error);
    return [];
  }
};

export const addMovement = async (movementData: Omit<Movement, "id">): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("movements")
      .insert([
        {
          product_id: movementData.productId,
          date: movementData.date,
          type: movementData.type,
          entry_type: movementData.entryType,
          quantity: movementData.quantity,
          responsible: movementData.responsible,
          department: movementData.department,
          supplier: movementData.supplier,
          invoice: movementData.invoice,
          product_type: movementData.productType,
          changes: movementData.changes,
        },
      ])
      .select("id")
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

export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase.from("profiles").select("id, email, role").order("email", { ascending: true });

    if (error) {
      throw error;
    }

    return data.map((doc) => ({
      uid: doc.id,
      email: doc.email,
      role: doc.role as "Admin" | "Operator",
    }));
  } catch (error) {
    console.error("Erro ao buscar utilizadores:", error);
    throw new Error("Nao foi possivel buscar os utilizadores.");
  }
};

export const updateUserRole = async (uid: string, role: "Admin" | "Operator"): Promise<void> => {
  try {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", uid);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Erro ao atualizar a role do utilizador:", error);
    throw new Error("Nao foi possivel atualizar a role do utilizador.");
  }
};
