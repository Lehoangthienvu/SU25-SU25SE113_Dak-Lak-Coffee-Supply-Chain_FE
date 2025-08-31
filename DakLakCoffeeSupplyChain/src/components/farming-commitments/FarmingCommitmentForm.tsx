import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FiTrash2 } from "react-icons/fi";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { LoadingButton } from "@/components/ui/loadingProgress";
import { CultivationRegistration } from "@/lib/api/cultivationRegistrations";
import { calculateEstimatedDeliveryDates } from "@/lib/helpers/dateHelpers";
import { useTranslation } from "react-i18next";

export interface FarmingCommitmentDetailsFormData {
  commitmentDetailId?: string | undefined;
  registrationDetailId: string;
  confirmedPrice: number;
  advancePayment: number;
  committedQuantity: number;
  estimatedDeliveryStart: string;
  estimatedDeliveryEnd: string;
  note: string;
  //contractDeliveryItemId: number;
}

export interface FarmingCommitmentFormData {
  commitmentName: string;
  note: string;
  farmingCommitmentDetails: FarmingCommitmentDetailsFormData[];
}

interface Props {
  initialData?: FarmingCommitmentFormData;
  registration?: CultivationRegistration;
  loading: boolean;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onChange: (formData: FarmingCommitmentFormData) => void;
  onSubmit: () => void;
  onAddDetail: () => void;
  onRemoveDetail: (index: number) => void;
}

export default function FarmingCommitmentForm({
  initialData,
  registration,
  loading,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
  onAddDetail,
  onRemoveDetail,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FarmingCommitmentFormData>(
    initialData || {
      commitmentName: "",
      note: "",
      farmingCommitmentDetails: [],
    }
  );

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  // Khi giá trị form thay đổi sẽ đẩy lên parent
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);
    onChange(newForm);
  };

  const handleDetailChange = (
    index: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const numberFields = [
      "confirmedPrice",
      "advancePayment",
      "committedQuantity",
    ];

    const newDetails = [...form.farmingCommitmentDetails];
    
    // Nếu đang chọn registrationDetailId, tự động điền các giá trị khác
    if (name === "registrationDetailId" && value && registration) {
      const selectedDetail = registration.cultivationRegistrationDetails.find(
        (d) => d.cultivationRegistrationDetailId === value
      );
      
      if (selectedDetail) {
        // Tính toán ngày giao hàng dự kiến
        const { estimatedDeliveryStart, estimatedDeliveryEnd } = calculateEstimatedDeliveryDates(
          selectedDetail.expectedHarvestEnd || ""
        );
        
        newDetails[index] = {
          ...newDetails[index],
          [name]: value,
          confirmedPrice: selectedDetail.wantedPrice || 0,
          committedQuantity: selectedDetail.estimatedYield || 0,
          estimatedDeliveryStart,
          estimatedDeliveryEnd,
        };
      } else {
        newDetails[index] = {
          ...newDetails[index],
          [name]: value,
        };
      }
    } else {
      newDetails[index] = {
        ...newDetails[index],
        [name]: numberFields.includes(name) ? Number(value) : value,
      };
    }

    const newForm = { ...form, farmingCommitmentDetails: newDetails };
    setForm(newForm);
    onChange(newForm);
  };

  const handleAddDetail = () => {
    onAddDetail();
  };

  const handleRemoveDetail = (index: number) => {
    onRemoveDetail(index);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className='space-y-4 max-w-2xl mx-auto'>
        <div>
          <Label htmlFor='commitmentName'>
            {t('farmingCommitment.components.farmingCommitmentForm.fields.commitmentName.label')}<span className='text-red-500'>{t('farmingCommitment.components.farmingCommitmentForm.fields.commitmentName.required')}</span>
          </Label>
          <Input
            name='commitmentName'
            value={form.commitmentName}
            onChange={handleChange}
            required
            placeholder={t('farmingCommitment.components.farmingCommitmentForm.fields.commitmentName.placeholder')}
          />
          {errors["commitmentName"] && (
            <p className='text-red-500 text-xs'>{errors["commitmentName"]}</p>
          )}
        </div>

        <div>
          <Label htmlFor='note'>{t('farmingCommitment.components.farmingCommitmentForm.fields.generalTerms.label')}</Label>
          <Textarea
            id={"note"}
            name='note'
            value={form.note}
            onChange={handleChange}
            placeholder={t('farmingCommitment.components.farmingCommitmentForm.fields.generalTerms.placeholder')}
          />
        </div>

        {form.farmingCommitmentDetails.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <p>{t('farmingCommitment.components.farmingCommitmentForm.noDetails.title')}</p>
            <p className='text-sm mt-1'>{t('farmingCommitment.components.farmingCommitmentForm.noDetails.subtitle')}</p>
          </div>
        ) : (
          form.farmingCommitmentDetails.map((detail, index) => {
          const alreadySelected = form.farmingCommitmentDetails
            .map((d, i) => (i === index ? null : d.registrationDetailId))
            .filter(Boolean);

            const options = registration?.cultivationRegistrationDetails.filter(
            (d) =>
              !alreadySelected.includes(
              d.cultivationRegistrationDetailId ?? null
              ) && d.status === "Approved"
            );
          return (
            <Card key={index} className='mb-4 border'>
              <CardHeader className='flex justify-between items-center'>
                <CardTitle>{t('farmingCommitment.components.farmingCommitmentForm.detailTitle', { index: index + 1 })}</CardTitle>
                {form.farmingCommitmentDetails.length > 1 && (
                  <Button
                    variant='destructiveGradient'
                    size='sm'
                    onClick={() => handleRemoveDetail(index)}
                    type='button'
                  >
                    <FiTrash2 className='mr-1' />
                    {t('farmingCommitment.components.farmingCommitmentForm.buttons.removeDetail')}
                  </Button>
                )}
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <Label htmlFor={`registrationDetailId-${index}`}>
                    {t('farmingCommitment.components.farmingCommitmentForm.fields.registrationDetailId.label')}
                    <span className='text-red-500'>{t('farmingCommitment.components.farmingCommitmentForm.fields.registrationDetailId.required')}</span>
                  </Label>
                  {loading ? (
                    <LoadingSpinner />
                  ) : !options || options.length === 0 ? (
                    <p className='text-red-500 text-sm italic'>
                      {t('farmingCommitment.components.farmingCommitmentForm.fields.registrationDetailId.noOptions')}
                    </p>
                  ) : (
                    <>
                      <select
                        id={`registrationDetailId-${index}`}
                        name='registrationDetailId'
                        value={detail.registrationDetailId}
                        onChange={(e) => handleDetailChange(index, e)}
                        required
                        className='block w-full rounded border border-gray-300 px-3 py-2 cursor-pointer'
                      >
                        <option value=''>{t('farmingCommitment.components.farmingCommitmentForm.fields.registrationDetailId.placeholder')}</option>
                        {options?.map((registrationDetail) => (
                          <option
                            key={
                              registrationDetail.cultivationRegistrationDetailId
                            }
                            value={
                              registrationDetail.cultivationRegistrationDetailId
                            }
                            className='cursor-pointer'
                          >
                            {registrationDetail?.coffeeType}{" "}
                            {" - Thu hoạch dự kiến: "}
                            {registrationDetail?.estimatedYield}{"kg"}{" "}
                            {" - Giá mong muốn: "}
                            {registrationDetail?.wantedPrice}{"VNĐ/kg"}
                          </option>
                        ))}
                      </select>
                      {errors[`registrationDetailId-${index}`] && (
                        <p className='text-red-500 text-xs'>
                          {errors[`registrationDetailId-${index}`]}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <Label htmlFor={`confirmedPrice-${index}`}>
                    {t('farmingCommitment.components.farmingCommitmentForm.fields.confirmedPrice.label')}
                    <span className='text-red-500'>{t('farmingCommitment.components.farmingCommitmentForm.fields.confirmedPrice.required')}</span>
                  </Label>
                  <Input
                    id={`confirmedPrice-${index}`}
                    type='number'
                    min={0}
                    name='confirmedPrice'
                    value={detail.confirmedPrice}
                    onChange={(e) => handleDetailChange(index, e)}
                    required
                  />
                  {errors[`confirmedPrice${index}`] && (
                    <p className='text-red-500 text-xs'>
                      {errors[`confirmedPrice${index}`]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`advancePayment-${index}`}>
                    {t('farmingCommitment.components.farmingCommitmentForm.fields.advancePayment.label')}
                  </Label>
                  <Input
                    id={`advancePayment-${index}`}
                    type='number'
                    min={0}
                    name='advancePayment'
                    value={detail.advancePayment}
                    onChange={(e) => handleDetailChange(index, e)}
                  />
                </div>

                <div>
                  <Label htmlFor={`committedQuantity-${index}`}>
                    {t('farmingCommitment.components.farmingCommitmentForm.fields.committedQuantity.label')}
                    <span className='text-red-500'>{t('farmingCommitment.components.farmingCommitmentForm.fields.committedQuantity.required')}</span>
                  </Label>
                  <Input
                    id={`committedQuantity-${index}`}
                    type='number'
                    min={0}
                    name='committedQuantity'
                    value={detail.committedQuantity}
                    onChange={(e) => handleDetailChange(index, e)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`estimatedDeliveryStart-${index}`}>
                    {t('farmingCommitment.components.farmingCommitmentForm.fields.estimatedDeliveryStart.label')}{" "}
                    <span className='text-red-500'>{t('farmingCommitment.components.farmingCommitmentForm.fields.estimatedDeliveryStart.required')}</span>
                  </Label>
                  <Input
                    id={`estimatedDeliveryStart-${index}`}
                    type='date'
                    name='estimatedDeliveryStart'
                    value={detail.estimatedDeliveryStart}
                    onChange={(e) => handleDetailChange(index, e)}
                    required
                  />
                  {errors[`estimatedDeliveryStart-${index}`] && (
                    <p className='text-red-500 text-xs'>
                      {errors[`estimatedDeliveryStart-${index}`]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`estimatedDeliveryEnd-${index}`}>
                    {t('farmingCommitment.components.farmingCommitmentForm.fields.estimatedDeliveryEnd.label')}{" "}
                    <span className='text-red-500'>{t('farmingCommitment.components.farmingCommitmentForm.fields.estimatedDeliveryEnd.required')}</span>
                  </Label>
                  <Input
                    id={`estimatedDeliveryEnd-${index}`}
                    type='date'
                    name='estimatedDeliveryEnd'
                    value={detail.estimatedDeliveryEnd}
                    onChange={(e) => handleDetailChange(index, e)}
                    required
                  />
                  {errors[`estimatedDeliveryEnd-${index}`] && (
                    <p className='text-red-500 text-xs'>
                      {errors[`estimatedDeliveryEnd-${index}`]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`note-${index}`}>
                    {t('farmingCommitment.components.farmingCommitmentForm.fields.note.label')}
                    <span className='text-red-500'>{t('farmingCommitment.components.farmingCommitmentForm.fields.note.required')}</span>
                  </Label>
                  <Textarea
                    id={`note-${index}`}
                    name='note'
                    value={detail.note}
                    onChange={(e) => handleDetailChange(index, e)}
                  />
                  {errors[`note-${index}`] && (
                    <p className='text-red-500 text-xs'>
                      {errors[`note-${index}`]}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
        )}

        <div className='flex justify-start mb-6'>
          <Button
            onClick={handleAddDetail}
            variant='secondaryGradient'
            size='sm'
            type='button'
          >
            {t('farmingCommitment.components.farmingCommitmentForm.buttons.addDetail')}
          </Button>
        </div>

        <div className='flex justify-end'>
          <LoadingButton
            loading={isSubmitting}
            type='submit'
            variant='default'
            disabled={isSubmitting}
          >
            {t('farmingCommitment.components.farmingCommitmentForm.buttons.submit')}
          </LoadingButton>
        </div>
      </div>
    </form>
  );
}
