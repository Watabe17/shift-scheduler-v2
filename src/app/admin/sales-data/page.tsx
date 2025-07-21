"use client";

import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SalesDataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast.error('CSVファイルを選択してください。');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/sales-data/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'アップロードに失敗しました。');
      }

      toast.success(`アップロード成功: ${result.count}件の売上データを登録しました。`);
      setFile(null); 
      // Reset file input
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
      if(fileInput) fileInput.value = '';

    } catch (error: any) {
      toast.error(`エラー: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <ToastContainer position="top-right" autoClose={5000} />
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">売上データインポート</h1>

      <div className="max-w-xl bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4">CSVアップロード</h2>
        <p className="text-sm text-gray-600 mb-4">
          売上データをCSVファイルでアップロードしてください。<br />
          CSVのフォーマットは以下の通りです:
        </p>
        <code className="text-xs bg-gray-100 p-2 rounded-md block mb-4">
          date,timeSlot,amount<br/>
          2023-10-28,12:00-13:00,50000<br/>
          2023-10-28,13:00-14:00,62000
        </code>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-2">
              CSVファイル
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button
            type="submit"
            disabled={isUploading || !file}
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? 'アップロード中...' : 'アップロード'}
          </button>
        </form>
      </div>
    </div>
  );
} 