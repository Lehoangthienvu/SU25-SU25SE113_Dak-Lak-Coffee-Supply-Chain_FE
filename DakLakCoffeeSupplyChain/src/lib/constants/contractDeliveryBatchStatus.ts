// lib/constants/contractDeliveryBatchStatus.ts

export enum ContractDeliveryBatchStatus {
  Planned = "Planned",        // Đã lên kế hoạch
  InProgress = "InProgress",  // Đang giao hàng
  Fulfilled = "Fulfilled",    // Đã hoàn thành
  Cancelled = "Cancelled",    // Huỷ
}

// Function để lấy label theo ngôn ngữ
export const getContractDeliveryBatchStatusLabel = (
  status: ContractDeliveryBatchStatus,
  t: (key: string) => string
): string => {
  switch (status) {
    case ContractDeliveryBatchStatus.Planned:
      return t("contractDeliveryBatches.status.planned");
    case ContractDeliveryBatchStatus.InProgress:
      return t("contractDeliveryBatches.status.inProgress");
    case ContractDeliveryBatchStatus.Fulfilled:
      return t("contractDeliveryBatches.status.fulfilled");
    case ContractDeliveryBatchStatus.Cancelled:
      return t("contractDeliveryBatches.status.cancelled");
    default:
      return String(status);
  }
};

// Function để lấy display map theo ngôn ngữ
export const getDeliveryBatchDisplayMap = (t: (key: string) => string) => ({
  ALL: {
    label: t("contractDeliveryBatches.status.all"),
    color: "gray",
    icon: "📝",
  },
  [ContractDeliveryBatchStatus.Planned]: {
    label: t("contractDeliveryBatches.status.planned"),
    color: "purple",
    icon: "📦",
  },
  [ContractDeliveryBatchStatus.InProgress]: {
    label: t("contractDeliveryBatches.status.inProgress"),
    color: "green",
    icon: "🚚",
  },
  [ContractDeliveryBatchStatus.Fulfilled]: {
    label: t("contractDeliveryBatches.status.fulfilled"),
    color: "blue",
    icon: "✅",
  },
  [ContractDeliveryBatchStatus.Cancelled]: {
    label: t("contractDeliveryBatches.status.cancelled"),
    color: "red",
    icon: "❌",
  },
});

// Legacy: Giữ lại để tương thích ngược (sẽ deprecated)
export const ContractDeliveryBatchStatusLabel: Record<ContractDeliveryBatchStatus, string> = {
  [ContractDeliveryBatchStatus.Planned]: 'Chuẩn bị giao',
  [ContractDeliveryBatchStatus.InProgress]: 'Đang thực hiện',
  [ContractDeliveryBatchStatus.Fulfilled]: 'Hoàn thành',
  [ContractDeliveryBatchStatus.Cancelled]: 'Đã hủy',
};

// Legacy: Giữ lại để tương thích ngược (sẽ deprecated)
export const deliveryBatchDisplayMap: Record<
  ContractDeliveryBatchStatus | "ALL",
  {
    label: string;
    color: string;
    icon: string;
  }
> = {
  ALL: {
    label: "Tất cả trạng thái",
    color: "gray",
    icon: "📝",
  },
  [ContractDeliveryBatchStatus.Planned]: {
    label: "Chuẩn bị giao",
    color: "purple",
    icon: "📦",
  },
  [ContractDeliveryBatchStatus.InProgress]: {
    label: "Đang thực hiện",
    color: "green",
    icon: "🚚",
  },
  [ContractDeliveryBatchStatus.Fulfilled]: {
    label: "Hoàn thành",
    color: "blue",
    icon: "✅",
  },
  [ContractDeliveryBatchStatus.Cancelled]: {
    label: "Đã huỷ",
    color: "red",
    icon: "❌",
  },
};