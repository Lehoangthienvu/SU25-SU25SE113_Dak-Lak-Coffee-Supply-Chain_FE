"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Filter,
  Settings,
  Coffee,
  Package,
  Edit,
  Trash2,
  Eye,
  ArrowRight
} from "lucide-react";
import { AppToast } from "@/components/ui/AppToast";
import { getAllProcessingMethods, ProcessingMethod } from "@/lib/api/processingMethods";
import { getAllProcessingStages, ProcessingStage } from "@/lib/api/processingStages";
import ProcessingMethodForm from "@/components/processing/ProcessingMethodForm";
import ProcessingStageForm from "@/components/processing/ProcessingStageForm";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";

export default function AdminProcessingPage() {
  useAuthGuard(["admin"]);
  
  const { t } = useTranslation();
  const router = useRouter();
  const [methods, setMethods] = useState<ProcessingMethod[]>([]);
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<ProcessingMethod | null>(null);
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [showStageForm, setShowStageForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ProcessingMethod | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [methodsData, stagesData] = await Promise.all([
          getAllProcessingMethods(),
          getAllProcessingStages()
        ]);
        console.log(`🔍 DEBUG: Fetched methods:`, methodsData);
        console.log(`🔍 DEBUG: Fetched stages:`, stagesData);
        setMethods(methodsData);
        setStages(stagesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        AppToast.error(t('common.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const getStatusLabel = (isDeleted: boolean) => {
    return isDeleted ? t('processing.admin.status.inactive') : t('processing.admin.status.active');
  };

  const getStatusColor = (isDeleted: boolean) => {
    return isDeleted ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800";
  };

  const getMethodStages = (methodId: string | number) => {
    console.log(`🔍 DEBUG: getMethodStages called with methodId:`, methodId, typeof methodId);
    console.log(`🔍 DEBUG: stages:`, stages);
    
    if (!methodId || !stages) {
      console.log(`🔍 DEBUG: Returning empty array - methodId: ${methodId}, stages: ${stages}`);
      return [];
    }
    
    // Convert methodId to number for comparison
    const methodIdNum = typeof methodId === 'string' ? parseInt(methodId) : methodId;
    console.log(`🔍 DEBUG: Converted methodId to number:`, methodIdNum);
    
    const filteredStages = stages.filter(stage => {
      console.log(`🔍 DEBUG: Checking stage:`, stage, `methodId: ${stage?.methodId}, type: ${typeof stage?.methodId}`);
      return stage && stage.methodId && stage.methodId === methodIdNum;
    });
    
    console.log(`🔍 DEBUG: Filtered stages:`, filteredStages);
    return filteredStages;
  };

  const filteredMethods = methods.filter(method =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    method.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    method.methodCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMethodSuccess = (method: ProcessingMethod) => {
    if (editingMethod) {
      setMethods(prev => prev.map(m => m.methodId === method.methodId ? method : m));
    } else {
      setMethods(prev => [...prev, method]);
    }
    setShowMethodForm(false);
    setEditingMethod(null);
    
    // Refresh trang để cập nhật dữ liệu
    window.location.reload();
  };

  const handleStageSuccess = (updatedStages: ProcessingStage[]) => {
    if (selectedMethod) {
      // Remove old stages for this method
      const otherStages = stages.filter(s => s && s.methodId && s.methodId.toString() !== selectedMethod.methodId);
      setStages([...otherStages, ...updatedStages]);
    }
    setShowStageForm(false);
    setSelectedMethod(null);
    
    // Refresh trang để cập nhật dữ liệu
    window.location.reload();
  };

  const handleEditMethod = (method: ProcessingMethod) => {
    setEditingMethod(method);
    setShowMethodForm(true);
  };

  const handleManageStages = (method: ProcessingMethod) => {
    console.log(`🔍 DEBUG: handleManageStages called with method:`, method);
    console.log(`🔍 DEBUG: methodId:`, method.methodId, typeof method.methodId);
    console.log(`🔍 DEBUG: parsed methodId:`, parseInt(method.methodId));
    setSelectedMethod(method);
    setShowStageForm(true);
  };

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
                {t('processing.admin.title')}
              </h1>
              <p className="text-gray-600 text-lg">
                {t('processing.admin.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('processing.admin.stats.totalMethods')}</p>
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
                <p className="text-sm font-medium text-gray-600">{t('processing.admin.stats.activeMethods')}</p>
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
                <p className="text-sm font-medium text-gray-600">{t('processing.admin.stats.totalStages')}</p>
                <p className="text-3xl font-bold text-blue-600">{stages.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('processing.admin.stats.avgStagesPerMethod')}</p>
                <p className="text-3xl font-bold text-purple-600">
                  {methods.length > 0 ? Math.round(stages.length / methods.length) : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <ArrowRight className="w-6 h-6 text-purple-600" />
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
                  placeholder={t('processing.admin.searchPlaceholder')}
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
            <Button 
              onClick={() => setShowMethodForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('processing.admin.addMethod')}
            </Button>
          </div>
        </div>

        {/* Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMethods.map((method) => {
            console.log(`🔍 DEBUG: Processing method:`, method);
            console.log(`🔍 DEBUG: method.methodId:`, method.methodId, typeof method.methodId);
            const methodStages = getMethodStages(method.methodId.toString());
            console.log(`🔍 DEBUG: Method ${method.methodId} has ${methodStages.length} stages:`, methodStages);
            return (
              <Card key={method.methodId} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {method.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {method.methodCode}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(method.isDeleted)}>
                      {getStatusLabel(method.isDeleted)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {method.description}
                  </p>

                  {/* Stages Info */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>{t('processing.admin.stages')}</span>
                      <span className="font-medium">{methodStages.length}</span>
                    </div>
                    {methodStages.length > 0 && (
                      <div className="space-y-1">
                        {methodStages.slice(0, 3).map((stage, index) => (
                          <div key={stage.stageId} className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {stage.orderIndex}
                            </Badge>
                            <span className="text-gray-600 truncate">{stage.stageName}</span>
                            {stage.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Bắt buộc
                              </Badge>
                            )}
                          </div>
                        ))}
                        {methodStages.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{methodStages.length - 3} giai đoạn khác
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageStages(method)}
                      className="flex-1 border-orange-200 hover:bg-orange-50"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      {t('processing.admin.manageStages')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMethod(method)}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredMethods.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy phương pháp sơ chế</p>
          </div>
        )}

        {/* Forms */}
        {showMethodForm && (
          <ProcessingMethodForm
            method={editingMethod}
            onSuccess={handleMethodSuccess}
            onCancel={() => {
              setShowMethodForm(false);
              setEditingMethod(null);
            }}
            isOpen={showMethodForm}
          />
        )}

        {showStageForm && selectedMethod && (
          <ProcessingStageForm
            methodId={parseInt(selectedMethod.methodId)}
            methodName={selectedMethod.name}
            onSuccess={handleStageSuccess}
            onCancel={() => {
              setShowStageForm(false);
              setSelectedMethod(null);
            }}
            isOpen={showStageForm}
          />
        )}
      </div>
    </div>
  );
}
