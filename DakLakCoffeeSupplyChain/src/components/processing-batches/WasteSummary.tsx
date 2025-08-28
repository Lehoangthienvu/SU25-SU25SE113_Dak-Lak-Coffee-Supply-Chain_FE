"use client";

import React from "react";
import { Trash2, Calendar, Scale, FileText } from "lucide-react";
import { useTranslation } from 'react-i18next';

export interface WasteSummaryData {
  wasteId: string;
  wasteCode: string;
  wasteType: string;
  quantity: number;
  unit: string;
  note?: string;
  recordedAt?: string;
  isDisposed: boolean;
  disposedAt?: string;
}

interface WasteSummaryProps {
  wastes: WasteSummaryData[];
  className?: string;
}

export default function WasteSummary({ wastes, className = "" }: WasteSummaryProps) {
  const { t } = useTranslation();
  
  if (!wastes || wastes.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <Trash2 className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('waste.summary.title')}</h3>
          <p className="text-sm text-gray-600">{t('waste.summary.description')}</p>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            {wastes.length} {t('waste.summary.count')}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {wastes.map((waste, index) => (
          <div key={waste.wasteId || index} className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{waste.wasteType}</h4>
                  <p className="text-xs text-gray-500">{t('waste.summary.code')}: {waste.wasteCode}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">
                    {waste.quantity} {waste.unit}
                  </span>
                  {waste.isDisposed && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {t('waste.summary.disposed')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {waste.recordedAt && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{t('waste.summary.recordedAt')}: {new Date(waste.recordedAt).toLocaleDateString("vi-VN")}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-gray-600">
                <Scale className="w-4 h-4 text-gray-400" />
                <span>{t('waste.summary.quantity')}: {waste.quantity} {waste.unit}</span>
              </div>

              {waste.note && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>{t('waste.summary.note')}: {waste.note}</span>
                </div>
              )}
            </div>

            {waste.disposedAt && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{t('waste.summary.disposedAt')}: {new Date(waste.disposedAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-4 p-3 bg-green-100 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-green-800">{t('waste.summary.totalQuantity')}:</span>
          <span className="font-bold text-green-900">
            {wastes.reduce((sum, waste) => sum + waste.quantity, 0).toFixed(2)} kg
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="font-medium text-green-800">{t('waste.summary.totalTypes')}:</span>
          <span className="font-bold text-green-900">{wastes.length}</span>
        </div>
      </div>
    </div>
  );
}
