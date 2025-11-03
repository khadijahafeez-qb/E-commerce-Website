'use client';

import React, { useState } from 'react';

import { Modal, Upload, Button } from 'antd';
import { InboxOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';
import type { UploadFile,RcFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;
interface AddMultipleProductsModalProps {
  open: boolean;
  onCancel: () => void;
}

const AddMultipleProductsModal: React.FC<AddMultipleProductsModalProps> = ({ open, onCancel }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
const handleBeforeUpload = (file: RcFile) => {
  const uploadFile: UploadFile = {
    uid: String(Date.now()),
    name: file.name,
    status: 'done',
    originFileObj: file, // 👈 now originFileObj exists
  };
  setFileList([uploadFile]);
  return false; // prevent auto-upload
};

  const handleRemove = () => {
    setFileList([]);
  };
const handleUpload = async () => {
  if (fileList.length === 0 || !fileList[0].originFileObj) return;
  const formData = new FormData();
  formData.append('file', fileList[0].originFileObj as File);
  const res = await fetch('/api/product/upload-products', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  onCancel();
};

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={696}
      className='rounded-lg'
      centered
      title={<span className='text-[20px] font-semibold'>Add Multiple Products</span>}
    >
      <div className='h-[768px] overflow-y-auto border-t mt-2 pt-4'>
          <div className='border border-dashed rounded-lg p-6 bg-[#F9FAFB]'>
           <Dragger
            multiple={false}
            beforeUpload={handleBeforeUpload}
            onRemove={handleRemove}
            fileList={fileList}
            className='!bg-transparent !border-none'>
           <div className='flex flex-col items-center justify-center'>
             <InboxOutlined className='text-blue-500 text-[32px] mb-2' />
             <p className='text-gray-600 mb-1'>Drop your file here to upload</p>
             <a href='#' className='text-blue-500 text-sm mb-2'>Download Sample File</a>
             <Button className='border border-blue-400 text-blue-500 hover:!text-blue-600'>
                Browse
             </Button>
            </div>
          </Dragger>
          </div>
        {fileList.length > 0 && (
          <div className='mt-6'>
            <p className='font-medium mb-2'>Uploaded Files</p>
            <div className='flex justify-between items-center border rounded-md px-3 py-2'>
              <div className='flex items-center gap-2'>
                <FileOutlined className='text-gray-500 text-lg' />
                <span className='text-gray-700'>{fileList[0].name}</span>
              </div>
              <DeleteOutlined
                className='text-red-500 text-lg cursor-pointer'
                onClick={() => setFileList([])}
              />
            </div>
          </div>
        )}
        <div className='mt-6 flex justify-end'>
          <Button
            type='primary'
            className='px-6 h-10 rounded-md'
            onClick={handleUpload}
            disabled={fileList.length === 0}
          >
            Upload File
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default AddMultipleProductsModal;
