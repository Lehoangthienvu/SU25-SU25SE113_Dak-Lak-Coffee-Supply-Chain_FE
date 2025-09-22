'use client';

import React, { useState, useEffect } from 'react';
import { 
  getTransactionsByUserId,
  getTransactionsByWallet,
  deleteWalletTransaction,
  hardDeleteWalletTransaction,
  updateWalletTransaction,
  formatTransactionType,
  getTransactionTypeColor,
  getTransactionAmountColor,
  formatAmount,
  WalletTransactionList as TransactionList,
  WalletTransactionSearchResult
} from '@/lib/api/walletTransaction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Edit, 
  Trash2, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';


interface WalletTransactionListProps {
  userId?: string;
  walletId?: string;
  isAdmin?: boolean;
  onTransactionCreated?: () => void;
}

export default function WalletTransactionList({ 
  userId, 
  walletId, 
  isAdmin = false,
  onTransactionCreated 
}: WalletTransactionListProps) {
  const [transactions, setTransactions] = useState<TransactionList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionList | null>(null);
  const [editDescription, setEditDescription] = useState('');

  // Load transactions
  const loadTransactions = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      let result: WalletTransactionSearchResult;
      
      if (userId) {
        // Xem giao dịch của user cụ thể
        result = await getTransactionsByUserId(userId, page, pageSize);
      } else if (walletId) {
        // Xem giao dịch theo ví
        const walletTransactions = await getTransactionsByWallet(walletId);
        // Chuyển đổi sang format SearchResult
        result = {
          data: walletTransactions,
          totalRecords: walletTransactions.length,
          pageNumber: page,
          pageSize: pageSize,
          totalPages: Math.ceil(walletTransactions.length / pageSize)
        };
      } else {
        // Xem giao dịch của user hiện tại - sử dụng userId mặc định cho demo
        const currentUserId = '00000000-0000-0000-0000-000000000000';
        result = await getTransactionsByUserId(currentUserId, page, pageSize);
      }
      
      setTransactions(result.data);
      setTotalPages(result.totalPages);
      setTotalRecords(result.totalRecords);
      setCurrentPage(page);
    } catch (err) {
      setError('Không thể tải danh sách giao dịch');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = transactionType === 'all' || 
      transaction.transactionType.toLowerCase() === transactionType.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  // Handle edit transaction
  const handleEditTransaction = (transaction: TransactionList) => {
    setSelectedTransaction(transaction);
    setEditDescription(transaction.description || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTransaction) return;
    
    try {
      await updateWalletTransaction(selectedTransaction.transactionId, {
        description: editDescription
      });
      
      toast.success('Cập nhật giao dịch thành công');
      setEditDialogOpen(false);
      loadTransactions(currentPage);
    } catch (err) {
      toast.error('Không thể cập nhật giao dịch');
      console.error('Error updating transaction:', err);
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transaction: TransactionList) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTransaction) return;
    
    try {
      await deleteWalletTransaction(selectedTransaction.transactionId);
      toast.success('Xóa giao dịch thành công');
      setDeleteDialogOpen(false);
      loadTransactions(currentPage);
    } catch (err) {
      toast.error('Không thể xóa giao dịch');
      console.error('Error deleting transaction:', err);
    }
  };

  // Handle hard delete transaction (Admin only)
  const handleHardDeleteTransaction = (transaction: TransactionList) => {
    setSelectedTransaction(transaction);
    setHardDeleteDialogOpen(true);
  };

  const handleConfirmHardDelete = async () => {
    if (!selectedTransaction) return;
    
    try {
      await hardDeleteWalletTransaction(selectedTransaction.transactionId);
      toast.success('Xóa vĩnh viễn giao dịch thành công');
      setHardDeleteDialogOpen(false);
      loadTransactions(currentPage);
    } catch (err) {
      toast.error('Không thể xóa vĩnh viễn giao dịch');
      console.error('Error hard deleting transaction:', err);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadTransactions();
  }, [userId, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải giao dịch...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => loadTransactions()}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lịch sử giao dịch</h2>
        <div className="text-sm text-gray-600">
          Tổng: {totalRecords} giao dịch
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm theo mô tả hoặc loại giao dịch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Loại giao dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="topup">Nạp tiền</SelectItem>
                <SelectItem value="directtopup">Nạp tiền trực tiếp</SelectItem>
                <SelectItem value="withdraw">Rút tiền</SelectItem>
                <SelectItem value="transfer">Chuyển tiền</SelectItem>
                <SelectItem value="payment">Thanh toán</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Không có giao dịch nào</p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.transactionId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge 
                        className={getTransactionTypeColor(transaction.transactionType)}
                      >
                        {formatTransactionType(transaction.transactionType)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-1">
                      {transaction.description || 'Không có mô tả'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>ID: {transaction.transactionId.slice(0, 8)}...</span>
                      {transaction.walletType && (
                        <span>Ví: {transaction.walletType}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getTransactionAmountColor(transaction.transactionType)}`}>
                      {formatAmount(transaction.amount, transaction.transactionType)}
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHardDeleteTransaction(transaction)}
                          className="text-red-800 hover:text-red-900"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTransactions(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          
          <span className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTransactions(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa giao dịch</DialogTitle>
            <DialogDescription>
              Bạn chỉ có thể chỉnh sửa mô tả của giao dịch
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Nhập mô tả giao dịch..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa giao dịch</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giao dịch này? Hành động này có thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete Dialog */}
      <AlertDialog open={hardDeleteDialogOpen} onOpenChange={setHardDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa vĩnh viễn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa vĩnh viễn giao dịch này? Hành động này KHÔNG THỂ hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmHardDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}