import { createClient } from '@supabase/supabase-js';

// Supabase設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// ローカルモードの設定（デフォルトはfalse）
export const isLocalMode = import.meta.env.VITE_LOCAL_MODE === 'true';

// Supabaseクライアントの作成（ローカルモードの場合はnull）
export const supabase = (!isLocalMode && supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ユーザーサービス
export const userService = {
  // ユーザーの作成または取得
  async createOrGetUser(lineUsername: string) {
    if (!supabase) return null;
    if (isLocalMode) {
      console.log('ローカルモードでユーザー作成: ', lineUsername);
      return { id: 'local-user-id', line_username: lineUsername };
    }
    
    try {
      // 既存ユーザーの検索
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('line_username', lineUsername)
        .single();
      
      if (searchError && searchError.code !== 'PGRST116') {
        console.error('ユーザー検索エラー:', searchError);
        return null;
      }
      
      // 既存ユーザーが見つかった場合
      if (existingUser) {
        return existingUser;
      }
      
      // 新規ユーザーの作成
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ line_username: lineUsername }])
        .select()
        .single();
      
      if (createError) {
        console.error('ユーザー作成エラー:', createError);
        return null;
      }
      
      return newUser;
    } catch (error) {
      console.error('ユーザーサービスエラー:', error);
      return null;
    }
  },
  
  // ユーザーIDの取得
  async getUserId(lineUsername: string) {
    if (!supabase) return null;
    if (isLocalMode) {
      console.log('ローカルモードでユーザーID取得: local-user-id');
      return 'local-user-id';
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('line_username', lineUsername)
        .single();
      
      if (error) {
        console.error('ユーザーID取得エラー:', error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error('ユーザーID取得サービスエラー:', error);
      return null;
    }
  }
};

// 日記サービス
export const diaryService = {
  // 日記の同期
  async syncDiaries(userId: string, diaries: any[]): Promise<{ success: boolean; error?: string; data?: any }> {
    if (!supabase) return { success: false, error: 'Supabase接続なし' };
    if (isLocalMode || !userId || userId === 'local-user-id') {
      console.log('ローカルモードまたは無効なユーザーID: 同期をスキップします', diaries.length, '件のデータ');
      return { success: false, error: 'ローカルモードまたは無効なユーザーID' };
    }
    
    try {
      // 日記データの整形
      const formattedDiaries = diaries.map(diary => {
        // console.log('Supabase同期 - 日記データ変換:', diary);
        
        // 自己肯定感スコアと無価値感スコアの処理
        let selfEsteemScore = diary.self_esteem_score;
        let worthlessnessScore = diary.worthlessness_score;
        
        // フィールド名の違いに対応
        if (selfEsteemScore === undefined && diary.selfEsteemScore !== undefined) {
          selfEsteemScore = diary.selfEsteemScore;
        }
        
        if (worthlessnessScore === undefined && diary.worthlessnessScore !== undefined) {
          worthlessnessScore = diary.worthlessnessScore;
        }
        
        // デフォルト値の設定
        if (selfEsteemScore === undefined || selfEsteemScore === null) {
          selfEsteemScore = 50;
        }
        
        if (worthlessnessScore === undefined || worthlessnessScore === null) {
          worthlessnessScore = 50;
        }
        
        return {
          id: diary.id || Date.now().toString(),
          user_id: userId,
          date: diary.date,
          emotion: diary.emotion,
          event: diary.event,
          realization: diary.realization,
          self_esteem_score: selfEsteemScore,
          worthlessness_score: worthlessnessScore,
          created_at: diary.created_at || new Date().toISOString(),
          counselor_memo: diary.counselor_memo || null,
          is_visible_to_user: diary.is_visible_to_user || false,
          counselor_name: diary.counselor_name || null,
          assigned_counselor: diary.assigned_counselor || null,
          urgency_level: diary.urgency_level || null
          // 注意: Supabaseに送信するデータには、selfEsteemScoreとworthlessnessScoreは含めない
          // これらはローカルストレージ用のフィールド名
        };
      });
      
      console.log('diaryService: Supabaseに同期するデータ:', formattedDiaries.length, '件');
      
      // 一括挿入（競合時は更新）
      try {
        const { data, error } = await supabase
          .from('diary_entries')
          .upsert(formattedDiaries, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.error('diaryService: 日記同期エラー:', error);
          
          // エラーの詳細をログに出力
          if (error.details) {
            console.error('diaryService: エラー詳細:', error.details);
          }
          
          // 一部のデータが問題を引き起こしている可能性があるため、1件ずつ同期を試みる
          console.log('diaryService: 1件ずつの同期を試みます...');
          let successCount = 0;
          
          for (const diary of formattedDiaries) {
            try {
              const { error: singleError } = await supabase
                .from('diary_entries')
                .upsert([diary], {
                  onConflict: 'id',
                  ignoreDuplicates: false
                });
              
              if (!singleError) {
                successCount++;
              } else {
                console.error(`diaryService: ID ${diary.id} の同期に失敗:`, singleError);
              }
            } catch (singleSyncError) {
              console.error(`diaryService: ID ${diary.id} の同期中にエラー:`, singleSyncError);
            }
          }
          
          if (successCount > 0) {
            console.log(`diaryService: ${successCount}/${formattedDiaries.length} 件のデータを同期しました`);
            return { 
              success: true, 
              data: { message: `${successCount}/${formattedDiaries.length} 件のデータを同期しました` } 
            };
          }
          
          return { success: false, error: `同期エラー: ${error.message}` };
        }
        
        console.log('diaryService: Supabase同期成功:', formattedDiaries.length, '件のデータを同期しました');
        return { success: true, data };
      } catch (syncError) {
        console.error('diaryService: Supabase同期中にエラーが発生:', syncError);
        return { success: false, error: `同期中にエラーが発生: ${String(syncError)}` };
      }
    } catch (error) {
      console.error('diaryService: 日記同期サービスエラー:', error);
      return { success: false, error: `同期サービスエラー: ${String(error)}`, data: null };
    }
  },
  
  // ユーザーの日記を取得
  async getUserDiaries(userId: string) {
    if (!supabase) return [];
    if (isLocalMode) return [];
    
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('日記取得エラー:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('日記取得サービスエラー:', error);
      return [];
    }
  }
};

// チャットサービス
export const chatService = {
  // チャットメッセージの取得
  async getChatMessages(chatRoomId: string) {
    if (!supabase) return [];
    if (isLocalMode) return [];
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('メッセージ取得エラー:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('メッセージ取得サービスエラー:', error);
      return [];
    }
  },
  
  // メッセージの送信
  async sendMessage(chatRoomId: string, content: string, senderId?: string, counselorId?: string) {
    if (!supabase) return null;
    if (isLocalMode) return null;
    
    try {
      const isCounselor = !!counselorId;
      
      const message = {
        chat_room_id: chatRoomId,
        content,
        sender_id: isCounselor ? null : senderId,
        counselor_id: isCounselor ? counselorId : null,
        is_counselor: isCounselor
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single();
      
      if (error) {
        console.error('メッセージ送信エラー:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('メッセージ送信サービスエラー:', error);
      return null;
    }
  }
};

// 同意履歴サービス
export const consentService = {
  // 同意履歴の保存
  async saveConsentHistory(consentRecord: any) {
    if (!supabase) return { success: false, error: 'Supabase接続なし' };
    if (isLocalMode) {
      console.log('ローカルモードで同意履歴保存: ローカルのみに保存します');
      // ローカルストレージに保存
      try {
        const existingHistories = localStorage.getItem('consent_histories');
        const histories = existingHistories ? JSON.parse(existingHistories) : [];
        histories.push(consentRecord);
        localStorage.setItem('consent_histories', JSON.stringify(histories));
        return { success: true, data: consentRecord };
      } catch (error) {
        console.error('ローカル同意履歴保存エラー:', error);
        return { success: false, error: String(error) };
      }
    }
    
    try {
      const { data, error } = await supabase
        .from('consent_histories')
        .insert([consentRecord])
        .select()
        .single();
      
      if (error) {
        console.error('同意履歴保存エラー:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('同意履歴保存サービスエラー:', error);
      return { success: false, error: String(error) };
    }
  },
  
  // 同意履歴の取得
  async getAllConsentHistories() {
    if (!supabase) return [];
    if (isLocalMode) return [];
    
    try {
      const { data, error } = await supabase
        .from('consent_histories')
        .select('*')
        .order('consent_date', { ascending: false });
      
      if (error) {
        console.error('同意履歴取得エラー:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('同意履歴取得サービスエラー:', error);
      return [];
    }
  }
};

// 同期サービス
export const syncService = {
  // 同意履歴をSupabaseに同期
  async syncConsentHistories() {
    if (!supabase) return false;
    if (isLocalMode) {
      console.log('ローカルモードで同意履歴同期: スキップします');
      return true; // ローカルモードでは成功とみなす
    }
    
    try {
      // ローカルストレージから同意履歴を取得
      const savedHistories = localStorage.getItem('consent_histories');
      if (!savedHistories) return true; // 同期するデータがない場合は成功とみなす
      
      const histories = JSON.parse(savedHistories);
      if (!Array.isArray(histories) || histories.length === 0) return true;
      
      // 一括挿入（競合時は無視）
      const { error } = await supabase
        .from('consent_histories')
        .upsert(histories, {
          onConflict: 'id',
          ignoreDuplicates: true
        });
      
      if (error) {
        console.error('同意履歴同期エラー:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('同意履歴同期サービスエラー:', error);
      return false;
    }
  },
  
  // Supabaseから同意履歴をローカルに同期
  async syncConsentHistoriesToLocal() {
    if (!supabase) return false;
    if (isLocalMode) {
      console.log('ローカルモードでSupabaseからの同期: スキップします');
      return true; // ローカルモードでは成功とみなす
    }
    
    try {
      const { data, error } = await supabase
        .from('consent_histories')
        .select('*')
        .order('consent_date', { ascending: false });
      
      if (error) {
        console.error('Supabaseからの同意履歴取得エラー:', error);
        return false;
      }
      
      if (data) {
        localStorage.setItem('consent_histories', JSON.stringify(data));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Supabaseからの同意履歴同期エラー:', error);
      return false;
    }
  }
};