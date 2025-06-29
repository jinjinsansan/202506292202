/*
  # 初期データベーススキーマ作成

  1. 新しいテーブル
    - `users` - ユーザー情報
    - `diary_entries` - 日記エントリー
    - `counselors` - カウンセラー情報
    - `chat_rooms` - チャットルーム
    - `messages` - メッセージ
    - `consent_histories` - 同意履歴

  2. セキュリティ
    - すべてのテーブルでRLSを有効化
    - ユーザーは自分のデータのみアクセス可能
    - カウンセラーは担当するチャットルームのみアクセス可能
*/

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 日記エントリーテーブル
CREATE TABLE IF NOT EXISTS diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  emotion text NOT NULL,
  event text NOT NULL,
  realization text NOT NULL,
  self_esteem_score integer DEFAULT 50,
  worthlessness_score integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  counselor_memo text,
  is_visible_to_user boolean DEFAULT false,
  counselor_name text,
  assigned_counselor text,
  urgency_level text CHECK (urgency_level IN ('high', 'medium', 'low') OR urgency_level IS NULL)
);

-- カウンセラーテーブル
CREATE TABLE IF NOT EXISTS counselors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- チャットルームテーブル
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  counselor_id uuid REFERENCES counselors(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'waiting')),
  created_at timestamptz DEFAULT now()
);

-- メッセージテーブル
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id),
  counselor_id uuid REFERENCES counselors(id),
  content text NOT NULL,
  is_counselor boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT messages_sender_check CHECK (
    (sender_id IS NOT NULL AND counselor_id IS NULL AND is_counselor = false) OR
    (sender_id IS NULL AND counselor_id IS NOT NULL AND is_counselor = true)
  )
);

-- 同意履歴テーブル
CREATE TABLE IF NOT EXISTS consent_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_username text NOT NULL,
  consent_given boolean NOT NULL,
  consent_date timestamptz NOT NULL,
  ip_address text NOT NULL,
  user_agent text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON diary_entries(date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_emotion ON diary_entries(emotion);
CREATE INDEX IF NOT EXISTS idx_diary_entries_emotion_date ON diary_entries(emotion, date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_is_visible_to_user ON diary_entries(is_visible_to_user);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user_id ON chat_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_consent_histories_line_username ON consent_histories(line_username);
CREATE INDEX IF NOT EXISTS idx_consent_histories_consent_date ON consent_histories(consent_date);

-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_histories ENABLE ROW LEVEL SECURITY;

-- RLSポリシー設定

-- ユーザーは自分の情報のみアクセス可能
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = line_username);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = line_username);

-- 日記エントリー: ユーザーは自分の日記のみアクセス可能
CREATE POLICY "Users can manage own diary entries"
  ON diary_entries
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE line_username = auth.uid()::text));

-- チャットルーム: ユーザーは自分のチャットルームのみアクセス可能
CREATE POLICY "Users can access own chat rooms"
  ON chat_rooms
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE line_username = auth.uid()::text));

-- メッセージ: ユーザーは自分のチャットルームのメッセージのみアクセス可能
CREATE POLICY "Users can access messages in own chat rooms"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    chat_room_id IN (
      SELECT id FROM chat_rooms 
      WHERE user_id IN (SELECT id FROM users WHERE line_username = auth.uid()::text)
    )
  );

-- カウンセラー用ポリシー（管理者権限）
CREATE POLICY "Counselors can access all data"
  ON counselors
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Counselors can access assigned chat rooms"
  ON chat_rooms
  FOR ALL
  TO authenticated
  USING (
    counselor_id IN (
      SELECT id FROM counselors 
      WHERE email = auth.email() AND is_active = true
    )
  );

CREATE POLICY "Counselors can access messages in assigned rooms"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    chat_room_id IN (
      SELECT id FROM chat_rooms 
      WHERE counselor_id IN (
        SELECT id FROM counselors 
        WHERE email = auth.email() AND is_active = true
      )
    )
  );

-- 同意履歴のポリシー
CREATE POLICY "Counselors can read consent histories"
  ON consent_histories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM counselors 
      WHERE email = auth.email() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own consent histories"
  ON consent_histories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- カウンセラーコメント表示のポリシー
CREATE POLICY "Users can read counselor comments"
  ON diary_entries
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE line_username = auth.uid()::text)
    OR (is_visible_to_user = true AND EXISTS (
      SELECT 1 FROM counselors 
      WHERE email = auth.email() AND is_active = true
    ))
  );

-- 初期カウンセラーデータの挿入
INSERT INTO counselors (name, email, is_active)
VALUES
  ('心理カウンセラー仁', 'jin@namisapo.com', true),
  ('心理カウンセラーAOI', 'aoi@namisapo.com', true),
  ('心理カウンセラーあさみ', 'asami@namisapo.com', true),
  ('心理カウンセラーSHU', 'shu@namisapo.com', true),
  ('心理カウンセラーゆーちゃ', 'yucha@namisapo.com', true),
  ('心理カウンセラーSammy', 'sammy@namisapo.com', true)
ON CONFLICT (email) DO NOTHING;