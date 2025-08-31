"use client";

import { useEffect, useState } from "react";
import ContractDeliveryBatchForm, {
  ContractOption,
} from "@/components/contract-delivery-batches/ContractDeliveryBatchForm";
import { getAllContracts } from "@/lib/api/contracts"; // trả [{contractId, contractNumber}]
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
        const data = await getAllContracts();
        setOptions(data);
      } catch (e) {
        console.error(e);
        toast.error(t("contractDeliveryBatches.create.errors.loadContracts"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6 text-gray-500">{t("contractDeliveryBatches.create.loading")}</div>;

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
