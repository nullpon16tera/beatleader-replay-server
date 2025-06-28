# BeatLeader Replay Server

## 概要

BeatLeader Replay Serverは、何らかの影響で[BeatLeader](https://www.beatleader.xyz/)にリプレイがアップロードされず、リプレイを開いても動いてくれない場合に、BeatLeader側ではlocalhostでアクセスするようになっているため、localhostで接続できるようにするためのサーバーを起動するアプリです。

UserData\BeatLeader\Replays　ディレクトリにあるリプレイファイルがマッチすれば、そのデータにアクセスできるようにするものです。
そのため、リプレイデータ自体が見つからなかった場合は、リプレイを見ることは不可能なため諦めて。。

## 機能

-   **ローカルHTTPSサーバー**: あなたのPC上で安全なHTTPSサーバーを起動し、リプレイファイルを提供します。
-   **BeatLeaderとの連携**: `replay.beatleader.com`からのリクエストを許可し、ウェブサイトと直接通信します。
-   **自動証明書管理**: 初回起動時に自己署名証明書を自動で生成し、Windowsの信頼された証明書ストアに登録します。これにより、ブラウザが警告を出すことなく安全に通信できます。

## 使い方

1.  **ダウンロードと配置**:
    -   [リリースページ](https://github.com/nullpon16tera/beatleader-replay-server/releases) から最新版の`BeatLeaderReplayServer.exe`をダウンロードします。
    -   ダウンロードしたファイルを、BeatSaberのゲームがインストールされているフォルダ（`Beat Saber.exe`がある場所）に配置してください。

2.  **サーバーの起動**:
    -   `BeatLeaderReplayServer.exe`を実行します。
    -   アプリケーションが起動したら、「Enable Server」ボタンをクリックします。

3.  **管理者権限の許可**:
    -   証明書をPCに登録するため、管理者権限を要求するプロンプトが表示されます。
    -   「はい」を選択して許可してください。これを許可しないとサーバーは正しく機能しません。

4.  **リプレイの再生**:
    -   サーバーが「Server is Running」と表示されたら準備完了です。
    -   [BeatLeader](https://replay.beatleader.xyz/)のサイトにアクセスし、再生できなかったリプレイをお試しください。
    -   リプレイデータ自体がパソコンにない場合は、諦めてください。

## 注意事項

-   このアプリケーションはWindows専用です。
-   BeatSaberのゲームフォルダの構成に依存するため、必ず正しい場所に配置してください。具体的には、`UserData/BeatLeader/Replays`フォルダを正しく認識できる必要があります。
-   証明書を信頼させるために、初回のみ管理者権限が必要です。