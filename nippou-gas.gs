/**
 * 日報アプリ → スプレッドシート反映用スクリプト（各自のスプシに貼る雛形）
 * ------------------------------------------------------------
 * 【使い方（各自1回だけ）】
 *  1. 自分の日報スプレッドシートを開く
 *  2. 上部メニュー「拡張機能」→「Apps Script」を開く
 *  3. 表示されたコードを全部消して、このファイルの中身を貼り付けて保存
 *  4. 右上「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *       - 説明：日報反映
 *       - 実行するユーザー：自分
 *       - アクセスできるユーザー：全員（またはリンクを知っている全員）
 *     →「デプロイ」→ 表示された「ウェブアプリのURL」(https://script.google.com/macros/s/…/exec) をコピー
 *  5. 日報アプリの「連携URLの設定」にそのURLを貼って保存
 *
 * 【シートの前提】
 *  - 日付ごとのタブ名が「M/D」（例：9/8）
 *  - データは8行目＝8:00開始、30分刻み（A列=時間, B列=カテゴリー, D列=業務内容）
 *  ↓ もしレイアウトが違う場合は下の CONFIG を調整してください。
 */

var CONFIG = {
  headerRow:   7,   // ヘッダーの行
  firstRow:    8,   // 最初のデータ行（＝FIRST_TIME の行）
  firstTime:   480, // 最初のデータ行の時刻（分）。8:00 = 480
  colCategory: 2,   // カテゴリー列（B=2）
  colContent:  4,   // 業務内容列（D=4）
  slotMinutes: 30   // 1マスの分数
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = findSheetForDate(data.date);
    if (!sheet) {
      return json({ ok: false, error: "タブが見つかりません: " + tabNameFromDate(data.date) });
    }

    // その日のカテゴリー列・業務内容列をいったんクリア（アプリ側の内容で上書き）
    clearDayColumns(sheet);

    var totalRows = Math.round(1440 / CONFIG.slotMinutes); // 48マス（24時間分）
    (data.entries || []).forEach(function (en) {
      var start = en.start_min;
      var end   = en.end_min;
      for (var m = start; m < end; m += CONFIG.slotMinutes) {
        var row = rowForMinute(m);
        if (row == null) continue;
        sheet.getRange(row, CONFIG.colCategory).setValue(en.category || "");
        if (en.content) sheet.getRange(row, CONFIG.colContent).setValue(en.content);
      }
    });

    return json({ ok: true, wrote: (data.entries || []).length });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* 日付文字列 "2026-09-08" → タブ名 "9/8" */
function tabNameFromDate(dateStr) {
  var p = dateStr.split("-");
  return Number(p[1]) + "/" + Number(p[2]);
}

function findSheetForDate(dateStr) {
  var name = tabNameFromDate(dateStr);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name);
}

/* 絶対時刻（分・日跨ぎは1440超）→ 書き込む行番号 */
function rowForMinute(min) {
  var offset = ((min - CONFIG.firstTime) % 1440 + 1440) % 1440; // 8:00基準・24hで巻き戻し
  var idx = Math.round(offset / CONFIG.slotMinutes);
  return CONFIG.firstRow + idx;
}

/* その日のカテゴリー・業務内容列をクリア */
function clearDayColumns(sheet) {
  var rows = Math.round(1440 / CONFIG.slotMinutes);
  sheet.getRange(CONFIG.firstRow, CONFIG.colCategory, rows, 1).clearContent();
  sheet.getRange(CONFIG.firstRow, CONFIG.colContent,  rows, 1).clearContent();
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
