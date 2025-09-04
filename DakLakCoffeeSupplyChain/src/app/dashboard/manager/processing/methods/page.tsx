"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Settings,
  Coffee,
  Package
} from "lucide-react";
import { AppToast } from "@/components/ui/AppToast";
import { getAllProcessingMethods, ProcessingMethod } from "@/lib/api/processingMethods";

export default function ProcessingMethodsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [methods, setMethods] = useState<ProcessingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch methods from API
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true);
        const data = await getAllProcessingMethods();
        setMethods(data);
      } catch (error) {
        console.error('Error fetching methods:', error);
        AppToast.error(t('common.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, [t]);

  const getStatusLabel = (isDeleted: boolean) => {
    return isDeleted ? t('processing.pages.managerBatches.methods.status.inactive') : t('processing.pages.managerBatches.methods.status.active');
  };

  const getStatusColor = (isDeleted: boolean) => {
    return isDeleted ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800";
  };

  const filteredMethods = methods.filter(method =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    method.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 font-medium">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg">
              <Settings className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {t('processing.pages.managerBatches.methods.title')}
              </h1>
              <p className="text-gray-600 text-lg">
                {t('processing.pages.managerBatches.methods.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.methods.stats.totalMethods')}</p>
                <p className="text-3xl font-bold text-gray-900">{methods.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.methods.stats.active')}</p>
                <p className="text-3xl font-bold text-green-600">
                  {methods.filter(m => !m.isDeleted).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Coffee className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('processing.pages.managerBatches.methods.stats.inactive')}</p>
                <p className="text-3xl font-bold text-gray-600">
                  {methods.filter(m => m.isDeleted).length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('processing.pages.managerBatches.methods.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-orange-200 focus:border-orange-400"
                />
              </div>
              <Button variant="outline" className="border-orange-200 hover:bg-orange-50">
                <Filter className="w-4 h-4 mr-2" />
                {t('common.filter')}
              </Button>
            </div>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t('processing.pages.managerBatches.methods.actions.addNew')}
            </Button>
          </div>
        </div>

        {/* Methods Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('processing.pages.managerBatches.methods.table.methodName')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('processing.pages.managerBatches.methods.table.description')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('processing.pages.managerBatches.methods.table.status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('processing.pages.managerBatches.methods.table.createdAt')}</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMethods.map((method) => (
                  <tr key={method.methodId} className="hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-500">ID: {method.methodId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-xs truncate">
                        {method.description}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(method.isDeleted)}>
                        {getStatusLabel(method.isDeleted)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(method.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMethods.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('processing.pages.managerBatches.methods.noData')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
