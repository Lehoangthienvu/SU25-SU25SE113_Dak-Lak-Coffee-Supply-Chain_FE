"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentConfiguration } from "@/lib/api/systemConfiguration";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiInfo,
} from "react-icons/fi";

interface PaymentConfigurationCardProps {
  configuration: PaymentConfiguration;
  onEdit: (config: PaymentConfiguration) => void;
  onDelete: (configID: string) => void;
  onToggleActive: (configID: string, isActive: boolean) => void;
  getRoleName: (roleID: number) => string;
  getFeeTypeLabel: (feeType: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export default function PaymentConfigurationCard({
  configuration,
  onEdit,
  onDelete,
  onToggleActive,
  getRoleName,
  getFeeTypeLabel,
  formatCurrency,
  formatDate,
}: PaymentConfigurationCardProps) {
  const isExpired =
    configuration.effectiveTo &&
    new Date(configuration.effectiveTo) < new Date();
  const isActive = configuration.isActive && !isExpired;

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        !configuration.isActive ? "opacity-60" : ""
      } ${isExpired ? "border-red-200 bg-red-50" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiDollarSign className="text-orange-600 text-lg" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {getFeeTypeLabel(configuration.feeType)}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiUsers className="text-orange-500" />
                {getRoleName(configuration.roleID)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={
                isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }
            >
              {isActive ? "Đang hoạt động" : "Không hoạt động"}
            </Badge>
            {isExpired && (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                Hết hạn
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Số tiền:</span>
          <span className="font-bold text-lg text-green-600">
            {formatCurrency(configuration.amount)}
          </span>
        </div>

        {/* Description */}
        {configuration.description && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiInfo className="text-blue-500" />
              <span>Mô tả:</span>
            </div>
            <p className="text-sm text-gray-700 pl-6">
              {configuration.description}
            </p>
          </div>
        )}

        {/* Effective Period */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar className="text-blue-500" />
            <span>Thời gian hiệu lực:</span>
          </div>
          <div className="pl-6 space-y-1">
            <div className="text-sm">
              <span className="font-medium">Từ:</span>{" "}
              {formatDate(configuration.effectiveFrom)}
            </div>
            {configuration.effectiveTo && (
              <div className="text-sm">
                <span className="font-medium">Đến:</span>{" "}
                {formatDate(configuration.effectiveTo)}
              </div>
            )}
            {!configuration.effectiveTo && (
              <div className="text-sm text-gray-500">
                Không giới hạn thời gian
              </div>
            )}
          </div>
        </div>

        {/* Status Details */}
        <div className="flex items-center gap-2 text-sm">
          {configuration.isActive ? (
            <FiCheckCircle className="text-green-500" />
          ) : (
            <FiXCircle className="text-red-500" />
          )}
          <span
            className={
              configuration.isActive ? "text-green-600" : "text-red-600"
            }
          >
            {configuration.isActive ? "Đã kích hoạt" : "Chưa kích hoạt"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(configuration)}
            className="flex items-center gap-1"
          >
            <FiEdit className="w-4 h-4" />
            Sửa
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onToggleActive(configuration.configID, !configuration.isActive)
            }
            className={`flex items-center gap-1 ${
              configuration.isActive
                ? "text-orange-600 hover:text-orange-700"
                : "text-green-600 hover:text-green-700"
            }`}
          >
            {configuration.isActive ? (
              <>
                <FiEyeOff className="w-4 h-4" />
                Vô hiệu hóa
              </>
            ) : (
              <>
                <FiEye className="w-4 h-4" />
                Kích hoạt
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(configuration.configID)}
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
          >
            <FiTrash2 className="w-4 h-4" />
            Xóa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
