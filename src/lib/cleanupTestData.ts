import { supabase } from './supabase';

/**
 * Boltが生成したテストデータを削除する関数
 * 実際のユーザーデータは保持する
 */
export const cleanupTestData = async (): Promise<{
  localRemoved: number;
  supabaseRemoved: number;
  success: boolean;
}> => {
  let localRemoved = 0;
  let supabaseRemoved = 0;
  
  try {
    // ローカルストレージからのテストデータ削除
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      
      // テストデータの特徴を持つエントリーを識別
      // (例: Boltが生成した特定のパターンを持つデータ)
      const realEntries = entries.filter((entry: any) => {
        // テストデータの特徴:
        // 1. 特定の期間内に大量に生成されたデータ
        // 2. 同じようなパターンの内容
        // 3. 実際のユーザーデータとは異なる特徴
        
        // 以下は簡易的な判定ロジック
        const isTestData = 
          (entry.event && entry.event.includes('テスト')) ||
          (entry.event && entry.event.includes('サンプル')) ||
          (entry.event && entry.event.includes('example')) ||
          (entry.event && entry.event.includes('test')) ||
          (entry.realization && entry.realization.includes('テスト')) ||
          (entry.realization && entry.realization.includes('サンプル'));
        
        return !isTestData;
      });
      
      // 削除されたエントリー数を計算
      localRemoved = entries.length - realEntries.length;
      
      // 実際のユーザーデータのみを保存
      localStorage.setItem('journalEntries', JSON.stringify(realEntries));
    }
    
    // Supabaseからのテストデータ削除（接続されている場合のみ）
    if (supabase) {
      try {
        // テストデータの条件に一致するエントリーを削除
        const { data, error } = await supabase
          .from('diary_entries')
          .delete()
          .or('event.ilike.%テスト%,event.ilike.%サンプル%,event.ilike.%example%,event.ilike.%test%,realization.ilike.%テスト%,realization.ilike.%サンプル%')
          .select();
        
        if (error) {
          console.error('Supabaseテストデータ削除エラー:', error);
        } else if (data) {
          supabaseRemoved = data.length;
        }
      } catch (supabaseError) {
        console.error('Supabase接続エラー:', supabaseError);
      }
    }
    
    return {
      localRemoved,
      supabaseRemoved,
      success: true
    };
  } catch (error) {
    console.error('テストデータクリーンアップエラー:', error);
    return {
      localRemoved,
      supabaseRemoved,
      success: false
    };
  }
};