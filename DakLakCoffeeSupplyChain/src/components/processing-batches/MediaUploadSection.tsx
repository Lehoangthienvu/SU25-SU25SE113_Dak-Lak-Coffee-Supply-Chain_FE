"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Upload, Image, Video } from "lucide-react";

interface MediaUploadSectionProps {
  photoFiles: File[];
  videoFiles: File[];
  onPhotoFilesChange: (files: File[]) => void;
  onVideoFilesChange: (files: File[]) => void;
}

export default function MediaUploadSection({
  photoFiles,
  videoFiles,
  onPhotoFilesChange,
  onVideoFilesChange,
}: MediaUploadSectionProps) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'photo' | 'video') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const videoFiles = files.filter(file => file.type.startsWith('video/'));

    if (type === 'photo' && imageFiles.length > 0) {
      onPhotoFilesChange([...photoFiles, ...imageFiles]);
    }
    if (type === 'video' && videoFiles.length > 0) {
      onVideoFilesChange([...videoFiles, ...videoFiles]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photoFiles.filter((_, i) => i !== index);
    onPhotoFilesChange(newPhotos);
  };

  const removeVideo = (index: number) => {
    const newVideos = videoFiles.filter((_, i) => i !== index);
    onVideoFilesChange(newVideos);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Photo Upload Section */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          <Image className="inline w-4 h-4 mr-1" />
          {t("processing.pages.farmerProgresses.mediaUpload.photos")} ({t("processing.pages.farmerProgresses.mediaUpload.multipleSelection")})
        </label>
        
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e, 'photo')}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            {t("processing.pages.farmerProgresses.mediaUpload.dragDrop")}
          </p>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onPhotoFilesChange(Array.from(e.target.files || []))}
            className="hidden"
            id="photo-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            {t("processing.pages.farmerProgresses.mediaUpload.selectPhoto")}
          </Button>
        </div>

        {/* Photo Preview */}
        {photoFiles.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">{t("processing.pages.farmerProgresses.mediaUpload.selectedPhotos", { count: photoFiles.length })}:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {photoFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video Upload Section */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          <Video className="inline w-4 h-4 mr-1" />
          {t("processing.pages.farmerProgresses.mediaUpload.videos")} ({t("processing.pages.farmerProgresses.mediaUpload.multipleSelection")})
        </label>
        
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e, 'video')}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            {t("processing.pages.farmerProgresses.mediaUpload.dragDrop")}
          </p>
          <Input
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => onVideoFilesChange(Array.from(e.target.files || []))}
            className="hidden"
            id="video-upload"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('video-upload')?.click()}
          >
            {t("processing.pages.farmerProgresses.mediaUpload.selectVideo")}
          </Button>
        </div>

        {/* Video Preview */}
        {videoFiles.length > 0 && (
          <div className="mt-3">
                         <p className="text-xs text-gray-500 mb-2">{t("processing.pages.farmerProgresses.mediaUpload.selectedVideos", { count: videoFiles.length })}:</p>
            <div className="space-y-2">
              {videoFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* File Limits Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                 <p className="text-xs text-blue-700">
           <strong>{t("processing.pages.farmerProgresses.mediaUpload.limits.title")}:</strong> {t("processing.pages.farmerProgresses.mediaUpload.limits.maxFiles")} 10 {t("processing.pages.farmerProgresses.mediaUpload.files")}, {t("processing.pages.farmerProgresses.mediaUpload.limits.maxSize")} 50MB. 
           {t("processing.pages.farmerProgresses.mediaUpload.limits.autoCompress")}
         </p>
      </div>
    </div>
  );
}
