'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CreditCard, Loader2, Zap } from 'lucide-react';
import { addMoneyToWallet, addMoneyDirect } from '@/lib/api/wallet';

interface SimpleTopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialAmount?: number; // ✅ Số tiền sẵn có từ payment pending
}

export default function SimpleTopupDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  initialAmount 
}: SimpleTopupDialogProps) {
  const [amount, setAmount] = useState<string>(initialAmount ? initialAmount.toString() : '');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const presetAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

  // ✅ Update amount khi initialAmount thay đổi (mở dialog mới)
  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount.toString());
    }
  }, [initialAmount]);

  const handleSubmit = async (useVNPay: boolean = true) => {
    if (!amount || parseFloat(amount) < 1000) {
      toast.error('Số tiền phải lớn hơn 1,000 VND');
      return;
    }

    setLoading(true);
    try {
      if (useVNPay) {
        // Nạp tiền qua VNPay
        const data = await addMoneyToWallet(
          parseFloat(amount), 
          description || 'Nạp tiền vào ví'
        );

        if (data.paymentUrl) {
          // Chuyển hướng đến VNPay
          window.location.href = data.paymentUrl;
        } else {
          toast.error('Không thể tạo URL thanh toán');
        }
      } else {
        // Nạp tiền trực tiếp (test)
        const data = await addMoneyDirect(
          parseFloat(amount), 
          description || 'Nạp tiền vào ví'
        );

        toast.success(`Nạp ${parseFloat(amount).toLocaleString()} VND thành công! Số dư mới: ${data.newBalance.toLocaleString()} VND`);
        onSuccess?.();
        handleClose();
      }
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Nạp tiền vào ví
          </DialogTitle>
          <DialogDescription>
            Nhập số tiền bạn muốn nạp vào ví. Thanh toán sẽ được xử lý qua VNPay.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền (VND)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Nhập số tiền..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
            />
          </div>

          <div className="space-y-2">
            <Label>Chọn nhanh</Label>
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                  className="text-xs"
                >
                  {preset.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Ghi chú (tùy chọn)</Label>
            <Textarea
              id="description"
              placeholder="Nhập ghi chú..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
         
          <Button 
            onClick={() => handleSubmit(true)} 
            disabled={loading || !amount}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Thanh toán VNPay
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

