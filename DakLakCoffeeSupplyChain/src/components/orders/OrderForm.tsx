"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Plus, 
  Trash2, 
  Search, 
  Filter,
  ShoppingCart,
  Calendar,
  FileText,
  AlertCircle
} from "lucide-react";
import { 
  getAllContractDeliveryBatches, 
  getContractDeliveryBatchById,
  ContractDeliveryBatchViewAllDto,
  ContractDeliveryBatchViewDetailsDto
} from "@/lib/api/contractDeliveryBatches";
import { 
  getContractDeliveryItemsByBatchId, 
  ContractDeliveryItemViewDto 
} from "@/lib/api/contractDeliveryItems";
import { getAllProducts, ProductViewAllDto } from "@/lib/api/products";
import { createOrder, OrderCreateDto } from "@/lib/api/orders";
import { OrderItemCreateInline } from "@/lib/api/orderItems";
import { OrderStatus } from "@/lib/constants/orderStatus";

interface OrderFormProps {
  deliveryBatchId?: string;
  onSuccess?: () => void;
}

interface SelectedProduct {
  productId: string;
  productCode: string;
  productName: string;
  coffeeTypeName: string;
  quantityAvailable: number;
  unit: string;
  unitPrice: number;
  selectedQuantity: number;
  contractDeliveryItemId: string;
  contractDeliveryItemLabel: string;
}

export default function OrderForm({ deliveryBatchId, onSuccess }: OrderFormProps) {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [deliveryBatches, setDeliveryBatches] = useState<ContractDeliveryBatchViewAllDto[]>([]);
  const [products, setProducts] = useState<ProductViewAllDto[]>([]);
  const [selectedDeliveryBatch, setSelectedDeliveryBatch] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [coffeeTypeFilter, setCoffeeTypeFilter] = useState<string>("all");
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<ContractDeliveryBatchViewDetailsDto | null>(null);
  const [contractDeliveryItems, setContractDeliveryItems] = useState<ContractDeliveryItemViewDto[]>([]);
  const [orderMode, setOrderMode] = useState<"single" | "multiple">("single");
  
  // Form fields
  const [formData, setFormData] = useState({
    deliveryRound: "",
    orderDate: "",
    actualDeliveryDate: "",
    note: "",
    status: OrderStatus.Pending as OrderStatus
  });

  // Load delivery batches and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [batchesRes, productsRes] = await Promise.all([
          getAllContractDeliveryBatches(),
          getAllProducts()
        ]);
        
        setDeliveryBatches(batchesRes || []);
        setProducts(productsRes || []);
        
        // Auto-select delivery batch if provided
        if (deliveryBatchId) {
          setSelectedDeliveryBatch(deliveryBatchId);
        }
      } catch (error: any) {
        toast.error(t("managerOrders.create.multiProduct.validation.loadDataError") + (error.message || "Unknown error"));
      }
    };
    
    loadData();
  }, [deliveryBatchId]);

  // Load delivery batch details when selection changes
  useEffect(() => {
    if (!selectedDeliveryBatch) {
      setSelectedBatchDetails(null);
      setContractDeliveryItems([]);
      return;
    }

    const loadBatchDetails = async () => {
      try {
        const [details, items] = await Promise.all([
          getContractDeliveryBatchById(selectedDeliveryBatch),
          getContractDeliveryItemsByBatchId(selectedDeliveryBatch)
        ]);
        
        setSelectedBatchDetails(details);
        setContractDeliveryItems(items || []);
      } catch (error: any) {
        toast.error(t("managerOrders.create.multiProduct.validation.loadDeliveryBatchError") + (error.message || "Unknown error"));
        setSelectedBatchDetails(null);
        setContractDeliveryItems([]);
      }
    };

    loadBatchDetails();
  }, [selectedDeliveryBatch]);

  // Reset selected products when changing order mode
  useEffect(() => {
    if (orderMode === "single" && selectedProducts.length > 1) {
      // Keep only the first product for single mode
      setSelectedProducts(prev => prev.slice(0, 1));
    }
    setShowProductSelection(false);
  }, [orderMode]);

  // Filter products based on search and coffee type
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.coffeeTypeName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCoffeeType = coffeeTypeFilter === "all" || 
        product.coffeeTypeName === coffeeTypeFilter;
      
      return matchesSearch && matchesCoffeeType;
    });
  }, [products, searchTerm, coffeeTypeFilter]);

  // Get unique coffee types for filter
  const coffeeTypes = useMemo(() => {
    const types = [...new Set(products.map(p => p.coffeeTypeName))];
    return types.sort();
  }, [products]);

  // Get available contract delivery items for selected batch
  const availableContractItems = useMemo(() => {
    if (!contractDeliveryItems.length) return [];
    
    return contractDeliveryItems.map(item => ({
      contractDeliveryItemId: item.deliveryItemId,
      label: `${item.coffeeTypeName} - KH: ${item.plannedQuantity}`,
      coffeeTypeName: item.coffeeTypeName,
      plannedQuantity: item.plannedQuantity
    }));
  }, [contractDeliveryItems]);

  const handleProductSelection = (product: ProductViewAllDto, isSelected: boolean) => {
    if (isSelected) {
      // Find available contract delivery item
      const contractItem = availableContractItems.find(item => 
        item.coffeeTypeName === product.coffeeTypeName
      );
      
      if (!contractItem) {
        toast.error(t("managerOrders.create.multiProduct.validation.noContractItem"));
        return;
      }
      
      // For single mode, clear existing products first
      if (orderMode === "single") {
        setSelectedProducts([]);
      } else {
        // Check if product is already selected in multiple mode
        if (selectedProducts.some(p => p.productId === product.productId)) {
          toast.error(t("managerOrders.create.multiProduct.validation.productAlreadySelected"));
          return;
        }
      }
      
      const selectedProduct: SelectedProduct = {
        productId: product.productId,
        productCode: product.productCode,
        productName: product.productName,
        coffeeTypeName: product.coffeeTypeName,
        quantityAvailable: product.quantityAvailable || 0,
        unit: product.unit,
        unitPrice: product.unitPrice || 0,
        selectedQuantity: Math.min(1, product.quantityAvailable || 1),
        contractDeliveryItemId: contractItem.contractDeliveryItemId,
        contractDeliveryItemLabel: contractItem.label
      };
      
      if (orderMode === "single") {
        setSelectedProducts([selectedProduct]);
      } else {
        setSelectedProducts(prev => [...prev, selectedProduct]);
      }
    } else {
      setSelectedProducts(prev => prev.filter(p => p.productId !== product.productId));
    }
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(prev => prev.map(p => 
      p.productId === productId 
        ? { ...p, selectedQuantity: Math.max(0, Math.min(quantity, p.quantityAvailable)) }
        : p
    ));
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const handleSubmit = async () => {
    if (!selectedDeliveryBatch) {
      toast.error(t("managerOrders.create.multiProduct.validation.selectDeliveryBatch"));
      return;
    }
    
    if (selectedProducts.length === 0) {
      toast.error(orderMode === "single" 
        ? t("managerOrders.create.multiProduct.validation.selectOneProduct")
        : t("managerOrders.create.multiProduct.validation.selectAtLeastOneProduct")
      );
      return;
    }
    
    // Validate quantities
    const invalidProducts = selectedProducts.filter(p => p.selectedQuantity <= 0);
    if (invalidProducts.length > 0) {
      toast.error(t("managerOrders.create.multiProduct.validation.invalidQuantity"));
      return;
    }
    
    // Validate order date
    if (formData.orderDate) {
      const selectedDate = new Date(formData.orderDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (selectedDate > today) {
        toast.error(t("managerOrders.create.multiProduct.validation.orderDateExceedsCurrent"));
        return;
      }
    }
    
    // Validate actual delivery date
    if (formData.actualDeliveryDate) {
      const selectedDate = new Date(formData.actualDeliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (selectedDate > today) {
        toast.error(t("managerOrders.create.multiProduct.validation.deliveryDateExceedsCurrent"));
        return;
      }
      
      // Validate actual delivery date không được trước order date
      if (formData.orderDate) {
        const orderDate = new Date(formData.orderDate);
        if (selectedDate < orderDate) {
          toast.error(t("managerOrders.create.multiProduct.validation.deliveryDateBeforeOrder"));
          return;
        }
      }
    }
    
    setLoading(true);
    
    try {
      // Tạo UUID tạm thời cho orderId (backend sẽ thay thế)
      const tempOrderId = crypto.randomUUID();
      
      const orderItems: OrderItemCreateInline[] = selectedProducts.map(p => ({
        orderId: tempOrderId, // Backend yêu cầu Guid, tạo UUID tạm thời
        contractDeliveryItemId: p.contractDeliveryItemId,
        productId: p.productId,
        quantity: p.selectedQuantity,
        unitPrice: p.unitPrice,
        discountAmount: 0,
        note: ""
      }));
      
      const orderData: OrderCreateDto = {
        deliveryBatchId: selectedDeliveryBatch,
        deliveryRound: formData.deliveryRound ? parseInt(formData.deliveryRound) : undefined,
        orderDate: formData.orderDate || undefined,
        actualDeliveryDate: formData.actualDeliveryDate || undefined,
        note: formData.note || undefined,
        status: formData.status,
        orderItems
      };
      
      // Debug: Log dữ liệu gửi lên
      console.log("Order data being sent:", orderData);
      
      await createOrder(orderData);
      toast.success(t("managerOrders.create.multiProduct.validation.createOrderSuccess"));
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(t("managerOrders.create.multiProduct.validation.createOrderError") + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = selectedProducts.reduce((sum, p) => 
    sum + (p.unitPrice * p.selectedQuantity), 0
  );

  const totalQuantity = selectedProducts.reduce((sum, p) => 
    sum + p.selectedQuantity, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("managerOrders.create.multiProduct.title")}</h1>
          <p className="text-gray-600">
            {orderMode === "single" 
              ? t("managerOrders.create.multiProduct.subtitle")
              : t("managerOrders.create.multiProduct.subtitle")
            }
          </p>
        </div>
        
        {/* Order Mode Selection */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">{t("managerOrders.create.multiProduct.orderMode.title")}</Label>
            <Select value={orderMode} onValueChange={(value: "single" | "multiple") => setOrderMode(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">{t("managerOrders.create.multiProduct.orderMode.single")}</SelectItem>
                <SelectItem value="multiple">{t("managerOrders.create.multiProduct.orderMode.multiple")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Delivery Batch Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t("managerOrders.create.multiProduct.deliveryBatchInfo.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryBatch">{t("managerOrders.create.multiProduct.deliveryBatchInfo.deliveryBatch")}</Label>
                <Select 
                  value={selectedDeliveryBatch} 
                  onValueChange={setSelectedDeliveryBatch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("managerOrders.create.multiProduct.deliveryBatchInfo.selectDeliveryBatch")} />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryBatches.map(batch => (
                      <SelectItem key={batch.deliveryBatchId} value={batch.deliveryBatchId}>
                        {batch.deliveryBatchCode} - {batch.contractNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedDeliveryBatch && (
                <div className="space-y-2">
                  <Label htmlFor="deliveryRound">{t("managerOrders.create.multiProduct.deliveryBatchInfo.deliveryRound")}</Label>
                  <Input
                    id="deliveryRound"
                    type="number"
                    placeholder={t("managerOrders.create.multiProduct.deliveryBatchInfo.deliveryRoundPlaceholder")}
                    value={formData.deliveryRound}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryRound: e.target.value }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t("managerOrders.create.multiProduct.orderInfo.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderDate">{t("managerOrders.create.multiProduct.orderInfo.orderDate")}</Label>
                <Input
                  id="orderDate"
                  type="date"
                  max={new Date().toISOString().split('T')[0]} // Không cho phép chọn ngày trong tương lai
                  value={formData.orderDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                />
                <p className="text-xs text-gray-500">{t("managerOrders.create.multiProduct.orderInfo.orderDateHelp")}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="actualDeliveryDate">{t("managerOrders.create.multiProduct.orderInfo.actualDeliveryDate")}</Label>
                <Input
                  id="actualDeliveryDate"
                  type="date"
                  max={new Date().toISOString().split('T')[0]} // Không cho phép chọn ngày trong tương lai
                  value={formData.actualDeliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualDeliveryDate: e.target.value }))}
                />
                <p className="text-xs text-gray-500">{t("managerOrders.create.multiProduct.orderInfo.deliveryDateHelp")}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note">{t("managerOrders.create.multiProduct.orderInfo.note")}</Label>
                <Textarea
                  id="note"
                  placeholder={t("managerOrders.create.multiProduct.orderInfo.notePlaceholder")}
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">{t("managerOrders.create.multiProduct.orderInfo.status")}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as OrderStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OrderStatus.Pending}>{t("managerOrders.status.pending")}</SelectItem>
                    <SelectItem value={OrderStatus.Preparing}>{t("managerOrders.status.preparing")}</SelectItem>
                    <SelectItem value={OrderStatus.Shipped}>{t("managerOrders.status.shipped")}</SelectItem>
                    <SelectItem value={OrderStatus.Delivered}>{t("managerOrders.status.delivered")}</SelectItem>
                    <SelectItem value={OrderStatus.Cancelled}>{t("managerOrders.status.cancelled")}</SelectItem>
                    <SelectItem value={OrderStatus.Failed}>{t("managerOrders.status.failed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          {selectedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  {t("managerOrders.create.multiProduct.orderSummary.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderMode === "multiple" && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t("managerOrders.create.multiProduct.orderSummary.productCount")}</span>
                    <span className="font-medium">{selectedProducts.length}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {orderMode === "single" ? t("managerOrders.create.multiProduct.orderSummary.totalQuantity") : t("managerOrders.create.multiProduct.orderSummary.totalQuantity")}
                  </span>
                  <span className="font-medium">{totalQuantity.toLocaleString()} kg</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">
                    {orderMode === "single" ? t("managerOrders.create.multiProduct.orderSummary.totalAmount") : t("managerOrders.create.multiProduct.orderSummary.totalAmount")}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {totalAmount.toLocaleString()} VNĐ
                  </span>
                </div>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? t("managerOrders.create.multiProduct.orderSummary.creating") : t("managerOrders.create.multiProduct.orderSummary.createOrder")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Selection Toggle - Only show for multiple mode */}
          {orderMode === "multiple" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t("managerOrders.create.multiProduct.productSelection.multipleMode.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowProductSelection(!showProductSelection)}
                  variant="outline"
                  className="w-full"
                >
                  {showProductSelection ? t("managerOrders.create.multiProduct.productSelection.multipleMode.hideProductList") : t("managerOrders.create.multiProduct.productSelection.multipleMode.showProductList")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Single Product Selection */}
          {orderMode === "single" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t("managerOrders.create.multiProduct.productSelection.singleMode.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Selection */}
                <div className="space-y-2">
                  <Label htmlFor="singleProduct">{t("managerOrders.create.multiProduct.productSelection.singleMode.product")}</Label>
                  <Select 
                    value={selectedProducts[0]?.productId || ""} 
                    onValueChange={(productId) => {
                      const product = products.find(p => p.productId === productId);
                      if (product) {
                        handleProductSelection(product, true);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("managerOrders.create.multiProduct.productSelection.singleMode.selectProduct")} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.productId} value={product.productId}>
                          {product.productName} - {product.coffeeTypeName} ({product.quantityAvailable} {product.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity Input for Single Product */}
                {selectedProducts.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="singleQuantity">{t("managerOrders.create.multiProduct.productSelection.singleMode.quantity")}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="singleQuantity"
                        type="number"
                        min="0"
                        max={selectedProducts[0]?.quantityAvailable || 0}
                        value={selectedProducts[0]?.selectedQuantity || 0}
                        onChange={(e) => updateProductQuantity(selectedProducts[0]?.productId, parseInt(e.target.value) || 0)}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500">{selectedProducts[0]?.unit}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t("managerOrders.create.multiProduct.productSelection.singleMode.inventory")} {selectedProducts[0]?.quantityAvailable?.toLocaleString()} {selectedProducts[0]?.unit}
                    </p>
                  </div>
                )}

                {/* Product Info */}
                {selectedProducts.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{t("managerOrders.create.multiProduct.productSelection.singleMode.productInfo")}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><span className="font-medium">{t("managerOrders.create.multiProduct.productSelection.singleMode.code")}</span> {selectedProducts[0].productCode}</div>
                      <div><span className="font-medium">{t("managerOrders.create.multiProduct.productSelection.singleMode.type")}</span> {selectedProducts[0].coffeeTypeName}</div>
                      <div><span className="font-medium">{t("managerOrders.create.multiProduct.productSelection.singleMode.unitPrice")}</span> {selectedProducts[0].unitPrice?.toLocaleString()} VNĐ</div>
                      <div><span className="font-medium">{t("managerOrders.create.multiProduct.productSelection.singleMode.warehouse")}</span> {products.find(p => p.productId === selectedProducts[0].productId)?.inventoryLocation}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Selection Interface */}
          {orderMode === "multiple" && showProductSelection && (
            <Card>
              <CardHeader>
                <CardTitle>{t("managerOrders.create.multiProduct.productSelection.multipleMode.productList")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder={t("managerOrders.create.multiProduct.productSelection.multipleMode.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-48">
                    <Select value={coffeeTypeFilter} onValueChange={setCoffeeTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("managerOrders.create.multiProduct.productSelection.multipleMode.coffeeTypeFilter")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("managerOrders.create.multiProduct.productSelection.multipleMode.allTypes")}</SelectItem>
                        {coffeeTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Products List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredProducts.map(product => {
                    const isSelected = selectedProducts.some(p => p.productId === product.productId);
                    const selectedProduct = selectedProducts.find(p => p.productId === product.productId);
                    
                    return (
                      <div key={product.productId} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleProductSelection(product, checked as boolean)
                            }
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{product.productName}</h4>
                                <p className="text-sm text-gray-600">{product.productCode}</p>
                              </div>
                              <Badge variant="outline">{product.coffeeTypeName}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                              <div>
                                <span className="font-medium">{t("managerOrders.create.multiProduct.productSelection.multipleMode.productCard.warehouse")}</span> {product.inventoryLocation}
                              </div>
                              <div>
                                <span className="font-medium">{t("managerOrders.create.multiProduct.productSelection.multipleMode.productCard.batch")}</span> {product.batchCode}
                              </div>
                              <div>
                                <span className="font-medium">{t("managerOrders.create.multiProduct.productSelection.multipleMode.productCard.unitPrice")}</span> {product.unitPrice?.toLocaleString()} VNĐ
                              </div>
                              <div>
                                <span className="font-medium">{t("managerOrders.create.multiProduct.productSelection.multipleMode.productCard.inventory")}</span> {product.quantityAvailable?.toLocaleString()} {product.unit}
                              </div>
                            </div>
                            
                            {isSelected && selectedProduct && (
                              <div className="flex items-center gap-3">
                                <Label htmlFor={`qty-${product.productId}`} className="text-sm font-medium">
                                  {t("managerOrders.create.multiProduct.productSelection.multipleMode.productCard.quantity")}:
                                </Label>
                                <Input
                                  id={`qty-${product.productId}`}
                                  type="number"
                                  min="0"
                                  max={product.quantityAvailable || 0}
                                  value={selectedProduct.selectedQuantity}
                                  onChange={(e) => updateProductQuantity(product.productId, parseInt(e.target.value) || 0)}
                                  className="w-24"
                                />
                                <span className="text-sm text-gray-500">{product.unit}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeProduct(product.productId)}
                                  className="ml-auto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>{t("managerOrders.create.multiProduct.productSelection.multipleMode.noProductsFound")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Products Summary */}
          {orderMode === "multiple" && selectedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  {t("managerOrders.create.multiProduct.selectedProducts.title")} ({selectedProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedProducts.map(product => (
                    <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.productName}</h4>
                        <p className="text-sm text-gray-600">{product.productCode} - {product.coffeeTypeName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{product.selectedQuantity.toLocaleString()} {product.unit}</p>
                        <p className="text-sm text-gray-600">
                          {(product.unitPrice * product.selectedQuantity).toLocaleString()} VNĐ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
