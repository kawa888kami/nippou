-- ============================================================
-- 日報アプリ：保存用テーブル
-- Supabase の SQL Editor に貼り付けて「Run」するだけでOK
-- （既存の RP対戦表 / オロログ と同じプロジェクトでOK）
-- ============================================================

-- 日報の1行 ＝ 1つの作業（開始〜終了・カテゴリ・業務内容）
create table if not exists nippou_entries (
  id         bigint generated always as identity primary key,
  person     text not null,               -- 入力者の名前
  date       date not null,               -- 対象日
  start_min  int  not null,               -- 開始（0:00からの分。例 9:00 = 540）
  end_min    int  not null,               -- 終了（同上。日跨ぎは 24:00超の値でもOK）
  category   text not null default '',     -- カテゴリー（営業管理 など）
  content    text not null default '',     -- 業務内容
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nippou_entries_person_date_idx
  on nippou_entries (person, date);

-- 入力者ごとの設定（自分のスプレッドシート連携URLなど）
create table if not exists nippou_settings (
  person     text primary key,
  gas_url    text not null default '',     -- Google Apps Script のウェブアプリURL（後から設定）
  updated_at timestamptz not null default now()
);

-- 誰でも読み書きできるように（社内利用向けの簡易設定）
alter table nippou_entries  enable row level security;
alter table nippou_settings enable row level security;

drop policy if exists nippou_entries_all  on nippou_entries;
drop policy if exists nippou_settings_all on nippou_settings;

create policy nippou_entries_all  on nippou_entries  for all using (true) with check (true);
create policy nippou_settings_all on nippou_settings for all using (true) with check (true);
