import { useState, useEffect, useCallback } from 'react';
import { supabase, userService, diaryService, isLocalMode } from '../lib/supabase';
import { getCurrentUser } from '../lib/deviceAuth';

// 自動同期の状態を管理するインターフェース

interface AutoSyncState {
  isAutoSyncEnabled: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;
  currentUser: any | null;
  triggerManualSync: () => Promise<boolean>;
}

export const useAutoSync = (): AutoSyncState => {
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('last_sync_time'));
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  
  // 自動同期設定の読み込み
  useEffect(() => {
    const autoSyncSetting = localStorage.getItem('auto_sync_enabled');
    setIsAutoSyncEnabled(autoSyncSetting !== 'false'); // デフォルトはtrue
    
    // 最後の同期時間を読み込み
    const savedLastSyncTime = localStorage.getItem('last_sync_time');
    if (savedLastSyncTime) {
      setLastSyncTime(savedLastSyncTime);
    }
  }, []);
  
  // ユーザー情報の初期化
  useEffect(() => {
    initializeUser();
  }, []);
  
  // 自動同期の設定
  useEffect(() => {
    if (!isAutoSyncEnabled || !supabase) return;
    if (isLocalMode) return; // ローカルモードの場合は自動同期を行わない
    
    // 5分ごとに自動同期を実行
    const interval = setInterval(() => {
      if (!isSyncing) {
        syncData();
      }
    }, 5 * 60 * 1000); // 5分 = 300,000ミリ秒
    
    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, isSyncing]);
  
  // ユーザー情報の初期化
  const initializeUser = useCallback(async () => {
    if (!supabase) {
      console.log('Supabase接続なし: ローカルユーザー情報を使用');
      const user = getCurrentUser();
      if (user) {
        setCurrentUser({ id: 'local-user-id', line_username: user.lineUsername });
      }
      return;
    }
    
    if (isLocalMode) {
      console.log('ローカルモードで動作中: ローカルユーザー情報を使用');
      const user = getCurrentUser();
      if (user) {
        setCurrentUser({ id: 'local-user-id', line_username: user.lineUsername });
      }
      return;
    }
    
    try {
      // 現在のユーザーを取得
      const user = getCurrentUser();
      if (!user) {
        console.log('ユーザーがログインしていません: ユーザー初期化をスキップ');
        return;
      }
      
      // Supabaseでユーザーを作成または取得
      const supabaseUser = await userService.createOrGetUser(user.lineUsername);
      if (supabaseUser) {
        setCurrentUser(supabaseUser);
        console.log('ユーザー初期化完了:', supabaseUser.line_username);
      }
    } catch (error) {
      console.error('ユーザー初期化エラー:', error);
      setError('ユーザー初期化に失敗しました');
    }
  }, []);
  
  // データ同期処理
  const syncData = useCallback(async (): Promise<boolean> => {
    if (!supabase) {
      console.log('Supabase接続なし: データ同期をスキップします');
      return false;
    }
    
    if (isLocalMode) {
      console.log('ローカルモードで動作中: データ同期をスキップします');
      return false;
    }
    
    if (isSyncing) {
      console.log('既に同期中です');
      return false;
    }
    
    setIsSyncing(true);
    setError(null);
    
    try {
      // 現在のユーザーを取得
      let userId: string;
      const user = getCurrentUser();
      if (!user || !user.lineUsername) {
        console.log('ユーザーがログインしていないか、ユーザー名が取得できません');
        if (isLocalMode) {
          console.log('ローカルモードのため、ローカルユーザーIDを使用');
          userId = 'local-user-id';
        } else {
          return false;
        }
      } else {
        // ユーザーIDを取得
        userId = currentUser?.id || 'local-user-id';
        console.log('現在のユーザーID:', userId);
        
        // ユーザーIDがない場合は初期化
        if (!userId || userId === 'local-user-id') {
          if (isLocalMode) {
            userId = 'local-user-id';
          } else {
            const supabaseUser = await userService.createOrGetUser(user.lineUsername);
            if (!supabaseUser || !supabaseUser.id) {
              console.error('ユーザーの作成に失敗しました');
              return false;
            }
            
            userId = supabaseUser.id;
            setCurrentUser(supabaseUser);
          }
        }
      }
      
      // ローカルストレージから日記データを取得
      const savedEntries = localStorage.getItem('journalEntries');
      if (!savedEntries) {
        console.log('同期するデータがありません: 同期をスキップします');
        setLastSyncTime(new Date().toISOString());
        localStorage.setItem('last_sync_time', new Date().toISOString());
        return true;
      }
      
      let entries = JSON.parse(savedEntries);
      
      // 日記データを整形（ローカルストレージのデータ形式をSupabase形式に変換）
      entries = entries.map((entry: any) => {
        // 必要なフィールドを確保
        return {
          id: entry.id,
          date: entry.date,
          emotion: entry.emotion,
          event: entry.event,
          realization: entry.realization,
          self_esteem_score: entry.selfEsteemScore || 50,
          worthlessness_score: entry.worthlessnessScore || 50,
          created_at: entry.created_at || new Date().toISOString(),
          counselor_memo: entry.counselor_memo || null,
          is_visible_to_user: entry.is_visible_to_user || false,
          counselor_name: entry.counselor_name || null,
          assigned_counselor: entry.assigned_counselor || null,
          urgency_level: entry.urgency_level || null
        };
      });
      
      // 日記データを同期
      console.log('同期を開始します:', entries.length, '件のデータ');
      const { success, error } = await diaryService.syncDiaries(userId, entries);
      
      if (!success) {
        throw new Error(error || '日記の同期に失敗しました');
      }
      
      // 同期時間を更新
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_sync_time', now);

      console.log('データ同期完了:', entries.length, '件のデータを同期しました');
      return true;
    } catch (error) {
      console.error('データ同期エラー:', error);
      setError(error instanceof Error ? error.message : '不明なエラー');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, currentUser]);
  
  // 手動同期のトリガー
  const triggerManualSync = useCallback(async (): Promise<boolean> => {
    return await syncData();
  }, [syncData]);
  
  // 手動同期イベントのリスナー
  useEffect(() => {
    const handleManualSyncRequest = () => {
      console.log('手動同期リクエストを受信しました');
      if (!isSyncing && !isLocalMode) {
        triggerManualSync().then(success => {
          console.log('手動同期結果:', success ? '成功' : '失敗');
        }).catch(error => {
          console.error('手動同期エラー:', error);
        });
      }
    };
    
    window.addEventListener('manual-sync-request', handleManualSyncRequest);
    
    return () => {
      window.removeEventListener('manual-sync-request', handleManualSyncRequest);
    };
  }, [triggerManualSync, isSyncing]);
  
  return {
    isAutoSyncEnabled,
    isSyncing,
    lastSyncTime,
    error,
    currentUser,
    triggerManualSync
  };
};