# ごみカレ

ゴミ収集カレンダーアプリ - React Native + Expo + Firebase

## 概要

市町村のごみ収集スケジュールとごみ分別情報を提供するモバイルアプリケーションです。
Firestoreからリアルタイムでデータを取得し、ユーザーの地域に応じた収集スケジュールを表示します。

## 機能

- 今日の収集予定表示
- 次回の収集予定表示
- カレンダービュー
- ごみ分別検索
- 市町村・地域選択

## 環境構築

このプロジェクトはReact Native + Expoで開発されています。

### 前提条件

- Node.js (v18以上)
- npm または yarn
- iOS開発の場合: Xcode
- Android開発の場合: Android Studio
- Firebaseプロジェクト（Firestore有効化済み）

### セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、実際のFirebase設定を記入してください。

```bash
cp .env.example .env
```

`.env`を開いて、Firebase設定を記入します。

3. アプリの起動

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

## 管理画面

ごみ収集データの登録・管理には別プロジェクトの管理画面を使用します。

管理画面のセットアップ手順は `/path/to/gomicale-admin/README.md` を参照してください。

## プロジェクト構造

```
gomicale/
├── App.js                           # アプリのメインコンポーネント
├── app.json                         # Expo設定ファイル
├── package.json                     # 依存関係管理
├── babel.config.js                  # Babel設定
└── src/
    ├── config/
    │   └── firebase.js              # Firebase設定
    ├── data/
    │   ├── dataFormat.js            # ゴミごとのフォーマットデータ
    │   └── garbageData.js           # Firestoreからのデータ取得
    ├── navigation/
    │   └── TabNavigator.js          # タブナビゲーション
    └── screens/
        ├── HomeScreen.js            # ホーム画面
        ├── CalendarScreen.js        # カレンダー画面
        └── SearchScreen.js          # 検索画面
```

## データ構造

### Firestore

```
municipalities/{municipalityId}
  - name: "渋谷区"
  - prefecture: "東京都"
  - createdAt: timestamp
  - updatedAt: timestamp
  
  areas/{areaId}
    - name: "渋谷1丁目"
    - schedule: {
        burnable: [1, 4],
        nonBurnable: [3],
        recyclable: [2],
        bottles: [5]
      }

garbageItems/{itemId}
  - municipalityId: "..."
  - name: "ペットボトル"
  - category: "recyclable"
  - description: "..."
  - examples: ["...", "..."]
```

## 開発

アプリを開発する際は、以下のコマンドで開発サーバーを起動してください：

```bash
npm start
```

その後、Expo Goアプリ（iOS/Android）でQRコードをスキャンするか、シミュレータ/エミュレータで実行できます。

## 技術スタック

- React Native
- Expo
- Firebase (Firestore)
- AsyncStorage
- React Navigation

## 注意事項

- 初回起動時に市町村と地域を選択する必要があります
- データは管理画面から事前に登録しておく必要があります
- オフラインモードには現在対応していません
