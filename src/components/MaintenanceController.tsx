import React, { useState } from 'react';
import { Settings, Power, PowerOff, Clock, AlertTriangle, CheckCircle, Save, RotateCcw, Shield } from 'lucide-react';
import { useMaintenanceStatus } from '../hooks/useMaintenanceStatus';

const MaintenanceController: React.FC = () => {
  const { 
    isMaintenanceMode, 
    isAdminBypass,
    config, 
    setLocalMaintenanceMode, 
    clearLocalMaintenanceMode,
    refreshStatus 
  } = useMaintenanceStatus();

  const [formData, setFormData] = useState({
    message: 'システムメンテナンス中です。ご不便をおかけして申し訳ございません。',
    type: 'scheduled' as 'scheduled' | 'emergency' | 'completed',
    endTime: '',
    progress: 0,
    estimatedDuration: '約30分',
    affectedFeatures: ['日記作成', '検索機能', 'データ同期'],
    contactInfo: 'info@namisapo.com'
  });

  const [newFeature, setNewFeature] = useState('');

  const handleEnableMaintenanceMode = () => {
    if (window.confirm('メンテナンスモードを有効にしますか？\nユーザーはアプリを使用できなくなります。')) {
      const maintenanceConfig = {
        isEnabled: true,
        message: formData.message,
        endTime: formData.endTime || undefined,
        type: formData.type,
        progress: formData.progress,
        estimatedDuration: formData.estimatedDuration,
        affectedFeatures: formData.affectedFeatures,
        contactInfo: formData.contactInfo
      };

      setLocalMaintenanceMode(maintenanceConfig);
      alert('メンテナンスモードが有効になりました。');
    }
  };

  const handleDisableMaintenanceMode = () => {
    if (window.confirm('メンテナンスモードを無効にしますか？\nユーザーは通常通りアプリを使用できるようになります。')) {
      clearLocalMaintenanceMode();
      alert('メンテナンスモードが無効になりました。');
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !formData.affectedFeatures.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        affectedFeatures: [...formData.affectedFeatures, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData({
      ...formData,
      affectedFeatures: formData.affectedFeatures.filter(f => f !== feature)
    });
  };

  const handleUpdateProgress = (progress: number) => {
    if (isMaintenanceMode && config) {
      const updatedConfig = {
        ...config,
        progress: progress
      };
      setLocalMaintenanceMode(updatedConfig);
    }
  };

  const handleCompleteMaintenanceMode = () => {
    if (window.confirm('メンテナンスを完了としてマークしますか？\n完了メッセージが表示され、ユーザーはアプリを再開できます。')) {
      const completedConfig = {
        isEnabled: true,
        message: 'メンテナンスが完了しました。ご利用いただけます。',
        type: 'completed' as const,
        progress: 100,
        estimatedDuration: '',
        affectedFeatures: [],
        contactInfo: formData.contactInfo
      };

      setLocalMaintenanceMode(completedConfig);
      
      // 5秒後に自動的にメンテナンスモードを解除
      setTimeout(() => {
        clearLocalMaintenanceMode();
      }, 5000);
      
      alert('メンテナンス完了状態になりました。5秒後に自動的に解除されます。');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-jp-bold text-gray-900">メンテナンスモード制御</h2>
        </div>

        {/* 現在の状態 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-jp-bold text-gray-900">現在の状態</h3>
            <div className="w-full">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 font-jp-normal">
                    <p className="font-jp-medium mb-2">管理者バイパス機能について</p>
                    <p>メンテナンスモードを有効にしても、カウンセラーアカウントでログインしている場合は引き続きアプリにアクセスできます。</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEnableMaintenanceMode}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-jp-bold transition-colors shadow-md hover:shadow-lg"
              >
                <PowerOff className="w-5 h-5" />
                <span>メンテナンスモード開始</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isMaintenanceMode ? (
              <>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="font-jp-bold text-red-600">メンテナンスモード有効</span>
                </div>
                {config?.type && (
                  <span className={`px-2 py-1 rounded-full text-xs font-jp-medium ${
                    config.type === 'emergency' ? 'bg-red-100 text-red-800' :
                    config.type === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {config.type === 'emergency' ? '緊急' :
                     config.type === 'completed' ? '完了' : '予定'}
                  </span>
                )}
                {isAdminBypass && (
                  <div className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-jp-medium border border-green-200 flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    <span>管理者アクセス中</span>
                  </div>
                )}                
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-jp-bold text-green-600">通常運用中</span>
              </>
            )}
          </div>

          {config && (
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex flex-col">
                <span className="font-jp-medium mb-1">メッセージ:</span>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  {config.message}
                </div>
              </div>
              {config.endTime && (
                <p><span className="font-jp-medium">終了予定:</span> {new Date(config.endTime).toLocaleString('ja-JP')}</p>
              )}
              {config.progress !== undefined && (
                <div className="flex items-center space-x-2">
                  <span className="font-jp-medium">進捗:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${config.progress}%` }}
                    ></div>
                  </div>
                  <span className="font-jp-bold">{config.progress}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 設定フォーム */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-jp-medium text-gray-700 mb-2">
              メンテナンスメッセージ
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-normal resize-none"
              rows={3}
              placeholder="ユーザーに表示するメッセージを入力してください"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-jp-medium text-gray-700 mb-2">
                メンテナンス種別
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-normal"
              >
                <option value="scheduled">予定メンテナンス</option>
                <option value="emergency">緊急メンテナンス</option>
                <option value="completed">メンテナンス完了</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-jp-medium text-gray-700 mb-2">
                終了予定時刻
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-normal"
              />
            </div>

            <div>
              <label className="block text-sm font-jp-medium text-gray-700 mb-2">
                予想所要時間
              </label>
              <input
                type="text"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-normal"
                placeholder="例: 約30分"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-jp-medium text-gray-700 mb-2">
              連絡先情報
            </label>
            <input
              type="text"
              value={formData.contactInfo}
              onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-normal"
              placeholder="緊急時の連絡先"
            />
          </div>

          {/* 影響を受ける機能 */}
          <div>
            <label className="block text-sm font-jp-medium text-gray-700 mb-2">
              影響を受ける機能
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-jp-normal text-sm"
                  placeholder="機能名を入力"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                />
                <button
                  onClick={handleAddFeature}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-jp-medium text-sm transition-colors"
                >
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.affectedFeatures.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-jp-normal"
                  >
                    <span>{feature}</span>
                    <button
                      onClick={() => handleRemoveFeature(feature)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 進捗制御（メンテナンス中のみ） */}
          {isMaintenanceMode && config?.type !== 'completed' && (
            <div>
              <label className="block text-sm font-jp-medium text-gray-700 mb-2">
                進捗状況: {formData.progress}%
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => {
                    const progress = parseInt(e.target.value);
                    setFormData({...formData, progress});
                    handleUpdateProgress(progress);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
          {!isMaintenanceMode ? (
            <div className="w-full">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 font-jp-normal">
                    <p className="font-jp-medium mb-2">管理者バイパス機能について</p>
                    <p>メンテナンスモードを有効にしても、カウンセラーアカウントでログインしている場合は引き続きアプリにアクセスできます。</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEnableMaintenanceMode}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-jp-bold transition-colors shadow-md hover:shadow-lg"
              >
                <PowerOff className="w-5 h-5" />
                <span>メンテナンスモード開始</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {config?.type !== 'completed' && (
                <button
                  onClick={handleCompleteMaintenanceMode}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-jp-bold transition-colors shadow-md hover:shadow-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>メンテナンス完了</span>
                </button>
              )}
              
              <button
                onClick={handleDisableMaintenanceMode}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-jp-medium transition-colors shadow-md hover:shadow-lg"
              >
                <Power className="w-5 h-5" />
                <span>メンテナンスモード終了</span>
              </button>
            </div>
          )}
        </div>

        {/* 注意事項 */}
        <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200 relative">
          {isMaintenanceMode && isAdminBypass && (
            <div className="absolute -top-3 right-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-jp-medium border border-green-200 shadow-sm">
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>管理者バイパス有効中</span>
              </div>
            </div>
          )}
          
          {isMaintenanceMode && isAdminBypass && (
            <div className="absolute -top-3 right-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-jp-medium border border-green-200 shadow-sm">
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>管理者バイパス有効中</span>
              </div>
            </div>
          )}
          
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 font-jp-normal space-y-1">
              <p className="font-jp-medium">重要な注意事項:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>メンテナンスモード中、一般ユーザーはアプリを使用できなくなります</li>
                <li><span className="font-jp-bold">カウンセラーアカウントでログイン中の管理者は引き続きアクセス可能です</span></li>
                <li>ユーザーのローカルデータは保護され、失われることはありません</li>
                <li>緊急メンテナンスは事前通知なしで実行されます</li>
                <li>メンテナンス完了後は自動的に通常運用に戻ります</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* 管理者バイパス説明 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-8 h-8 text-green-600" />
          <h2 className="text-xl font-jp-bold text-gray-900">管理者バイパス機能</h2>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="font-jp-bold text-gray-900 mb-4">メンテナンスモード中の管理者アクセス</h3>
          
          <div className="space-y-4">
            <p className="text-gray-700 font-jp-normal">
              メンテナンスモードが有効な場合でも、カウンセラーアカウントでログインしている管理者は引き続きアプリにアクセスできます。
              これにより、メンテナンス中でもシステムの管理や設定変更が可能です。
            </p>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-jp-semibold text-gray-900 mb-2">管理者バイパスの条件</h4>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-gray-700">
                <li>カウンセラーアカウントでログインしていること</li>
                <li>ローカルストレージに <code className="bg-gray-100 px-1 py-0.5 rounded">current_counselor</code> が設定されていること</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-jp-semibold text-gray-900 mb-2">バイパス中の表示</h4>
              <p className="text-sm text-gray-700 mb-2">
                管理者バイパスが有効な場合、以下の表示でメンテナンスモード中であることを確認できます：
              </p>
              <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-2 rounded-lg border border-red-200 inline-flex">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-jp-medium">メンテナンスモード中（管理者アクセス）</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceController;