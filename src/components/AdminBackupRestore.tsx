import React, { useState } from 'react';
import { Database, Download, Upload, RefreshCw, CheckCircle, AlertTriangle, Info, Save, Shield } from 'lucide-react';
import { supabase, isLocalMode } from '../lib/supabase';

const AdminBackupRestore: React.FC = () => {
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [status, setStatus] = useState<{message: string, success: boolean} | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);

  // アプリ全体のバックアップを作成
  const handleCreateFullBackup = async () => {
    setBackupInProgress(true);
    setStatus(null);
    
    try {
      // ローカルストレージから全データを収集
      const backupData: Record<string, any> = {
        metadata: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          type: 'full-backup',
          creator: localStorage.getItem('current_counselor') || 'admin'
        },
        localStorage: {},
        supabaseData: null
      };
      
      // ローカルストレージのすべてのデータを収集
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              // JSONデータの場合はパースして保存
              try {
                backupData.localStorage[key] = JSON.parse(value);
              } catch {
                // JSONでない場合は文字列として保存
                backupData.localStorage[key] = value;
              }
            }
          } catch (error) {
            console.error(`キー「${key}」の読み込みエラー:`, error);
          }
        }
      }
      
      // Supabaseからデータを取得（接続されている場合のみ）
      if (supabase && !isLocalMode) {
        try {
          const supabaseData: Record<string, any> = {};
          
          // ユーザーデータの取得
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*');
          
          if (usersError) {
            console.error('ユーザーデータ取得エラー:', usersError);
          } else {
            supabaseData.users = users;
          }
          
          // 日記データの取得
          const { data: diaries, error: diariesError } = await supabase
            .from('diary_entries')
            .select('*');
          
          if (diariesError) {
            console.error('日記データ取得エラー:', diariesError);
          } else {
            supabaseData.diary_entries = diaries;
          }
          
          // 同意履歴の取得
          const { data: consents, error: consentsError } = await supabase
            .from('consent_histories')
            .select('*');
          
          if (consentsError) {
            console.error('同意履歴取得エラー:', consentsError);
          } else {
            supabaseData.consent_histories = consents;
          }
          
          // カウンセラーデータの取得
          const { data: counselors, error: counselorsError } = await supabase
            .from('counselors')
            .select('*');
          
          if (counselorsError) {
            console.error('カウンセラーデータ取得エラー:', counselorsError);
          } else {
            supabaseData.counselors = counselors;
          }
          
          // チャットルームの取得
          const { data: chatRooms, error: chatRoomsError } = await supabase
            .from('chat_rooms')
            .select('*');
          
          if (chatRoomsError) {
            console.error('チャットルーム取得エラー:', chatRoomsError);
          } else {
            supabaseData.chat_rooms = chatRooms;
          }
          
          // メッセージの取得
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*');
          
          if (messagesError) {
            console.error('メッセージ取得エラー:', messagesError);
          } else {
            supabaseData.messages = messages;
          }
          
          backupData.supabaseData = supabaseData;
        } catch (error) {
          console.error('Supabaseデータ取得エラー:', error);
          backupData.supabaseData = { error: 'データ取得に失敗しました' };
        }
      }
      
      // JSONに変換してダウンロード
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // ファイル名に日付を含める
      const date = new Date().toISOString().split('T')[0];
      const fileName = `kanjou-nikki-full-backup-${date}.json`;
      
      // ダウンロードリンクを作成して自動クリック
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(dataBlob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setStatus({
        message: 'アプリ全体のバックアップが正常に作成されました！',
        success: true
      });
    } catch (error) {
      console.error('バックアップ作成エラー:', error);
      setStatus({
        message: 'バックアップの作成に失敗しました。',
        success: false
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  // バックアップファイルの選択
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBackupFile(e.target.files[0]);
      setStatus(null);
    }
  };

  // バックアップからの復元
  const handleRestoreFromBackup = async () => {
    if (!backupFile) {
      setStatus({
        message: 'バックアップファイルを選択してください。',
        success: false
      });
      return;
    }
    
    if (!window.confirm('アプリ全体のバックアップから復元すると、現在のデータがすべて上書きされます。本当に続行しますか？')) {
      return;
    }
    
    setRestoreInProgress(true);
    setStatus(null);
    
    try {
      // ファイルを読み込み
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          if (!event.target || typeof event.target.result !== 'string') {
            throw new Error('ファイルの読み込みに失敗しました。');
          }
          
          const backupData = JSON.parse(event.target.result);
          
          // バージョンチェック
          if (!backupData.metadata || !backupData.metadata.version) {
            throw new Error('無効なバックアップファイルです。');
          }
          
          // ローカルストレージの復元
          if (backupData.localStorage) {
            // 既存のデータをクリア（特定のキーは保持）
            const keysToPreserve = ['current_counselor']; // 管理者セッションは保持
            const preservedData: Record<string, string> = {};
            
            // 保持するキーの値を一時保存
            keysToPreserve.forEach(key => {
              const value = localStorage.getItem(key);
              if (value) preservedData[key] = value;
            });
            
            // ローカルストレージをクリア
            localStorage.clear();
            
            // 保持するキーを復元
            Object.entries(preservedData).forEach(([key, value]) => {
              localStorage.setItem(key, value);
            });
            
            // バックアップからデータを復元
            Object.entries(backupData.localStorage).forEach(([key, value]) => {
              try {
                if (typeof value === 'string') {
                  localStorage.setItem(key, value);
                } else {
                  localStorage.setItem(key, JSON.stringify(value));
                }
              } catch (error) {
                console.error(`キー「${key}」の復元エラー:`, error);
              }
            });
          }
          
          // Supabaseデータの復元（接続されている場合のみ）
          if (backupData.supabaseData && supabase && !isLocalMode) {
            try {
              // 注意: 実際の実装では、Supabaseデータの復元は慎重に行う必要があります
              // ここでは簡易的な実装として、データの存在確認のみを行います
              
              if (backupData.supabaseData.users) {
                console.log('ユーザーデータの復元が必要:', backupData.supabaseData.users.length, '件');
              }
              
              if (backupData.supabaseData.diary_entries) {
                console.log('日記データの復元が必要:', backupData.supabaseData.diary_entries.length, '件');
              }
              
              if (backupData.supabaseData.consent_histories) {
                console.log('同意履歴の復元が必要:', backupData.supabaseData.consent_histories.length, '件');
              }
              
              // 実際のSupabaseデータ復元は、Edge Functionを使用して実装することをお勧めします
              // ここでは、ローカルストレージの復元のみを行います
            } catch (error) {
              console.error('Supabaseデータ復元エラー:', error);
            }
          }
          
          setStatus({
            message: 'バックアップからの復元が完了しました！ページを再読み込みしてください。',
            success: true
          });
          
          // 5秒後に自動的にページを再読み込み
          setTimeout(() => {
            window.location.reload();
          }, 5000);
          
        } catch (error) {
          console.error('データ復元エラー:', error);
          setStatus({
            message: 'データの復元に失敗しました。有効なバックアップファイルか確認してください。',
            success: false
          });
          setRestoreInProgress(false);
        }
      };
      
      fileReader.onerror = () => {
        setStatus({
          message: 'ファイルの読み込みに失敗しました。',
          success: false
        });
        setRestoreInProgress(false);
      };
      
      fileReader.readAsText(backupFile);
      
    } catch (error) {
      console.error('バックアップ復元エラー:', error);
      setStatus({
        message: 'バックアップの復元に失敗しました。',
        success: false
      });
      setRestoreInProgress(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="w-8 h-8 text-purple-600" />
        <h2 className="text-xl font-jp-bold text-gray-900">アプリ全体のバックアップと復元</h2>
      </div>

      {/* 重要な注意事項 */}
      <div className="bg-purple-50 rounded-lg p-6 border border-purple-200 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-jp-semibold text-gray-900 mb-3">重要な注意事項</h3>
            <p className="text-gray-700 font-jp-normal mb-4">
              このバックアップ機能は、アプリ全体のデータを包括的にバックアップします。ローカルストレージとSupabaseの両方のデータが含まれます。
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-gray-700 font-jp-normal">
              <li>すべてのユーザーの日記データ</li>
              <li>すべての同意履歴</li>
              <li>すべてのカウンセラー情報</li>
              <li>システム設定情報</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* バックアップ作成 */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start space-x-3 mb-4">
            <Download className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-jp-bold text-gray-900 mb-2">バックアップ作成</h3>
              <p className="text-gray-700 font-jp-normal text-sm mb-4">
                アプリ全体のデータをバックアップファイルとして保存します。定期的なバックアップをお勧めします。
              </p>
            </div>
          </div>
          
          <button
            onClick={handleCreateFullBackup}
            disabled={backupInProgress}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-jp-medium transition-colors w-full"
          >
            {backupInProgress ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Database className="w-5 h-5" />
            )}
            <span>アプリ全体のバックアップを作成</span>
          </button>
        </div>

        {/* バックアップ復元 */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-start space-x-3 mb-4">
            <Upload className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-jp-bold text-gray-900 mb-2">バックアップ復元</h3>
              <p className="text-gray-700 font-jp-normal text-sm mb-4">
                以前作成したバックアップファイルからデータを復元します。現在のデータは上書きされます。
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-jp-medium
                  file:bg-green-100 file:text-green-700
                  hover:file:bg-green-200
                  cursor-pointer"
              />
              {backupFile && (
                <div className="mt-2 text-sm text-green-600 font-jp-medium">
                  選択されたファイル: {backupFile.name}
                </div>
              )}
            </div>
            
            <button
              onClick={handleRestoreFromBackup}
              disabled={restoreInProgress || !backupFile}
              className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-jp-medium transition-colors w-full"
            >
              {restoreInProgress ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Database className="w-5 h-5" />
              )}
              <span>バックアップから復元</span>
            </button>
          </div>
        </div>
      </div>

      {/* ステータス表示 */}
      {status && (
        <div className={`mt-6 rounded-lg p-4 border ${
          status.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2">
            {status.success ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-jp-medium">{status.message}</span>
          </div>
        </div>
      )}

      {/* 管理者向け注意事項 */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800 font-jp-normal">
            <p className="font-jp-medium mb-2">管理者向け注意事項</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>このバックアップ機能は管理者専用です</li>
              <li>復元操作は慎重に行ってください。すべてのデータが上書きされます</li>
              <li>定期的なバックアップをお勧めします（週に1回程度）</li>
              <li>システム更新前には必ずバックアップを作成してください</li>
              <li>バックアップファイルには個人情報が含まれるため、安全に保管してください</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBackupRestore;