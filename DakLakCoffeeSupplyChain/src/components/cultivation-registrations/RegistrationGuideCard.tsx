"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { FiInfo, FiCheckCircle} from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function RegistrationGuideCard() {
  const { t } = useTranslation();
  return (
    <Card className="w-full p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <FiInfo className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800">
              {t('cultivationRegistration.components.registrationGuide.title')}
            </h3>
            <p className="text-sm text-blue-600">
              {t('cultivationRegistration.components.registrationGuide.subtitle')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Bước 1 */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-700">1</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">{t('cultivationRegistration.components.registrationGuide.steps.step1.title')}</h4>
              <p className="text-sm text-blue-700">
                {t('cultivationRegistration.components.registrationGuide.steps.step1.description')}
              </p>
            </div>
          </div>

          {/* Bước 2 */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-700">2</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">{t('cultivationRegistration.components.registrationGuide.steps.step2.title')}</h4>
              <p className="text-sm text-blue-700">
                {t('cultivationRegistration.components.registrationGuide.steps.step2.description')}
              </p>
            </div>
          </div>

          {/* Bước 3 */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-700">3</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">{t('cultivationRegistration.components.registrationGuide.steps.step3.title')}</h4>
              <p className="text-sm text-blue-700">
                {t('cultivationRegistration.components.registrationGuide.steps.step3.description')}
              </p>
            </div>
          </div>

          {/* Bước 4 */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-700">4</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">{t('cultivationRegistration.components.registrationGuide.steps.step4.title')}</h4>
              <p className="text-sm text-blue-700">
                {t('cultivationRegistration.components.registrationGuide.steps.step4.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Lưu ý quan trọng */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <FiInfo className="h-4 w-4" />
            {t('cultivationRegistration.components.registrationGuide.importantNotes.title')}
          </h4>
          <ul className="space-y-2 text-sm text-yellow-700">
            {(t('cultivationRegistration.components.registrationGuide.importantNotes.items', { returnObjects: true }) as string[]).map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <FiCheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Thông tin liên hệ */}
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            {t('cultivationRegistration.components.registrationGuide.contactInfo.description')}
          </p>
        </div>
      </Card>
  );
}
