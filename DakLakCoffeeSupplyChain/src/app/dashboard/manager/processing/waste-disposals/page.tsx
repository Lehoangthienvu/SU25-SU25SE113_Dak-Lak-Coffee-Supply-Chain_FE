"use client";

import React from "react";
import { useTranslation } from "react-i18next";

const ManagerProcessingWasteDisposalsPage = () => {
  const { t } = useTranslation();
  
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t('processing.pages.managerBatches.wasteDisposals.title')}</h1>
      <div className="border rounded p-4 bg-gray-50">{t('processing.pages.managerBatches.wasteDisposals.subtitle')}</div>
    </main>
  );
};

export default ManagerProcessingWasteDisposalsPage; 