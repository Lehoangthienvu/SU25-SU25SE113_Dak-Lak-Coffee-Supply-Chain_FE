"use client";

import ShipmentForm from "@/components/shipments/ShipmentForm";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getAllUserAccounts } from "@/lib/api/userAccounts";

function CreateShipmentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || undefined;

  const [staffOptions, setStaffOptions] = useState<
    { deliveryStaffId: string; name: string }[]
  >([]);

  useEffect(() => {
    getAllUserAccounts()
      .then((rows) =>
        setStaffOptions(
          (rows || [])
            .filter((u) => u.roleName === "DeliveryStaff")
            .map((u) => ({ deliveryStaffId: u.userId, name: u.name }))
        )
      )
      .catch(() => setStaffOptions([]));
  }, []);

  return (
    <ShipmentForm
      onSuccess={() => router.push("/dashboard/manager/shipments")}
      orderId={orderId}
      deliveryStaffOptions={staffOptions}
    />
  );
}

export default function CreateShipmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateShipmentContent />
    </Suspense>
  );
}
