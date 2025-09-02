"use client";

import { useEffect, useState } from "react";
import ContractDeliveryBatchForm, {
  ContractOption,
} from "@/components/contract-delivery-batches/ContractDeliveryBatchForm";
import { getAllContracts, getContractDetails } from "@/lib/api/contracts"; // trả [{contractId, contractNumber}]
import { getContractDeliveryBatchesByContractId } from "@/lib/api/contractDeliveryBatches";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function CreateDeliveryBatchPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [options, setOptions] = useState<ContractOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const allContracts = await getAllContracts();
        console.log("Tất cả hợp đồng:", allContracts);

        // Lọc chỉ những hợp đồng chưa đủ đợt giao hàng
        const availableContracts: ContractOption[] = [];

        for (const contract of allContracts) {
          try {
            // Lấy danh sách đợt giao hàng của hợp đồng này
            const existingBatches =
              await getContractDeliveryBatchesByContractId(contract.contractId);

            // Lấy chi tiết hợp đồng để kiểm tra tổng khối lượng
            const contractDetails = await getContractDetails(
              contract.contractId
            );
            const totalPlannedQuantity = contractDetails.totalQuantity || 0;

            // Tính tổng khối lượng đã được lên kế hoạch giao
            const totalPlannedInBatches = existingBatches.reduce(
              (sum, batch) => {
                return sum + (batch.totalPlannedQuantity || 0);
              },
              0
            );

            // Chỉ hiển thị hợp đồng chưa đủ đợt giao hàng
            if (totalPlannedInBatches < totalPlannedQuantity) {
              const remainingQuantity =
                totalPlannedQuantity - totalPlannedInBatches;

              availableContracts.push({
                contractId: contract.contractId,
                contractNumber: contract.contractNumber,
                remainingQuantity: remainingQuantity,
                totalQuantity: totalPlannedQuantity,
                existingBatches: existingBatches.length,
              });
            }
          } catch (e) {
            console.error(
              `Lỗi khi kiểm tra hợp đồng ${contract.contractNumber}:`,
              e
            );
            // Nếu lỗi, vẫn hiển thị hợp đồng này để tránh mất dữ liệu
            availableContracts.push({
              contractId: contract.contractId,
              contractNumber: contract.contractNumber,
              remainingQuantity: 0,
              totalQuantity: 0,
              existingBatches: 0,
            });
          }
        }

        console.log("Hợp đồng khả dụng:", availableContracts);
        setOptions(availableContracts);
      } catch (e) {
        console.error("Lỗi khi load hợp đồng:", e);
        toast.error(t("contractDeliveryBatches.create.errors.loadContracts"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="p-6 text-gray-500">
        {t("contractDeliveryBatches.create.loading")}
      </div>
    );

  return (
    <div className="p-6">
      <ContractDeliveryBatchForm
        onSuccess={() => {
          router.push("/dashboard/manager/contract-delivery-batches");
        }}
        contractOptions={options}
      />
    </div>
  );
}
