'use client';

import React from 'react';

import { Modal } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

interface DeleteConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({open,onCancel,onConfirm,}) => {
  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      onCancel={onCancel}
      centered
      width={471}
      style={{ height: 314 }}
      className="!p-0"
    >
      <div className='flex flex-col items-center text-center'>
        <div
          className=' opacity-100 flex flex-col items-center justify-center'
          style={{ width: '212px', height: '137px' }}
        >
         <h1 className='font-inter mt-3 font-medium text-[24px] leading-[28.8px] !text-[#007BFF]'>
            Remove Product
         </h1>
          <WarningOutlined className='mt-3' style={{ fontSize: '63px', color: '#FFC107' }} />
        </div>
        <div className='mt-4 '>
          <p className='font-inter font-bold text-base '>
            Are you sure you want to
            <br />
           Delete the Item!
          </p>
        </div>
        <div className='flex justify-center gap-3 mt-9'>
          <button
            onClick={onCancel}
            className='w-[103px] h-[36px] rounded-md border border-blue-500 text-blue-500 bg-white hover:bg-gray-100'
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className='w-[103px] h-[36px] rounded-md bg-blue-500 text-white hover:bg-blue-600'
          >
            Yes
          </button>
        </div>
      </div>
    </Modal>
  );
};
export default DeleteConfirmModal;