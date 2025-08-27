"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAllProcessingBatches, ProcessingBatch } from '@/lib/api/processingBatches';
import { getAllProcessingBatchProgresses, ProcessingBatchProgress } from '@/lib/api/processingBatchProgress';
import { getProcessingStagesByMethodId, ProcessingStage } from '@/lib/api/processingStages';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, User, Package, TrendingUp, FileImage, FileVideo, Scale, Info, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';
import AdvanceProcessingProgressForm from '@/components/processing-batches/AdvanceProcessingProgressForm';

export default function ProgressDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [batch, setBatch] = useState<ProcessingBatch | null>(null);
  const [progresses, setProgresses] = useState<ProcessingBatchProgress[]>([]);
  const [totalStages, setTotalStages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // State cho dialog cập nhật progress
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  
  // State cho media viewer
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video'; caption?: string } | null>(null);
  const [allMedia, setAllMedia] = useState<Array<{ url: string; type: 'image' | 'video'; caption?: string }>>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    if (!id) {
      setError('Thiếu thông tin batchId');
      setLoading(false);
      return;
    }
    fetchBatchData();
  }, [id, retryCount]);

  async function fetchBatchData() {
    try {
      setLoading(true);
      setError(null);
      
      
      
      // Fetch all batches and progresses concurrently with timeout
      
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 seconds timeout
      });
      
      const fetchPromise = Promise.all([
        getAllProcessingBatches(),
        getAllProcessingBatchProgresses()
      ]);
      
      const [allBatches, allProgresses] = await Promise.race([fetchPromise, timeoutPromise]) as [any, any];
      
      
      
      if (!allBatches) {
        
        setError('Không tìm thấy dữ liệu lô sơ chế');
        return;
      }
      
      // Find the specific batch
      const batchData = allBatches.find((b: ProcessingBatch) => b.batchId === id);
      
      
      if (!batchData) {
        
        setError('Không tìm thấy lô sơ chế với ID này');
        return;
      }
      
      // Filter progresses for this batch
      
      const batchProgresses = allProgresses?.filter((p: ProcessingBatchProgress) => p.batchId === id) || [];
      
      
      // Fetch total stages for this method
      let totalStagesCount = 0;
      if (batchData.methodId) {
        try {
          const stages = await getProcessingStagesByMethodId(batchData.methodId);
          totalStagesCount = stages.filter(stage => !stage.isDeleted).length;
  
        } catch (err) {
          
          totalStagesCount = batchData.stageCount || 0;
        }
      } else {
        totalStagesCount = batchData.stageCount || 0;
      }
      
      
      setBatch(batchData);
      setProgresses(batchProgresses);
      setTotalStages(totalStagesCount);
    } catch (err: any) {
      console.error('Error fetching batch:', err);
      console.error('Error details:', err.response?.data);
      
      if (err.message === 'Request timeout') {
        setError('Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại sau.');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  }

  // Hàm mở media viewer với tất cả media
  const openMediaViewer = useCallback((media: { url: string; type: 'image' | 'video'; caption?: string }) => {
    // Thu thập tất cả media từ tất cả progresses
    const allMediaList: Array<{ url: string; type: 'image' | 'video'; caption?: string }> = [];
    let targetIndex = 0;
    let foundTarget = false;
    
    progresses.forEach(progress => {
      if (progress.mediaFiles) {
        progress.mediaFiles.forEach((mediaFile, idx) => {
          allMediaList.push({
            url: mediaFile.mediaUrl,
            type: mediaFile.mediaType,
            caption: mediaFile.caption
          });
          
          // Tìm index của media được click
          if (mediaFile.mediaUrl === media.url && !foundTarget) {
            targetIndex = allMediaList.length - 1;
            foundTarget = true;
          }
        });
      }
    });

    setAllMedia(allMediaList);
    setCurrentMediaIndex(targetIndex);
    setSelectedMedia(media);
    setMediaViewerOpen(true);
  }, [progresses]);

  // Hàm chuyển media
  const navigateMedia = useCallback((direction: 'prev' | 'next') => {
    if (allMedia.length === 0) return;
    
    let newIndex = currentMediaIndex;
    if (direction === 'prev') {
      newIndex = currentMediaIndex > 0 ? currentMediaIndex - 1 : allMedia.length - 1;
    } else {
      newIndex = currentMediaIndex < allMedia.length - 1 ? currentMediaIndex + 1 : 0;
    }
    
    setCurrentMediaIndex(newIndex);
    setSelectedMedia(allMedia[newIndex]);
  }, [allMedia, currentMediaIndex]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };



  // Kiểm tra xem đã hoàn thành tất cả các bước chưa
  const isAllStepsCompleted = totalStages > 0 && progresses.length >= totalStages;


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="p-6 max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <PageTitle
              title="Chi tiết tiến trình sơ chế"
              subtitle="Đang tải dữ liệu..."
            />
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="p-6 max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <PageTitle
              title="Chi tiết tiến trình sơ chế"
              subtitle="Có lỗi xảy ra"
            />
            <div className="flex gap-3">
              <Button 
                onClick={handleRetry}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                Thử lại
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 overflow-hidden">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Info className="w-16 h-16 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button 
                onClick={handleRetry}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="p-6 max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <PageTitle
              title="Chi tiết tiến trình sơ chế"
              subtitle="Thông tin chi tiết về tiến trình sơ chế"
            />
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <Info className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy dữ liệu</h3>
              <p className="text-gray-600 mb-6">Lô sơ chế này không tồn tại hoặc đã bị xóa.</p>
              <Button 
                variant="outline" 
                onClick={() => router.back()}
              >
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

      return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageTitle
            title="Chi tiết tiến trình sơ chế"
            subtitle={`Lô: ${batch.batchCode} - ${progresses.length} bước đã hoàn thành`}
          />
          <div className="flex gap-3">
            {/* Chỉ hiển thị nút "Cập nhật tiến trình" khi chưa hoàn thành tất cả các bước */}
            {!isAllStepsCompleted && (
              <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Cập nhật tiến trình
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Cập nhật tiến trình sơ chế</DialogTitle>
                    <DialogDescription>Form cập nhật thông tin tiến trình sơ chế</DialogDescription>
                  </DialogHeader>
                  {batch && (
                    <AdvanceProcessingProgressForm
                      batchId={batch.batchId}
                      latestProgress={progresses.length > 0 ? progresses[progresses.length - 1] : undefined}
                      onSuccess={() => {
                        setIsUpdateDialogOpen(false);
                        fetchBatchData(); // Refresh data
                      }}
                    />
                  )}
                </DialogContent>
              </Dialog>
            )}
            
            {/* Hiển thị thông báo khi đã hoàn thành tất cả các bước */}
            {isAllStepsCompleted && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg border border-green-200">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Đã hoàn thành tất cả các bước</span>
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
          </div>
        </div>

        {/* Batch Info Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              Thông tin lô sơ chế
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mã lô</p>
                    <p className="font-semibold text-gray-900">{batch.batchCode}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mùa vụ</p>
                    <p className="font-semibold text-gray-900">{batch.cropSeasonName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nông dân</p>
                    <p className="font-semibold text-gray-900">{batch.farmerName}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phương pháp sơ chế</p>
                    <p className="font-semibold text-gray-900">{batch.methodName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Scale className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Khối lượng vào</p>
                    <p className="font-semibold text-gray-900">
                      {new Intl.NumberFormat("vi-VN").format(Number(batch.totalInputQuantity))} kg
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày tạo</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(batch.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progresses Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Các bước tiến trình sơ chế ({progresses.length} bước)
            </h2>
          </div>

          <div className="p-6">
            {progresses && progresses.length > 0 ? (
              <div className="space-y-6">
                {progresses
                  .sort((a, b) => a.stepIndex - b.stepIndex) // Sắp xếp theo stepIndex
                  .map((progress, idx) => {
                    // Kiểm tra xem có phải bước retry không
                    const isRetryStep = progress.stepIndex > 1 && idx > 0;
                    const previousProgress = idx > 0 ? progresses.find(p => p.stepIndex === progress.stepIndex - 1) : null;
                    const isRetry = previousProgress && previousProgress.stageName === progress.stageName;
                    
                    return (
                      <div
                        key={idx}
                        className={`bg-gradient-to-br from-white to-gray-50 rounded-xl border transition-all duration-300 hover:shadow-lg p-6 ${
                          isRetry 
                            ? 'border-orange-300 hover:border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                isRetry 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                Bước {progress.stepIndex}
                                {isRetry && (
                                  <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                                    Làm lại
                                  </span>
                                )}
                              </span>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {progress.stageName}
                                {isRetry && (
                                  <span className="ml-2 text-sm text-orange-600 font-medium">
                                    (Làm lại)
                                  </span>
                                )}
                              </h3>
                            </div>

                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Scale className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Sản lượng:</span>
                        <span>{progress.outputQuantity ? `${new Intl.NumberFormat("vi-VN").format(Number(progress.outputQuantity))} ${progress.outputUnit || 'kg'}` : '0 kg'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Cập nhật bởi:</span>
                        <span>{progress.updatedByName ?? "-"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">Ngày:</span>
                        <span>{new Date(progress.progressDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Trạng thái:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Hoàn thành
                        </span>
                      </div>
                    </div>

                    {/* Media Section */}
                    {(progress.mediaFiles && progress.mediaFiles.length > 0) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Tài liệu đính kèm</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {progress.mediaFiles.map((media, mediaIndex) => (
                            <div key={media.mediaId} className="relative group">
                              {media.mediaType === 'image' ? (
                                <div className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                                  <img 
                                    src={media.mediaUrl} 
                                    alt={media.caption || `Ảnh ${mediaIndex + 1} của ${progress.stageName}`} 
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => openMediaViewer({
                                      url: media.mediaUrl,
                                      type: 'image',
                                      caption: media.caption
                                    })}
                                  />
                                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md font-medium">
                                    Ảnh
                                  </div>
                                </div>
                              ) : (
                                <div className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                                  <video 
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    preload="metadata"
                                    onClick={() => openMediaViewer({
                                      url: media.mediaUrl,
                                      type: 'video',
                                      caption: media.caption
                                    })}
                                  >
                                    <source src={media.mediaUrl} type="video/mp4" />
                                  </video>
                                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md font-medium">
                                    Video
                                  </div>
                                  {/* Play button overlay */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black bg-opacity-40 rounded-full p-2">
                                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {media.caption && (
                                <p className="text-xs text-gray-600 mt-2 truncate" title={media.caption}>
                                  {media.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy Media Support (for backward compatibility) */}
                    {(!progress.mediaFiles || progress.mediaFiles.length === 0) && (progress.photoUrl || progress.videoUrl) && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Tài liệu đính kèm (Cũ)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {progress.photoUrl && (
                            <div className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                              <img 
                                src={progress.photoUrl} 
                                alt={`Photo of ${progress.stageName}`} 
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => progress.photoUrl && window.open(progress.photoUrl, '_blank')}
                              />
                              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md font-medium">
                                Ảnh
                              </div>
                            </div>
                          )}
                          
                          {progress.videoUrl && (
                            <div className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                              <video 
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                preload="metadata"
                                onClick={() => progress.videoUrl && window.open(progress.videoUrl, '_blank')}
                              >
                                <source src={progress.videoUrl} />
                              </video>
                              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md font-medium">
                                Video
                              </div>
                              {/* Play button overlay */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black bg-opacity-40 rounded-full p-2">
                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có tiến độ nào</h3>
                <p className="text-gray-500 mb-6">Lô sơ chế này chưa có bước tiến trình nào được thực hiện.</p>
                <Button 
                  onClick={() => setIsUpdateDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm tiến trình đầu tiên
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

              {/* Media Viewer Dialog */}
        <Dialog open={mediaViewerOpen} onOpenChange={setMediaViewerOpen}>
          <DialogContent 
            className="media-viewer-overlay"
            showCloseButton={false}
          >
          {/* Header */}
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMediaViewerOpen(false)}
              className="h-10 w-10 p-0 bg-black/60 hover:bg-red-600 text-white border-white/40 rounded-full shadow-lg hover:shadow-red-500/30 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation Buttons */}
          {allMedia.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMedia('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-black/60 hover:bg-white/20 text-white border-white/40 rounded-full z-50 shadow-lg hover:shadow-white/20 transition-all duration-200"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMedia('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-black/60 hover:bg-white/20 text-white border-white/40 rounded-full z-50 shadow-lg hover:shadow-white/20 transition-all duration-200"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Media Counter */}
          {allMedia.length > 1 && (
            <div className="absolute top-4 left-4 z-50 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
              {currentMediaIndex + 1} / {allMedia.length}
            </div>
          )}

          {/* Media Content */}
          <div className="media-viewer-content">
            {selectedMedia?.type === 'image' ? (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <img 
                  src={selectedMedia.url} 
                  alt={selectedMedia.caption || 'Hình ảnh'} 
                  className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
                {selectedMedia.caption && (
                  <div className="mt-4">
                    <p className="text-sm text-white text-center max-w-2xl bg-black/80 px-4 py-2 rounded-lg backdrop-blur-sm">
                      {selectedMedia.caption}
                    </p>
                  </div>
                )}
              </div>
            ) : selectedMedia?.type === 'video' ? (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <video 
                  controls 
                  autoPlay
                  className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                >
                  <source src={selectedMedia.url} />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
                {selectedMedia.caption && (
                  <div className="mt-4">
                    <p className="text-sm text-white text-center max-w-2xl bg-black/80 px-4 py-2 rounded-lg backdrop-blur-sm">
                      {selectedMedia.caption}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
