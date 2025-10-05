# ごみカレ

ゴミ収集カレンダーアプリ

## 環境構築

このプロジェクトはReact Native + Expoで開発されています。

### 前提条件

- Node.js (v18以上)
- npm または yarn
- iOS開発の場合: Xcode
- Android開発の場合: Android Studio

### セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. アプリの起動

#### iOSシミュレータで起動
```bash
npm run ios
```

#### Androidエミュレータで起動
```bash
npm run android
```

#### 開発サーバーの起動（QRコードでスキャン）
```bash
npm start
```

## プロジェクト構造

- `App.js` - アプリのメインコンポーネント
- `app.json` - Expo設定ファイル
- `package.json` - 依存関係管理
- `babel.config.js` - Babel設定

## 開発

アプリを開発する際は、以下のコマンドで開発サーバーを起動してください：

```bash
npm start
```

その後、Expo Goアプリ（iOS/Android）でQRコードをスキャンするか、シミュレータ/エミュレータで実行できます。
# gomicale
