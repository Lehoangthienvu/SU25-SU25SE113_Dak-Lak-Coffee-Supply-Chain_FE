'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar, 
  Search, 
  Filter, 
  ArrowUpDown,
  Eye,
  Trash2,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  WalletTransactionList as TransactionList,
  WalletTransactionFilter,
  WalletTransactionSearchResult,
  searchWalletTransactions,
  formatTransactionType,
  getTransactionTypeColor,
  formatAmount,
  deleteWalletTransaction,
  getTransactionAmountColor
} from '@/lib/api/walletTransaction';
// Sử dụng Date API có sẵn thay vì date-fns

interface WalletTransactionListProps {
  walletId: string;
  onTransactionClick?: (transaction: TransactionList) => void;
  showActions?: boolean;
  initialPageSize?: number;
}

export default function WalletTransactionList({
  walletId,
  onTransactionClick,
  showActions = true,
  initialPageSize = 10
}: WalletTransactionListProps) {
  const [transactions, setTransactions] = useState<TransactionList[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<WalletTransactionSearchResult | null>(null);
  
  // Filter states
  const [filter, setFilter] = useState<WalletTransactionFilter>({
    walletId,
    pageNumber: 1,
    pageSize: initialPageSize
  });
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);

  // Load transactions
  const loadTransactions = async () => {
    if (!walletId) {
      console.warn('WalletTransactionList: No walletId provided');
      return;
    }
    
    setLoading(true);
    try {
      // console.log('Loading transactions for wallet:', walletId, 'with filter:', filter);
      const result = await searchWalletTransactions(filter);
      // console.log('Transactions result:', result);
      // console.log('Transactions data array:', result?.data);
      // console.log('Setting transactions state to:', result?.data || []);
      setSearchResult(result);
      setTransactions(result?.data || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error('Không thể tải lịch sử giao dịch: ' + error.message);
      setTransactions([]);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletId) {
      loadTransactions();
    }
  }, [filter, walletId]);

  const handleFilterChange = (key: keyof WalletTransactionFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [key]: value,
      pageNumber: 1 // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilter(prev => ({ ...prev, pageNumber: newPage }));
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
    
    try {
      await deleteWalletTransaction(transactionId);
      toast.success('Xóa giao dịch thành công');
      loadTransactions(); // Reload data
    } catch (error: any) {
      toast.error('Không thể xóa giao dịch: ' + error.message);
    }
  };

  const clearFilters = () => {
    setFilter({
      walletId,
      pageNumber: 1,
      pageSize: initialPageSize
    });
  };

  // Early return if no walletId
  if (!walletId) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <p>Không có thông tin ví</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5" />
              Lịch sử giao dịch
            </CardTitle>
            <CardDescription>
              Xem tất cả giao dịch của ví ({searchResult?.totalRecords || 0} giao dịch)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Lọc
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTransactions}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label>Loại giao dịch</Label>
              <Select 
                value={filter.transactionType || ''} 
                onValueChange={(value) => handleFilterChange('transactionType', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="TopUp">Nạp tiền</SelectItem>
                  <SelectItem value="Withdraw">Rút tiền</SelectItem>
                  <SelectItem value="Transfer">Chuyển tiền</SelectItem>
                  <SelectItem value="Payment">Thanh toán</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Từ ngày</Label>
              <Input
                type="date"
                value={filter.fromDate || ''}
                onChange={(e) => handleFilterChange('fromDate', e.target.value || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label>Đến ngày</Label>
              <Input
                type="date"
                value={filter.toDate || ''}
                onChange={(e) => handleFilterChange('toDate', e.target.value || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label>Số bản ghi/trang</Label>
              <Select 
                value={filter.pageSize?.toString() || '10'} 
                onValueChange={(value) => handleFilterChange('pageSize', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex gap-2">
              <Button variant="outline" onClick={clearFilters} size="sm">
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Đang tải...
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ArrowUpDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có giao dịch nào</p>
            <p className="text-xs mt-2">Debug: transactions = {JSON.stringify(transactions)}</p>
          </div>
        ) : (
          <>
            {/* Transaction List */}
            <div className="space-y-3">
              {(transactions || []).map((transaction) => (
                <div
                  key={transaction.transactionId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${getTransactionTypeColor(transaction.transactionType)}`}>
                      {transaction.transactionType.toLowerCase() === 'topup' && <Plus className="w-4 h-4" />}
                      {transaction.transactionType.toLowerCase() === 'withdraw' && <Minus className="w-4 h-4" />}
                      {transaction.transactionType.toLowerCase() === 'transfer' && <ArrowUpDown className="w-4 h-4" />}
                      {transaction.transactionType.toLowerCase() === 'payment' && <Minus className="w-4 h-4" />}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatTransactionType(transaction.transactionType)}
                        </span>
                        <Badge variant="outline" className={getTransactionTypeColor(transaction.transactionType)}>
                          {transaction.transactionType}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.description || 'Không có mô tả'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(transaction.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`font-semibold ${getTransactionAmountColor(transaction.transactionType)}`}>
                        {formatAmount(transaction.amount, transaction.transactionType)}
                      </div>
                    </div>

                    {showActions && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTransactionClick?.(transaction)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTransaction(transaction.transactionId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {searchResult && searchResult.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Hiển thị {((searchResult.pageNumber - 1) * searchResult.pageSize) + 1} - {Math.min(searchResult.pageNumber * searchResult.pageSize, searchResult.totalRecords)} trong {searchResult.totalRecords} giao dịch
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(searchResult.pageNumber - 1)}
                    disabled={searchResult.pageNumber <= 1}
                  >
                    Trước
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, searchResult.totalPages) }, (_, i) => {
                    const page = Math.max(1, searchResult.pageNumber - 2) + i;
                    if (page > searchResult.totalPages) return null;
                    
                    return (
                      <Button
                        key={page}
                        variant={page === searchResult.pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(searchResult.pageNumber + 1)}
                    disabled={searchResult.pageNumber >= searchResult.totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
