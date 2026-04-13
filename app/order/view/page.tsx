"use client";
import React, { Suspense, useCallback } from 'react';
import Link from 'next/link';
import { Footer, FormInput, FormSelect, FileInput, Spinner } from '../../components/ui';
import { BackArrowIcon, EditIcon, SaveIcon, CancelIcon, PlusIcon, TrashIcon } from '../../components/icons';
import { OrderStatusTracker } from '../../components/order/OrderStatusTracker';
import { OrderSummaryCard } from '../../components/order/OrderSummaryCard';
import { useOrder } from '../../hooks/useOrder';
import { presignGetOrderAssetUrl } from '../../../lib/apiClient';
import { OrderR2ImageStrip } from '../../components/order/OrderR2ImageStrip';
import {
  stateOptions,
  eyeColorOptions,
  hairColorOptions,
  sexOptions,
  monthOptions,
  dayOptions,
  yearOptions
} from '../../../lib/constants';

function OrderViewContent() {
  const {
    loggedInUser, isAuthChecking, isLoadingInitialData, fetchError,
    orderData, editableOrderData, isEditing, isSavingChanges, saveFeedback,
    startEditing, cancelEditing, saveChanges, updateGeneralField, updateIdField
  } = useOrder();

  // Must run before any early return — hooks count must be stable across loading / empty / ready.
  const resolveUserAsset = useCallback(
    (key: string) => {
      if (!orderData?.orderId) {
        return Promise.reject(new Error('No order'));
      }
      return presignGetOrderAssetUrl(orderData.orderId, key);
    },
    [orderData?.orderId]
  );

  if (isAuthChecking || isLoadingInitialData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-lg font-bold text-white mb-4">Order not found.</p>
        <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 transition-colors">Back to Dashboard</Link>
      </div>
    );
  }

  const viewingData = isEditing ? editableOrderData! : orderData;

  /* Shared input classes for inline editing */
  const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none transition-all";

  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">

        {/* Back link */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6">
          <BackArrowIcon className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Summary Card */}
        <OrderSummaryCard
          order={orderData}
          onStartEdit={startEditing}
          canEdit={!isEditing && orderData.status !== 'shipped' && orderData.status !== 'delivered'}
        />

        {/* Status Tracker */}
        <div className="mt-6">
          <OrderStatusTracker status={orderData.status} />
        </div>

        {/* Save feedback */}
        {saveFeedback && (
          <div className={`p-4 rounded-lg text-center text-sm font-semibold mb-6 ${saveFeedback.includes("Error")
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
            {saveFeedback}
          </div>
        )}

        {/* Order Details & Form */}
        <div className="glass p-6 lg:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Order Details</h3>
            {isEditing && (
              <div className="flex gap-3">
                <button onClick={cancelEditing} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-400 bg-white/[0.04] border border-white/[0.08] hover:bg-red-500/10 transition" disabled={isSavingChanges}>
                  <CancelIcon className="h-4 w-4" /> Cancel
                </button>
                <button onClick={saveChanges} className="btn btn-primary px-4 py-2 text-sm flex items-center gap-2" disabled={isSavingChanges}>
                  {isSavingChanges ? <Spinner size="sm" /> : <SaveIcon className="h-4 w-4" />}
                  Save
                </button>
              </div>
            )}
          </div>

          {/* General fields */}
          <div className="space-y-4 mb-8 border-b border-white/[0.06] pb-8">
            <div>
              <label className="text-label mb-1 block">Shipping Address</label>
              {isEditing ? (
                <input className={inputCls} value={editableOrderData?.shipping || ''} onChange={(e) => updateGeneralField('shipping', e.target.value)} />
              ) : (
                <p className="text-white">{orderData.shipping}</p>
              )}
            </div>
            <div>
              <label className="text-label mb-1 block">Order Notes</label>
              {isEditing ? (
                <textarea className={`${inputCls} resize-none`} rows={3} value={editableOrderData?.notes || ''} onChange={(e) => updateGeneralField('notes', e.target.value)} />
              ) : (
                <p className="text-zinc-400 italic">{orderData.notes || "No notes."}</p>
              )}
            </div>
          </div>

          {/* ID Forms */}
          <div className="space-y-6">
            {viewingData.ids.map((idForm, index) => (
              <div key={index} className="bg-white/[0.02] p-5 sm:p-6 rounded-lg border border-white/[0.06]">
                <h4 className="text-base font-bold text-white mb-4 flex items-center gap-3">
                  <span className="bg-indigo-500/15 text-indigo-400 px-2.5 py-0.5 rounded text-xs font-semibold">ID #{index + 1}</span>
                  {idForm.firstName} {idForm.lastName}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1">
                    <FormSelect label="State" name="state" value={idForm.state} onChange={(e) => isEditing && updateIdField(index, 'state', e.target.value)} options={stateOptions} disabled={!isEditing} />
                  </div>
                  <FormInput label="First Name" name="firstName" value={idForm.firstName} onChange={(e) => isEditing && updateIdField(index, 'firstName', e.target.value)} disabled={!isEditing} />
                  <FormInput label="Last Name" name="lastName" value={idForm.lastName} onChange={(e) => isEditing && updateIdField(index, 'lastName', e.target.value)} disabled={!isEditing} />

                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <FormInput label="Street Address" name="streetAddress" value={idForm.streetAddress} onChange={(e) => isEditing && updateIdField(index, 'streetAddress', e.target.value)} disabled={!isEditing} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <FormInput label="City" name="city" value={idForm.city} onChange={(e) => isEditing && updateIdField(index, 'city', e.target.value)} disabled={!isEditing} />
                      <FormInput label="ZIP" name="zipCode" value={idForm.zipCode} onChange={(e) => isEditing && updateIdField(index, 'zipCode', e.target.value)} disabled={!isEditing} />
                    </div>
                  </div>

                  <div>
                    <label className="text-label mb-1 block">Date of Birth</label>
                    <div className="flex gap-2">
                      <FormSelect name="dobMonth" value={idForm.dobMonth || '01'} onChange={(e) => isEditing && updateIdField(index, 'dobMonth', e.target.value)} options={monthOptions} disabled={!isEditing} />
                      <FormSelect name="dobDay" value={idForm.dobDay || '01'} onChange={(e) => isEditing && updateIdField(index, 'dobDay', e.target.value)} options={dayOptions} disabled={!isEditing} />
                      <FormSelect name="dobYear" value={idForm.dobYear || '2000'} onChange={(e) => isEditing && updateIdField(index, 'dobYear', e.target.value)} options={yearOptions} disabled={!isEditing} />
                    </div>
                  </div>

                  <div>
                    <label className="text-label mb-1 block">Characteristics</label>
                    <div className="grid grid-cols-3 gap-2">
                      <FormInput label="Hgt(ft)" name="heightFeet" value={idForm.heightFeet} onChange={(e) => isEditing && updateIdField(index, 'heightFeet', e.target.value)} disabled={!isEditing} />
                      <FormInput label="Wgt" name="weight" value={idForm.weight} onChange={(e) => isEditing && updateIdField(index, 'weight', e.target.value)} disabled={!isEditing} />
                      <FormSelect label="Sex" name="sex" value={idForm.sex} onChange={(e) => isEditing && updateIdField(index, 'sex', e.target.value)} options={sexOptions} disabled={!isEditing} />
                    </div>
                  </div>

                  <div>
                    <label className="text-label mb-1 block">Biometrics</label>
                    <div className="grid grid-cols-2 gap-2">
                      <FormSelect label="Eyes" name="eyeColor" value={idForm.eyeColor} onChange={(e) => isEditing && updateIdField(index, 'eyeColor', e.target.value)} options={eyeColorOptions} disabled={!isEditing} />
                      <FormSelect label="Hair" name="hairColor" value={idForm.hairColor} onChange={(e) => isEditing && updateIdField(index, 'hairColor', e.target.value)} options={hairColorOptions} disabled={!isEditing} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/[0.06]">
                  <h5 className="text-label mb-3">Photo &amp; signature</h5>
                  <OrderR2ImageStrip
                    slots={[
                      { label: 'Photo', objectKey: idForm.photoKey },
                      { label: 'Signature', objectKey: idForm.signatureKey },
                    ]}
                    resolveUrl={resolveUserAsset}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function OrderViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
      <OrderViewContent />
    </Suspense>
  );
}
