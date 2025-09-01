"use client";

import React, { useState, useEffect } from 'react';
import { useAuthGuard } from '@/lib/auth/useAuthGuard';
import { 
  getProcessingBatchCriteria, 
  createProcessingBatchCriteria,
  updateProcessingBatchCriteria,
  deleteProcessingBatchCriteria,
  activateProcessingBatchCriteria,
  deactivateProcessingBatchCriteria,
  ProcessingBatchCriteria,
  CreateProcessingBatchCriteriaDto,
  UpdateProcessingBatchCriteriaDto
} from '@/lib/api/systemConfiguration';
import { AppToast } from '@/components/ui/AppToast';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiEyeOff, 
  FiCheckCircle, 
  FiXCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiSettings
} from 'react-icons/fi';

export default function SystemConfigurationCriteriaPage() {
  useAuthGuard(["admin"]);
  const { t } = useTranslation();
  
  const [criteria, setCriteria] = useState<ProcessingBatchCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<ProcessingBatchCriteria | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CreateProcessingBatchCriteriaDto>({
    name: '',
    description: '',
    minValue: null,
    maxValue: null,
    unit: '',
    operator: '',
    severity: '',
    ruleGroup: '',
    isActive: true
  });

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProcessingBatchCriteria();
      setCriteria(data);
    } catch (err: any) {
      console.error('❌ Lỗi fetchCriteria:', err);
      setError(err.message || t('systemConfiguration.error.fetchData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  const handleCreate = async () => {
    try {
      await createProcessingBatchCriteria(formData);
      AppToast.success(t('systemConfiguration.success.created'));
      setShowCreateDialog(false);
      setFormData({
        name: '',
        description: '',
        minValue: null,
        maxValue: null,
        unit: '',
        operator: '',
        severity: '',
        ruleGroup: '',
        isActive: true
      });
      fetchCriteria();
    } catch (err: any) {
      AppToast.error(err.message || t('systemConfiguration.error.create'));
    }
  };

  const handleEdit = async () => {
    if (!editingCriteria) return;
    
    try {
      const updateData: UpdateProcessingBatchCriteriaDto = {
        description: formData.description,
        minValue: formData.minValue,
        maxValue: formData.maxValue,
        unit: formData.unit,
        operator: formData.operator,
        severity: formData.severity,
        ruleGroup: formData.ruleGroup,
        isActive: formData.isActive
      };
      
      await updateProcessingBatchCriteria(editingCriteria.name, updateData);
      AppToast.success(t('systemConfiguration.success.updated'));
      setShowEditDialog(false);
      setEditingCriteria(null);
      fetchCriteria();
    } catch (err: any) {
      AppToast.error(err.message || t('systemConfiguration.error.update'));
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(t('systemConfiguration.confirm.delete'))) return;
    
    try {
      await deleteProcessingBatchCriteria(name);
      AppToast.success(t('systemConfiguration.success.deleted'));
      fetchCriteria();
    } catch (err: any) {
      AppToast.error(err.message || t('systemConfiguration.error.delete'));
    }
  };

  const handleToggleActive = async (name: string, isActive: boolean) => {
    try {
      if (isActive) {
        await activateProcessingBatchCriteria(name);
        AppToast.success(t('systemConfiguration.success.activated'));
      } else {
        await deactivateProcessingBatchCriteria(name);
        AppToast.success(t('systemConfiguration.success.deactivated'));
      }
      fetchCriteria();
    } catch (err: any) {
      AppToast.error(err.message || t('systemConfiguration.error.toggleActive'));
    }
  };

  const openEditDialog = (criterion: ProcessingBatchCriteria) => {
    setEditingCriteria(criterion);
    setFormData({
      name: criterion.name,
      description: criterion.description,
      minValue: criterion.minValue,
      maxValue: criterion.maxValue,
      unit: criterion.unit,
      operator: criterion.operator,
      severity: criterion.severity,
      ruleGroup: criterion.ruleGroup,
      isActive: criterion.isActive
    });
    setShowEditDialog(true);
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'Hard' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getOperatorDisplay = (operator: string) => {
    const operatorMap: { [key: string]: string } = {
      '<=': '≤',
      '>=': '≥',
      '=': '=',
      '<': '<',
      '>': '>'
    };
    return operatorMap[operator] || operator;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-orange-500 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">{t('systemConfiguration.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCriteria} variant="outline">
            {t('systemConfiguration.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('systemConfiguration.criteria.title')}
              </h1>
              <p className="text-gray-600">
                {t('systemConfiguration.criteria.subtitle')}
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <FiPlus />
                  {t('systemConfiguration.criteria.create')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('systemConfiguration.criteria.create')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('systemConfiguration.criteria.name')} *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="PB.MoisturePercent"
                      />
                    </div>
                    <div>
                      <Label>{t('systemConfiguration.criteria.unit')} *</Label>
                      <Input
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        placeholder="%"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>{t('systemConfiguration.criteria.description')} *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder={t('systemConfiguration.criteria.descriptionPlaceholder')}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>{t('systemConfiguration.criteria.minValue')}</Label>
                      <Input
                        type="number"
                        value={formData.minValue !== null ? formData.minValue : ''}
                        onChange={(e) => setFormData({...formData, minValue: e.target.value === '' ? null : Number(e.target.value)})}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>{t('systemConfiguration.criteria.maxValue')}</Label>
                      <Input
                        type="number"
                        value={formData.maxValue !== null ? formData.maxValue : ''}
                        onChange={(e) => setFormData({...formData, maxValue: e.target.value === '' ? null : Number(e.target.value)})}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>{t('systemConfiguration.criteria.operator')} *</Label>
                      <Select value={formData.operator} onValueChange={(value) => setFormData({...formData, operator: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<=">≤ (Nhỏ hơn hoặc bằng)</SelectItem>
                          <SelectItem value="&gt;=">&gt;= (Lớn hơn hoặc bằng)</SelectItem>
                          <SelectItem value="=">= (Bằng)</SelectItem>
                          <SelectItem value="<">&lt; (Nhỏ hơn)</SelectItem>
                          <SelectItem value="&gt;">&gt; (Lớn hơn)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t('systemConfiguration.criteria.severity')} *</Label>
                      <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hard">Hard (Nghiêm trọng)</SelectItem>
                          <SelectItem value="Soft">Soft (Cảnh báo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('systemConfiguration.criteria.ruleGroup')} *</Label>
                      <Select value={formData.ruleGroup} onValueChange={(value) => setFormData({...formData, ruleGroup: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QualityCore">QualityCore</SelectItem>
                          <SelectItem value="Defects">Defects</SelectItem>
                          <SelectItem value="Safety">Safety</SelectItem>
                          <SelectItem value="Sensory">Sensory</SelectItem>
                          <SelectItem value="Grading">Grading</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <Label htmlFor="isActive">{t('systemConfiguration.criteria.isActive')}</Label>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      {t('systemConfiguration.cancel')}
                    </Button>
                    <Button onClick={handleCreate}>
                      {t('systemConfiguration.criteria.create')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Criteria Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiSettings />
              {t('systemConfiguration.criteria.list')} ({criteria.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {criteria.length === 0 ? (
              <div className="text-center py-8">
                <FiSettings className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500">{t('systemConfiguration.criteria.noData')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('systemConfiguration.criteria.name')}</TableHead>
                    <TableHead>{t('systemConfiguration.criteria.description')}</TableHead>
                    <TableHead>{t('systemConfiguration.criteria.range')}</TableHead>
                    <TableHead>{t('systemConfiguration.criteria.severity')}</TableHead>
                    <TableHead>{t('systemConfiguration.criteria.ruleGroup')}</TableHead>
                    <TableHead>{t('systemConfiguration.criteria.status')}</TableHead>
                    <TableHead>{t('systemConfiguration.criteria.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteria.map((criterion) => (
                    <TableRow key={criterion.id}>
                      <TableCell className="font-medium">{criterion.name}</TableCell>
                      <TableCell>{criterion.description}</TableCell>
                      <TableCell>
                        {criterion.minValue !== null && criterion.maxValue !== null ? (
                          `${criterion.minValue} ${getOperatorDisplay(criterion.operator)} ${criterion.maxValue} ${criterion.unit}`
                        ) : criterion.minValue !== null ? (
                          `≥ ${criterion.minValue} ${criterion.unit}`
                        ) : criterion.maxValue !== null ? (
                          `≤ ${criterion.maxValue} ${criterion.unit}`
                        ) : (
                          `${criterion.operator} ${criterion.unit}`
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(criterion.severity)}>
                          {criterion.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{criterion.ruleGroup}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {criterion.isActive ? (
                            <FiCheckCircle className="text-green-500" />
                          ) : (
                            <FiXCircle className="text-red-500" />
                          )}
                          <span className={criterion.isActive ? 'text-green-600' : 'text-red-600'}>
                            {criterion.isActive ? t('systemConfiguration.criteria.active') : t('systemConfiguration.criteria.inactive')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(criterion)}
                          >
                            <FiEdit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(criterion.name, !criterion.isActive)}
                          >
                            {criterion.isActive ? (
                              <FiEyeOff className="w-4 h-4" />
                            ) : (
                              <FiEye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(criterion.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('systemConfiguration.criteria.edit')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('systemConfiguration.criteria.name')}</Label>
                <Input value={formData.name} disabled />
              </div>
              
              <div>
                <Label>{t('systemConfiguration.criteria.description')} *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{t('systemConfiguration.criteria.minValue')}</Label>
                  <Input
                    type="number"
                    value={formData.minValue || ''}
                    onChange={(e) => setFormData({...formData, minValue: e.target.value ? Number(e.target.value) : null})}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>{t('systemConfiguration.criteria.maxValue')}</Label>
                  <Input
                    type="number"
                    value={formData.maxValue || ''}
                    onChange={(e) => setFormData({...formData, maxValue: e.target.value ? Number(e.target.value) : null})}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>{t('systemConfiguration.criteria.unit')} *</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{t('systemConfiguration.criteria.operator')} *</Label>
                  <Select value={formData.operator} onValueChange={(value) => setFormData({...formData, operator: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<=">≤ (Nhỏ hơn hoặc bằng)</SelectItem>
                      <SelectItem value=">=">≥ (Lớn hơn hoặc bằng)</SelectItem>
                      <SelectItem value="=">= (Bằng)</SelectItem>
                      <SelectItem value="<"> (Nhỏ hơn)</SelectItem>
                      <SelectItem value=">"> (Lớn hơn)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('systemConfiguration.criteria.severity')} *</Label>
                  <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hard">Hard (Nghiêm trọng)</SelectItem>
                      <SelectItem value="Soft">Soft (Cảnh báo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('systemConfiguration.criteria.ruleGroup')} *</Label>
                  <Select value={formData.ruleGroup} onValueChange={(value) => setFormData({...formData, ruleGroup: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QualityCore">QualityCore</SelectItem>
                      <SelectItem value="Defects">Defects</SelectItem>
                      <SelectItem value="Safety">Safety</SelectItem>
                      <SelectItem value="Sensory">Sensory</SelectItem>
                      <SelectItem value="Grading">Grading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
                <Label htmlFor="editIsActive">{t('systemConfiguration.criteria.isActive')}</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  {t('systemConfiguration.cancel')}
                </Button>
                <Button onClick={handleEdit}>
                  {t('systemConfiguration.criteria.update')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
