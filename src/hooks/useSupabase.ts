import { useState, useEffect, useCallback } from 'react';
import { supabase, userService } from '../lib/supabase';
import { getCurrentUser } from '../lib/deviceAuth';

interface SupabaseState {
  isConnected: boolean;
  error: string | null;
  currentUser: any | null;
  retryConnection: () => void;
  initializeUser: () => Promise<void>;
}

export const useSupabase = (): SupabaseState => {
  const [isConnected, setIsConnected] = useState<boolean>(!!supabase);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  
  // Supabase接続の確認
  const checkConnection = useCallback(async () => {
    if (!supabase) {
      console.log('useSupabase: Supabase接続なし');
      setIsConnected(false);
      setError(isLocalMode ? 'ローカルモードで動作中: Supabase接続なし' : 'Supabase接続が設定されていません');
      return;
    }
    
    try {
      // 簡単な接続テスト
      const { error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        console.error('useSupabase: Supabase接続エラー:', error);
        setIsConnected(false);
        setError(`Supabase接続エラー: ${error.message}`);
      } else {
        console.log('useSupabase: Supabase接続成功');
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      console.error('useSupabase: Supabase接続確認エラー:', err);
      setIsConnected(false);
      setError('Supabase接続に失敗しました');
    }
  }, []);
  
  // ユーザー情報の初期化
  const initializeUser = useCallback(async () => {
    if (!supabase) {
      console.log('useSupabase: Supabase接続なし: ユーザー初期化をスキップ');
      return;
    }
    
    if (isLocalMode) {
      console.log('useSupabase: ローカルモードで動作中: ユーザー初期化をスキップ');
      return;
    }
    
    try {
      // 現在のユーザーを取得
      const user = getCurrentUser();
      if (!user || !user.lineUsername) {
        console.log('useSupabase: ユーザーがログインしていないか、ユーザー名が取得できません');
        return;
      }
      
      // Supabaseでユーザーを作成または取得
      const supabaseUser = await userService.createOrGetUser(user.lineUsername);
      if (supabaseUser) {
        console.log('useSupabase: ユーザー初期化成功:', supabaseUser);
        setCurrentUser(supabaseUser);
        console.log('useSupabase: ユーザー初期化完了:', supabaseUser.line_username);
      } else {
        console.log('useSupabase: ユーザー初期化失敗: supabaseUserがnull');
      }
    } catch (error) {
      console.error('useSupabase: ユーザー初期化エラー:', error);
      setError('ユーザー初期化に失敗しました');
    }
  }, []);
  
  // 初期化
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);
  
  // 接続の再試行
  const retryConnection = useCallback(() => {
    checkConnection();
  }, [checkConnection]);
  
  return {
    isConnected,
    error,
    currentUser,
    retryConnection,
    initializeUser
  };
};