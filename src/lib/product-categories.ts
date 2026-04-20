export const PRODUCT_CATEGORIES = ["Medicação", "Insumos"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const CATEGORY_ALIASES: Record<string, ProductCategory> = {
  medicacao: "Medicação",
  medicacoes: "Medicação",
  medicamento: "Medicação",
  medicamentos: "Medicação",
  insumo: "Insumos",
  insumos: "Insumos",
};

const normalizeCategoryKey = (category: string) =>
  category
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const isProductCategory = (category: string): category is ProductCategory =>
  PRODUCT_CATEGORIES.includes(category as ProductCategory);

export const normalizeProductCategory = (category?: string | null): ProductCategory => {
  if (!category) {
    return "Insumos";
  }

  const key = normalizeCategoryKey(category);
  return CATEGORY_ALIASES[key] ?? (isProductCategory(category) ? category : "Insumos");
};
