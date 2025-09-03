"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SettlementFile {
  roundName: number;
  settlementFileURL: string;
  roundPrice: number;
}

interface SettlementCardProps {
  settlementFiles?: SettlementFile[];
  paymentRounds?: number;
}

export const SettlementCard: React.FC<SettlementCardProps> = ({
  settlementFiles,
  paymentRounds,
}) => {
  const { t } = useTranslation();

  // Get file extension from URL
  const getFileExtension = (url: string): string => {
    const match = url.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : "unknown";
  };

  // Get file icon based on extension
  const getFileIcon = (url: string): string => {
    const ext = getFileExtension(url);
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      return "🖼️";
    } else if (ext === "pdf") {
      return "📄";
    } else if (["doc", "docx"].includes(ext)) {
      return "📝";
    } else {
      return "📎";
    }
  };

  // Handle file download
  const handleDownload = async (url: string, roundName: number) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `settlement-round-${roundName}.${getFileExtension(url)}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      toast.success(t("contract.components.settlement.downloadSuccess", { round: roundName }));
    } catch (error) {
      console.error("Download error:", error);
      toast.error(t("contract.components.settlement.downloadError"));
    }
  };

  // Handle view file
  const handleViewFile = (url: string, roundName: number) => {
    const ext = getFileExtension(url);
    
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      // Open image in new window
      const modal = window.open("", "_blank", "width=800,height=600");
      if (modal) {
        modal.document.write(`
          <html>
            <head>
              <title>${t("contract.components.settlement.viewFile")} - ${t("contract.components.settlement.round")} ${roundName}</title>
              <style>
                body { margin: 0; padding: 20px; background: #f5f5f5; font-family: Arial, sans-serif; }
                .container { max-width: 100%; text-align: center; }
                img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .close-btn { position: fixed; top: 20px; right: 20px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 18px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .file-info { margin-top: 15px; color: #666; }
              </style>
            </head>
            <body>
              <button class="close-btn" onclick="window.close()">✕</button>
              <div class="container">
                <img src="${url}" alt="${t("contract.components.settlement.settlementFile")}" />
                <div class="file-info">
                  <strong>${t("contract.components.settlement.file")}:</strong> ${t("contract.components.settlement.round")} ${roundName}
                </div>
              </div>
            </body>
          </html>
        `);
      }
    } else {
      // Open other files in new tab
      window.open(url, "_blank");
    }
  };

  if (!settlementFiles || !settlementFiles.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            {t("contract.components.settlement.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{t("contract.components.settlement.noFiles")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-600" />
          {t("contract.components.settlement.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment rounds info */}
        {paymentRounds && (
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-sm">
              {t("contract.components.settlement.totalRounds")}: {paymentRounds}
            </Badge>
                         <Badge variant="outline" className="text-sm">
               {t("contract.components.settlement.uploadedFiles")}: {settlementFiles.length}
             </Badge>
          </div>
        )}

                 {/* Settlement files list */}
         <div className="space-y-3">
           {settlementFiles.map((file, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                   <div className="text-2xl">
                     {getFileIcon(file.settlementFileURL)}
                   </div>
                   <div>
                     <h4 className="font-medium text-gray-900">
                       {t("contract.components.settlement.round")} {file.roundName}
                     </h4>
                     <p className="text-sm text-gray-500">
                       {t("contract.components.settlement.settlementFile")} - {getFileExtension(file.settlementFileURL).toUpperCase()}
                     </p>
                     <p className="text-sm font-medium text-green-600">
                       💰 {t("contract.components.settlement.roundPrice")}: {file.roundPrice.toLocaleString()} VND
                     </p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleViewFile(file.settlementFileURL, file.roundName)}
                     className="flex items-center gap-1"
                   >
                     <Eye className="w-4 h-4" />
                     {t("contract.components.settlement.view")}
                   </Button>
                   
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleDownload(file.settlementFileURL, file.roundName)}
                     className="flex items-center gap-1"
                   >
                     <Download className="w-4 h-4" />
                     {t("contract.components.settlement.download")}
                   </Button>
                 </div>
              </div>
            </div>
          ))}
        </div>

                 {/* Summary */}
         <div className="pt-3 border-t border-gray-200">
           <p className="text-sm text-gray-600">
             {t("contract.components.settlement.summary", {
               total: settlementFiles.length,
               rounds: paymentRounds || 0
             })}
           </p>
         </div>
      </CardContent>
    </Card>
  );
};

export default SettlementCard;
