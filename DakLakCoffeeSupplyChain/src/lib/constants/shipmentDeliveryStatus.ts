// lib/constants/shipmentDeliveryStatus.ts
import { useTranslation } from "react-i18next";

export type ShipmentDeliveryStatusValue =
  | "Pending"
  | "InTransit"
  | "Delivered"
  | "Failed"
  | "Returned"
  | "Canceled";

export const useShipmentDeliveryStatusMap = () => {
  const { t } = useTranslation();
  
  return {
    Pending: { label: t('shipments.status.pending'), color: "gray", icon: "⏳" },
    InTransit: { label: t('shipments.status.inTransit'), color: "purple", icon: "🚚" },
    Delivered: { label: t('shipments.status.delivered'), color: "green", icon: "✅" },
    Failed: { label: t('shipments.status.failed'), color: "red", icon: "❌" },
    Returned: { label: t('shipments.status.returned'), color: "orange", icon: "↩️" },
    Canceled: { label: t('shipments.status.canceled'), color: "red", icon: "🛑" },
  } as Record<
    ShipmentDeliveryStatusValue,
    { label: string; color: string; icon: string }
  >;
};

// Giữ lại map cũ để tương thích ngược (deprecated)
export const ShipmentDeliveryStatusMap: Record<
  ShipmentDeliveryStatusValue,
  { label: string; color: string; icon: string }
> = {
  Pending: { label: "Đang chờ", color: "gray", icon: "⏳" },
  InTransit: { label: "Đang giao", color: "purple", icon: "🚚" },
  Delivered: { label: "Đã giao", color: "green", icon: "✅" },
  Failed: { label: "Thất bại", color: "red", icon: "❌" },
  Returned: { label: "Hoàn trả", color: "orange", icon: "↩️" },
  Canceled: { label: "Đã huỷ", color: "red", icon: "🛑" },
};

