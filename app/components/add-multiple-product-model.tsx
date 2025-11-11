'use client';

import React, { useState } from 'react';

import { Modal, Upload, Button, notification } from 'antd';
import { InboxOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;
interface AddMultipleProductsModalProps {
  open: boolean;
  onCancel: () => void;
}
const AddMultipleProductsModal: React.FC<AddMultipleProductsModalProps> = ({ open, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const handleBeforeUpload = (file: RcFile) => {
    const uploadFile: UploadFile = {
      uid: String(Date.now()),
      name: file.name,
      status: 'done',
      originFileObj: file, //originFileObj exists
    };
    setFileList([uploadFile]);
    return false; // prevent auto-upload
  };
  const handleRemove = () => {
    setFileList([]);
  };
  const handleUpload = async () => {
    if (fileList.length === 0 || !fileList[0].originFileObj) return;
    setLoading(true);
    const file = fileList[0].originFileObj as File;
    const { valid, missing } = await validateCSV(file);
    if (!valid) {
      api.error({
        message: 'Invalid CSV',
        description: `Missing required columns: ${missing?.join(', ')}`,
      });
      setLoading(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj as File);
      const res = await fetch('/api/product/upload-products', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        api.success({
          message: 'Upload Successful',
          description: data.message || 'File Uploaded Successfully!',
        });
        setFileList([]);
        onCancel();
      } else {
        api.error({
          message: 'Upload Failed',
          description: data.error || 'Something went wrong while uploading.',
        });
      }
    } catch (error) {
      api.error({
        message: 'Upload Error',
        description: 'Network or server issue occurred.',
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadSample = () => {
    const sampleCSV = `title,colour,colourcode,size,stock,price,img
    T-Shirt,Red,RED001,M,50,19.99,https://example.com/tshirt.jpg
    Jeans,Blue,BLU002,L,30,39.99,https://example.com/jeans.jpg
    Shoes,Black,BLK003,42,20,59.99,https://example.com/shoes.jpg`;
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    api.success({
      message: 'Download Started',
      description: 'Sample product CSV file has been downloaded to your system.',
    });
  };
  const requiredColumns = [
    'title',
    'colour',
    'colourcode',
    'size',
    'stock',
    'price',
    'img',
  ];
  const validateCSV = async (file: File) => {
    return new Promise<{ valid: boolean; missing?: string[] }>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split(/\r\n|\n/);
        const headers = lines[0].split(',').map((h) => h.trim());

        const missingColumns = requiredColumns.filter(
          (col) => !headers.includes(col)
        );

        if (missingColumns.length > 0) {
          resolve({ valid: false, missing: missingColumns });
        } else {
          resolve({ valid: true });
        }
      };
      reader.readAsText(file);
    });
  };
  return (
    <>
      {contextHolder}
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
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ Prevent Dragger click
                    handleDownloadSample(); // ✅ Download CSV
                  }}
                  className='text-blue-500 text-sm mb-2 underline'
                >
                  Download Sample File
                </button>
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
              disabled={fileList.length === 0 || loading}
              loading={loading}
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
export default AddMultipleProductsModal;
