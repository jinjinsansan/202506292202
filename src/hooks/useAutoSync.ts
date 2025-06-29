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
    if (isLocalMode) {
      console.log('useAutoSync: ローカルモードで動作中: 自動同期は無効です');
      return;
    }
    
    // 30秒ごとに自動同期を実行
    const interval = setInterval(() => {
      if (!isSyncing) {
        console.log('useAutoSync: 自動同期を実行します...');
        syncData();
      }
    }, 30 * 1000); // 30秒 = 30,000ミリ秒（より頻繁に同期）
    
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
      
      // ユーザー名を取得（getCurrentUserから取得できない場合はローカルストレージから直接取得）
      const lineUsername = user?.lineUsername || localStorage.getItem('line-username');
      
      if (!lineUsername) {
        console.log('useAutoSync: ユーザー名が取得できません');
        if (isLocalMode) {
          console.log('useAutoSync: ローカルモードのため、ローカルユーザーIDを使用');
          userId = 'local-user-id';
        } else {
          return false;
        }
      } else {
        // ユーザーIDを取得
        userId = currentUser?.id || 'local-user-id';
        console.log('useAutoSync: 現在のユーザーID:', userId, 'ユーザー名:', lineUsername);
        
        // ユーザーIDがない場合は初期化
        if (!userId || userId === 'local-user-id') {
          if (isLocalMode) {
            userId = 'local-user-id';
          } else {
            console.log('useAutoSync: ユーザーを作成または取得します:', lineUsername);
            const supabaseUser = await userService.createOrGetUser(lineUsername);
            if (!supabaseUser || !supabaseUser.id) {
              console.error('useAutoSync: ユーザーの作成に失敗しました');
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
        console.log('useAutoSync: 同期するデータがありません: 同期をスキップします');
        setLastSyncTime(new Date().toISOString());
        localStorage.setItem('last_sync_time', new Date().toISOString());
        return true;
      }
      
      let entries = JSON.parse(savedEntries);
      
      // 日記データを整形（ローカルストレージのデータ形式をSupabase形式に変換）
      entries = entries.map((entry: any) => {
        // 必要なフィールドを確保
        // console.log('useAutoSync: エントリー変換前:', entry);
        
        // 自己肯定感スコアと無価値感スコアの処理
        let selfEsteemScore = entry.self_esteem_score;
        let worthlessnessScore = entry.worthlessness_score;
        
        // フィールド名の違いに対応
        if (selfEsteemScore === undefined && entry.selfEsteemScore !== undefined) {
          selfEsteemScore = entry.selfEsteemScore;
        }
        
        if (worthlessnessScore === undefined && entry.worthlessnessScore !== undefined) {
          worthlessnessScore = entry.worthlessnessScore;
        }
        
        // デフォルト値の設定
        if (selfEsteemScore === undefined || selfEsteemScore === null) {
          selfEsteemScore = 50;
        }
        
        if (worthlessnessScore === undefined || worthlessnessScore === null) {
          worthlessnessScore = 50;
        }
        
        return {
          id: entry.id,
          date: entry.date,
          emotion: entry.emotion,
          event: entry.event,
          realization: entry.realization,
          self_esteem_score: Number(selfEsteemScore),
          worthlessness_score: Number(worthlessnessScore),
          // 互換性のために両方のフィールド名で保存
          selfEsteemScore: Number(selfEsteemScore),
          worthlessnessScore: Number(worthlessnessScore),
          created_at: entry.created_at || new Date().toISOString(),
          counselor_memo: entry.counselor_memo || null,
          is_visible_to_user: entry.is_visible_to_user || false,
          counselor_name: entry.counselor_name || null,
          assigned_counselor: entry.assigned_counselor || null,
          urgency_level: entry.urgency_level || null
        };
      });
      
      // 日記データを同期
      console.log('useAutoSync: 同期を開始します:', entries.length, '件のデータ');
      // console.log('useAutoSync: 同期データサンプル:', entries.slice(0, 1));
      const { success, error } = await diaryService.syncDiaries(userId, entries);
      console.log('useAutoSync: 同期結果:', success ? '成功' : '失敗', error ? `エラー: ${error}` : '');
      
      if (!success) {
        throw new Error(error || '日記の同期に失敗しました');
      }
      
      // 同期時間を更新
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_sync_time', now);
      
      console.log('useAutoSync: データ同期完了:', entries.length, '件のデータを同期しました');
      return true;
    } catch (error) {
      console.error('useAutoSync: データ同期エラー:', error);
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
      console.log('useAutoSync: 手動同期リクエストを受信しました', '同期中:', isSyncing, 'ローカルモード:', isLocalMode);
      if (!isSyncing && !isLocalMode) {
        triggerManualSync().then(success => {
          console.log('useAutoSync: 手動同期結果:', success ? '成功' : '失敗');
        }).catch(error => {
          console.error('useAutoSync: 手動同期エラー:', error);
        });
      }
    };
    
    window.addEventListener('manual-sync-request', handleManualSyncRequest);
    
    // 初回マウント時に手動同期を実行
    if (!isLocalMode && !isSyncing) {
      console.log('useAutoSync: 初期同期を実行します...');
      setTimeout(async () => {
        console.log('useAutoSync: 初期同期を開始します');
        try {
          const success = await triggerManualSync();
          console.log('useAutoSync: 初期同期結果:', success ? '成功' : '失敗');
        } catch (error) {
          console.error('useAutoSync: 初期同期エラー:', error);
        }
      }, 3000);
    }
    
    // 30秒後に再度同期を試行（初期同期の補完として）
    if (!isLocalMode) {
      setTimeout(async () => {
        console.log('useAutoSync: 補完同期を開始します');
        triggerManualSync().catch(error => {
          console.error('useAutoSync: 補完同期エラー:', error);
        });
      }, 30000);
    }
    
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