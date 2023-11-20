# REMIND_CYBOZU_APP

サイボウズのスケジュールをSlack上で表示し、予定時間の前にリマインドを設定できます。

## 使用言語

- docker-compose
  開発環境
- Node.js
  実行環境  
- playwright
  サイボウズのスクレイピングに使用
- Slack Bolt
  Slackとの連携に使用
- TypeScript
  

## 使用方法

### スケジュール取得

<img src="./doc/データ表示説明.png" width="500" >  

サイボウズから取得したデータをローカルに保存し、保存したデータを表示しています。  

データが登録されていない・再取得したい場合
 →「データを取得」をクリックで、サイボウズから最新データを取得します。  

### ユーザーを追加

メニューの「サイボウズユーザーを登録」から、取得したいサイボウズのUIDと表示名を設定  
<img width="500" alt="スクリーンショット 2023-07-19 16 49 20" src="https://github.com/kajidog/cybozu_remind_app/assets/51894304/1ec4e83b-e22a-4acf-888e-53bfd1044dd9">  
<img width="500" alt="スクリーンショット 2023-07-19 16 47 46" src="https://github.com/kajidog/cybozu_remind_app/assets/51894304/ea17046c-8ae3-443a-a204-bcc65acebddf">  

UIDはサイボウズのプロフィールから確認可能  
<img width="500" alt="スクリーンショット 2023-07-19 16 46 48" src="https://github.com/kajidog/cybozu_remind_app/assets/51894304/83a54484-3a39-4946-a36e-d256acbe9e10">  

### リマインド

<img src="./doc/リマインド設定.png" width="500" >  

右端のメニューでリマインドを設定できます。  
リマインドが設定されている場合、リマインド日時が追加で表示されます。  
**注意：リマインド設定後にスケジュールが変更された場合でも、リマインドの時間・内容は変更されません。**  

<img src="./doc/リマインド通知.png" width="500" >  

時間になるとDMで通知が来ます。  

## 環境構築方法

1. slack_botを作成  
*./manifest.yml* である程度作成できます。  
（SLACK_APP_TOKENだけ手動で設定）
<img src="./doc/slack_app.png" width="500" >  

2. 以下のコマンドを実行

```bash
git clone このリポジトリのURL
cd remind_cybozu_app
make init
cp .env.example .env
vim .env
make up
```

以上

.env  

```env
SLACK_BOT_TOKEN=<SLACK_BOT_TOKEN>
SLACK_APP_TOKEN=<SLACK_APP_TOKEN>
PRIVATE_KEY_DECRYPTION_PASSPHRASE="password"
BASIC_USER=ADアカウントユーザー
BASIC_PASS=ADアカウントパスワード
CYBOZU_URL1=社外用サイボウズURL
CYBOZU_URL2=社内用URL
CYBOZU_UID=サイボウズユーザー
CYBOZU_PASS=サイボウズバスワード

```
