// lib/constants/productStatus.ts

export enum ProductStatus {
  Draft = "Draft",
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  InStock = "InStock",
  OutOfStock = "OutOfStock",
  Archived = "Archived",
}

export type ProductStatusValue = keyof typeof ProductStatus;

// Legacy constants - kept for backward compatibility
export const ProductStatusMap: Record<
  ProductStatusValue,
  { label: string; color: string; icon: string }
> = {
  Draft: { label: "Bản nháp", color: "gray", icon: "📝" },
  Pending: { label: "Chờ duyệt", color: "yellow", icon: "⏳" },
  Approved: { label: "Đã duyệt", color: "green", icon: "✅" },
  Rejected: { label: "Bị từ chối", color: "red", icon: "❌" },
  InStock: { label: "Còn hàng", color: "blue", icon: "📦" },
  OutOfStock: { label: "Hết hàng", color: "orange", icon: "🚫" },
  Archived: { label: "Ngừng kinh doanh", color: "gray", icon: "📁" },
};

export const ProductStatusLabel: Record<ProductStatusValue, string> = {
  Draft: "Bản nháp",
  Pending: "Chờ duyệt",
  Approved: "Đã duyệt",
  Rejected: "Bị từ chối",
  InStock: "Còn hàng",
  OutOfStock: "Hết hàng",
  Archived: "Ngừng kinh doanh",
};

// New i18n-aware functions
export const getProductStatusLabel = (status: ProductStatusValue, t: (key: string) => string): string => {
  const statusKeyMap: Record<ProductStatusValue, string> = {
    Draft: "productStatus.draft",
    Pending: "productStatus.pending",
    Approved: "productStatus.approved",
    Rejected: "productStatus.rejected",
    InStock: "productStatus.inStock",
    OutOfStock: "productStatus.outOfStock",
    Archived: "productStatus.archived",
  };
  
  return t(statusKeyMap[status]);
};

export const getProductStatusMap = (t: (key: string) => string): Record<
  ProductStatusValue,
  { label: string; color: string; icon: string }
> => {
  return {
    Draft: { label: t("productStatus.draft"), color: "gray", icon: "📝" },
    Pending: { label: t("productStatus.pending"), color: "yellow", icon: "⏳" },
    Approved: { label: t("productStatus.approved"), color: "green", icon: "✅" },
    Rejected: { label: t("productStatus.rejected"), color: "red", icon: "❌" },
    InStock: { label: t("productStatus.inStock"), color: "blue", icon: "📦" },
    OutOfStock: { label: t("productStatus.outOfStock"), color: "orange", icon: "🚫" },
    Archived: { label: t("productStatus.archived"), color: "gray", icon: "📁" },
  };
};


