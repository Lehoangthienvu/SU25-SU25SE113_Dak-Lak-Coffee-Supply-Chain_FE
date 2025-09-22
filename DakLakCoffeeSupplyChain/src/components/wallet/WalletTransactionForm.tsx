'use client';

import React, { useState, useEffect } from 'react';
import { 
  createWalletTransaction,
  WalletTransactionCreate 
} from '@/lib/api/walletTransaction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Plus, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface WalletTransactionFormProps {
  walletId: string;
  onTransactionCreated?: () => void;
  trigger?: React.ReactNode;
}

export default function WalletTransactionForm({ 
  walletId, 
  onTransactionCreated,
  trigger 
}: WalletTransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WalletTransactionCreate>({
    walletId: walletId,
    amount: 0,
    transactionType: 'TopUp',
    description: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<string>('Wallet');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        walletId: walletId,
        amount: 0,
        transactionType: 'TopUp',
        description: ''
      });
      setPaymentMethod('Wallet');
    }
  }, [open, walletId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }

    try {
      setLoading(true);
      await createWalletTransaction(formData);
      
      toast.success('Tạo giao dịch thành công');
      setOpen(false);
      onTransactionCreated?.();
    } catch (error) {
      toast.error('Không thể tạo giao dịch');
      console.error('Error creating transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof WalletTransactionCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>
          {trigger}
        </div>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo giao dịch
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Tạo giao dịch mới
            </DialogTitle>
            <DialogDescription>
              Tạo giao dịch mới cho ví này
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transactionType">Loại giao dịch</Label>
              <Select 
                value={formData.transactionType} 
                onValueChange={(value) => handleInputChange('transactionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại giao dịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TopUp">Nạp tiền</SelectItem>
                  <SelectItem value="DirectTopup">Nạp tiền trực tiếp</SelectItem>
                  <SelectItem value="Withdraw">Rút tiền</SelectItem>
                  <SelectItem value="Transfer">Chuyển tiền</SelectItem>
                  <SelectItem value="Payment">Thanh toán</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phương thức thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wallet">Ví nội bộ</SelectItem>
                  <SelectItem value="VNPay">VNPay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền (VND)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1000"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="Nhập số tiền..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentId">ID Thanh toán (tùy chọn)</Label>
              <Input
                id="paymentId"
                value={formData.paymentId || ''}
                onChange={(e) => handleInputChange('paymentId', e.target.value)}
                placeholder="Nhập ID thanh toán..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Nhập mô tả giao dịch..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Tạo giao dịch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
