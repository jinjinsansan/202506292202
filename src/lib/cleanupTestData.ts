import { supabase } from './supabase';

/**
 * Boltが作成したテストデータを削除する関数
 * 実際のユーザーデータは保持される
 */
export const cleanupTestData = async (): Promise<{
  localRemoved: number;
  supabaseRemoved: number;
  success: boolean;
}> => {
  try {
    // ローカルストレージからのテストデータ削除
    let localRemoved = 0;
    
    // 日記データの削除
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      const entries = JSON.parse(savedEntries);
      // テストデータの特徴（Boltが生成したデータの特徴）
      const realEntries = entries.filter((entry: any) => {
        // テストデータの特徴（例: 特定のパターンを持つ内容）
        const isBoltGenerated = 
          (entry.event && entry.event.includes('テストデータ')) || 
          (entry.realization && entry.realization.includes('テストデータ')) ||
          (entry.event && entry.event.includes('This is a test entry')) ||
          (entry.event && entry.event.includes('サンプルデータ'));
        
        if (isBoltGenerated) {
          localRemoved++;
          return false;
        }
        return true;
      });
      
      localStorage.setItem('journalEntries', JSON.stringify(realEntries));
    }
    
    // Supabaseからのテストデータ削除
    let supabaseRemoved = 0;
    
    if (supabase) {
      try {
        // テストデータの特徴に基づいて削除
        const { data, error } = await supabase
          .from('diary_entries')
          .delete()
          .or('event.ilike.%テストデータ%,event.ilike.%This is a test entry%,event.ilike.%サンプルデータ%')
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
    console.error('テストデータ削除エラー:', error);
    return {
      localRemoved: 0,
      supabaseRemoved: 0,
      success: false
    };
  }
};