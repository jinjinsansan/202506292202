import React, { useState } from 'react';
import { Trash2, RefreshCw, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { cleanupTestData } from '../lib/cleanupTestData';

const DataCleanup: React.FC = () => {
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState<{
    localRemoved: number;
    supabaseRemoved: number;
    success: boolean;
  } | null>(null);

  const handleCleanupTestData = async () => {
    if (!window.confirm('Boltが作成したテストデータを削除します。この操作は元に戻せません。続行しますか？')) {
      return;
    }
    
    setCleaning(true);
    try {
      const cleanupResult = await cleanupTestData();
      setResult(cleanupResult);
      
      if (cleanupResult.success) {
        alert(`テストデータの削除が完了しました。\n\nローカルから${cleanupResult.localRemoved}件のテストデータを削除しました。\nSupabaseから${cleanupResult.supabaseRemoved}件のテストデータを削除しました。`);
      } else {
        alert('テストデータの削除中にエラーが発生しました。');
      }
    } catch (error) {
      console.error('テストデータ削除エラー:', error);
      alert('テストデータの削除中にエラーが発生しました。');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Trash2 className="w-8 h-8 text-red-600" />
        <h2 className="text-xl font-jp-bold text-gray-900">テストデータの削除</h2>
      </div>

      <div className="bg-red-50 rounded-lg p-6 border border-red-200 mb-6">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-jp-bold text-red-900 mb-3">重要な注意事項</h3>
            <p className="text-red-800 font-jp-normal mb-4">
              この機能は、Boltが作成したテストデータを削除します。実際のユーザーが入力したデータは保持されます。
            </p>
            <ul className="list-disc list-inside space-y-1 text-red-800 font-jp-normal">
              <li>削除されるのはテストデータのみです</li>
              <li>実際のユーザーデータは保持されます</li>
              <li>この操作は元に戻せません</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={handleCleanupTestData}
        disabled={cleaning}
        className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-jp-medium transition-colors w-full"
      >
        {cleaning ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <Trash2 className="w-5 h-5" />
        )}
        <span>テストデータを削除</span>
      </button>

      {result && (
        <div className={`mt-6 rounded-lg p-4 border ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-jp-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? 'テストデータの削除が完了しました' : 'テストデータの削除中にエラーが発生しました'}
            </span>
          </div>
          {result.success && (
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-green-700">
                ローカルから<span className="font-jp-bold">{result.localRemoved}件</span>のテストデータを削除しました
              </p>
              <p className="text-green-700">
                Supabaseから<span className="font-jp-bold">{result.supabaseRemoved}件</span>のテストデータを削除しました
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataCleanup;