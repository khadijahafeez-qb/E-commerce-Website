'use client';

import React, { useState } from 'react';
import { Modal, notification } from 'antd';
import { WarningOutlined, UndoOutlined } from '@ant-design/icons';

interface DeleteConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  getItemName?: () => string;
  actionType?: 'delete' | 'reactivate'; // 👈 new optional prop
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onCancel,
  onConfirm,
  getItemName,
  actionType = 'delete', // default behavior remains delete
}) => {
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();

      const nameToShow = getItemName ? getItemName() : 'Item';
      const actionText = actionType === 'reactivate' ? 'Reactivated' : 'Deleted';

      api.success({
        message: `${actionText}`,
        description: `${nameToShow} has been ${actionText.toLowerCase()} successfully!`,
        duration: 3,
      });

      onCancel();
    } catch (err) {
      const nameToShow = getItemName ? getItemName() : 'Item';
      const actionText = actionType === 'reactivate' ? 'Reactivation' : 'Deletion';

      api.error({
        message: `${actionText} Failed`,
        description: `Failed to ${actionText.toLowerCase()} ${nameToShow}.`,
        duration: 3,
      });

      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isReactivate = actionType === 'reactivate';

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        footer={null}
        closable={false}
        onCancel={onCancel}
        centered
        width={471}
        className="!p-0"
      >
        <div className="flex flex-col items-center text-center">
          <div className="opacity-100 flex flex-col items-center justify-center" style={{ width: '212px', height: '137px' }}>
            <h1 className="font-inter mt-3 font-medium text-[24px] leading-[28.8px] !text-[#007BFF]">
              {isReactivate ? 'Reactivate Variant' : 'Remove Product'}
            </h1>
            {isReactivate ? (
              <UndoOutlined className="mt-3" style={{ fontSize: '63px', color: '#28A745' }} />
            ) : (
              <WarningOutlined className="mt-3" style={{ fontSize: '63px', color: '#FFC107' }} />
            )}
          </div>

          <div className="mt-4">
            <p className="font-inter font-bold text-base">
              Are you sure you want to{' '}
              {isReactivate ? (
                <>
                  reactivate <span className="text-green-600">{getItemName ? getItemName() : 'this item'}</span>?
                </>
              ) : (
                <>
                  delete <span className="text-blue-500">{getItemName ? getItemName() : 'this item'}</span>?
                </>
              )}
            </p>
          </div>

          <div className="flex justify-center gap-3 mt-9">
            <button
              onClick={onCancel}
              className="w-[103px] h-[36px] rounded-md border border-blue-500 text-blue-500 bg-white hover:bg-gray-100"
            >
              No
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`w-[103px] h-[36px] rounded-md ${
                isReactivate ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading
                ? isReactivate
                  ? 'Reactivating...'
                  : 'Deleting...'
                : 'Yes'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeleteConfirmModal;
