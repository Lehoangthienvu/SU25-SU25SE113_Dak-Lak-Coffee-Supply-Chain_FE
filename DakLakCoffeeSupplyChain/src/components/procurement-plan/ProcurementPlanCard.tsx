"use client";

import { ProcurementPlan } from "@/lib/api/procurementPlans";
import { formatDate } from "@/lib/utils";
import { ProcurementPlanStatusValue } from "@/lib/constants/procurementPlanStatus";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { FiEdit, FiInfo, FiTrash2, FiXCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { Tooltip } from "@/components/ui/tooltip";
import StatusBadge from "../crop-seasons/StatusBadge";
import { useTranslation } from "react-i18next";

type StatusInfo = {
  label: string;
  color: 'green' | 'yellow' | 'blue' | 'red';
  icon: string;
};

export default function ProcurementPlanCard({
  plan,
  openOpenRegisterDialog,
  openClosedRegisterDialog,
  openCancelDialog,
  openDeleteDialog,
  statusMap,
}: {
  plan: ProcurementPlan;
  openOpenRegisterDialog: () => void;
  openClosedRegisterDialog: () => void;
  openCancelDialog?: () => void;
  openDeleteDialog?: () => void;
  statusMap: Record<ProcurementPlanStatusValue, StatusInfo>;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <tr key={plan.planId} className='border-t hover:bg-gray-50'>
      <td className='px-4 py-3'>
        <Link href={`/dashboard/manager/procurement-plans/${plan.planId}`}>
          <div className='font-medium'>{plan.title}</div>
          <div className='text-sm text-muted-foreground flex items-center gap-1'>
            {plan.planCode}
          </div>
        </Link>
      </td>

      <td className='px-4 py-3'>{plan.totalQuantity.toLocaleString()} {t('procurementPlan.components.procurementPlanCard.units.kilogram')}</td>
      <td className='px-4 py-3 text-center'>{Number(plan.progressPercentage).toFixed(1)}{t('procurementPlan.components.procurementPlanCard.units.percentage')}</td>

      <td className='px-4 py-3'>
        <StatusBadge status={plan.status} map={statusMap} />
      </td>

      <td className='px-4 py-3'>
        {formatDate(plan.startDate)} -- {formatDate(plan.endDate)}
      </td>

      <td className='px-4 py-3 text-center align-middle'>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className='flex items-center gap-2 hover:text-orange-700 transition px-3 py-2 rounded-md bg-white shadow-sm text-sm text-gray-700 hover:bg-[#ccc] '>
            <ChevronDown className='w-4 h-4' />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className='min-w-[100px] bg-white rounded-md shadow-lg p-1 border text-sm z-[100]'>
              <Tooltip
                content={
                  plan.status !== "Draft"
                    ? t('procurementPlan.components.procurementPlanCard.tooltips.editDisabled')
                    : t('procurementPlan.components.procurementPlanCard.tooltips.editEnabled')
                }
                side='bottom'
                align='center'
              >
                <DropdownMenu.Item
                  className='px-3 py-2 hover:bg-gray-100 rounded cursor-pointer flex items-center'
                  disabled={plan.status !== "Draft"}
                  style={{
                    cursor: plan.status !== "Draft" ? "not-allowed" : "pointer",
                  }}
                  onClick={() => {
                    if (plan.status === "Draft")
                      router.push(
                        `/dashboard/manager/procurement-plans/${plan.planId}/edit`
                      );
                  }}
                >
                  <FiEdit className='mr-1' /> {t('procurementPlan.components.procurementPlanCard.actions.edit')}
                </DropdownMenu.Item>
              </Tooltip>
              <DropdownMenu.Item
                className='px-3 py-2 hover:bg-gray-100 rounded cursor-pointer flex items-center'
                onClick={() =>
                  router.push(
                    `/dashboard/manager/procurement-plans/${plan.planId}`
                  )
                }
              >
                <FiInfo className='mr-1' /> {t('procurementPlan.components.procurementPlanCard.actions.details')}
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className='px-3 py-2 hover:bg-gray-100 rounded cursor-pointer flex items-center'
                style={{
                  display:
                    plan.status === "Open"
                      ? "none"
                      : plan.status === "Cancelled"
                      ? "none"
                      : plan.status === "Closed"
                      ? "none"
                      : undefined,
                }}
                onClick={openOpenRegisterDialog}
              >
                {t('procurementPlan.components.procurementPlanCard.actions.openRegistration')}
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className='px-3 py-2 hover:bg-gray-100 rounded cursor-pointer flex items-center'
                style={{
                  display:
                    plan.status === "Closed"
                      ? "none"
                      : plan.status === "Cancelled"
                      ? "none"
                      : plan.status === "Draft"
                      ? "none"
                      : undefined,
                }}
                onClick={openClosedRegisterDialog}
              >
                {t('procurementPlan.components.procurementPlanCard.actions.closeRegistration')}
              </DropdownMenu.Item>

              {plan.status !== "Closed" && (
                <DropdownMenu.Separator className='h-px bg-gray-200 my-1' />
              )}

              <Tooltip
                content={
                  plan.commitments?.length > 0
                    ? t('procurementPlan.components.procurementPlanCard.tooltips.cancelDisabled')
                    : t('procurementPlan.components.procurementPlanCard.tooltips.cancelEnabled')
                }
                side='bottom'
                align='center'
              >
                <DropdownMenu.Item
                  className='px-3 py-2 text-red-600 hover:bg-red-50 rounded cursor-pointer flex items-center'
                  onClick={() => {
                    if (
                      Array.isArray(plan.commitments) &&
                      plan.commitments.length > 0
                    )
                      return;
                    openCancelDialog?.();
                  }}
                  style={{
                    cursor:
                      plan.commitments?.length > 0 ? "not-allowed" : "pointer",
                    display:
                      plan.status === "Cancelled"
                        ? "none"
                        : plan.status === "Draft"
                        ? "none"
                        : plan.status === "Closed"
                        ? "none"
                        : undefined,
                  }}
                >
                  <FiXCircle className='mr-1' />
                  {t('procurementPlan.components.procurementPlanCard.actions.cancel')}
                </DropdownMenu.Item>
              </Tooltip>

              <DropdownMenu.Item
                className='px-3 py-2 text-red-600 hover:bg-red-50 rounded cursor-pointer flex items-center'
                style={{
                  display:
                    plan.status === "Open"
                      ? "none"
                      : plan.status === "Closed"
                      ? "none"
                      : undefined,
                }}
                onClick={openDeleteDialog}
              >
                <FiTrash2 className='mr-1' />
                {t('procurementPlan.components.procurementPlanCard.actions.delete')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </td>
    </tr>
  );
}
