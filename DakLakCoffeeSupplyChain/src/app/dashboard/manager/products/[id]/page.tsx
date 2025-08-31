"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProductById, ProductViewDetailsDto } from "@/lib/api/products";
import { formatQuantity } from "@/lib/utils";
import {
  BadgeInfo,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Factory,
  FileText,
  Hash,
  MapPin,
  Package2,
  Ruler,
  UserCheck,
} from "lucide-react";
import {
  ProductStatusMap,
  getProductStatusMap,
} from "@/lib/constants/productStatus";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export default function ProductDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductViewDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getProductById(id as string);
        setProduct(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">{t("products.detail.loading")}</div>;
  if (!product)
    return (
      <div className="p-6 text-red-500">{t("products.detail.notFound")}</div>
    );

  const productStatusMap = getProductStatusMap(t);
  const statusMeta = productStatusMap[product.status];

  return (
    <div className="w-full min-h-screen bg-orange-50 px-4 py-6 lg:px-20 flex justify-center">
      <div className="w-full max-w-6xl space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-100 border border-amber-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center border border-orange-200">
              <Package2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-800">
                  {product.productName}
                </h1>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusMeta.color}-100 text-${statusMeta.color}-700`}
                >
                  {statusMeta.label}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />{" "}
                  {t("products.detail.dateLabels.created")}{" "}
                  {formatDate(product.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  {t("products.detail.dateLabels.updated")}{" "}
                  {formatDate(product.updatedAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-medium px-4 py-2 rounded-lg shadow-md"
              onClick={() =>
                router.push(
                  `/dashboard/manager/products/${product.productId}/edit`
                )
              }
            >
              {t("products.detail.actions.edit")}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("products.detail.sections.productInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm">
              <InfoRow
                icon={<Hash className="w-4 h-4" />}
                label={t("products.detail.fields.productCode")}
                value={product.productCode}
              />
              <InfoRow
                icon={<ClipboardList className="w-4 h-4" />}
                label={t("products.detail.fields.description")}
                value={product.description || "—"}
                multiline
              />
              <InfoRow
                icon={<Ruler className="w-4 h-4" />}
                label={t("products.detail.fields.unit")}
                value={product.unit || "—"}
              />
              <InfoRow
                icon={<BadgeInfo className="w-4 h-4" />}
                label={t("products.detail.fields.coffeeType")}
                value={product.coffeeTypeName || "—"}
              />
              <InfoRow
                icon={<Factory className="w-4 h-4" />}
                label={t("products.detail.fields.warehouse")}
                value={product.inventoryLocation || "—"}
              />
              <InfoRow
                icon={<FileText className="w-4 h-4" />}
                label={t("products.detail.fields.batchCode")}
                value={product.batchCode || "—"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("products.detail.sections.qualityOrigin")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm">
              <InfoRow
                icon={<MapPin className="w-4 h-4" />}
                label={t("products.detail.fields.region")}
                value={product.originRegion || "—"}
              />
              <InfoRow
                icon={<UserCheck className="w-4 h-4" />}
                label="Nông dân"
                value={(product as any).farmerName || "—"}
              />
              <InfoRow
                icon={<CheckCircle className="w-4 h-4" />}
                label={t("products.detail.fields.quality")}
                value={product.evaluatedQuality || "—"}
              />
              <InfoRow
                icon={<CheckCircle className="w-4 h-4" />}
                label={t("products.detail.fields.evaluationScore")}
                value={
                  product.evaluationScore != null
                    ? String(product.evaluationScore)
                    : "—"
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("products.detail.sections.pricingInventory")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm">
              <InfoRow
                icon={<FileText className="w-4 h-4" />}
                label={t("products.detail.fields.unitPrice")}
                value={
                  product.unitPrice != null
                    ? `${product.unitPrice.toLocaleString()} VND/kg`
                    : "—"
                }
              />
              <InfoRow
                icon={<FileText className="w-4 h-4" />}
                label={t("products.detail.fields.availableQuantity")}
                value={
                  product.quantityAvailable != null
                    ? formatQuantity(product.quantityAvailable)
                    : "—"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("products.detail.sections.approval")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm">
              <InfoRow
                icon={<UserCheck className="w-4 h-4" />}
                label={t("products.detail.fields.approver")}
                value={product.approvedByName || "—"}
              />
              <InfoRow
                icon={<CalendarDays className="w-4 h-4" />}
                label={t("products.detail.fields.approvalDate")}
                value={formatDate(product.approvedAt)}
              />
              <InfoRow
                icon={<FileText className="w-4 h-4" />}
                label={t("products.detail.fields.approvalNote")}
                value={product.approvalNote || "—"}
                multiline
              />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/manager/products`)}
          >
            {t("products.detail.actions.back")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  multiline,
  actionLabel,
  onAction,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  multiline?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {icon && <div className="text-gray-500 mt-0.5">{icon}</div>}
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div
            className={
              "text-gray-800 " + (multiline ? "whitespace-pre-wrap" : "")
            }
          >
            {value}
          </div>
        </div>
      </div>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction} className="h-7">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
