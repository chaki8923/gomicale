# 多言語化実装ガイド

## 実装完了内容

### 1. i18nセットアップ ✅
- **ライブラリ**: i18next, react-i18next, expo-localization
- **設定ファイル**: `src/i18n/i18n.js`
- **デバイス言語の自動検出**: 対応済み
- **言語の永続化**: AsyncStorageで保存

### 2. 翻訳ファイル ✅
- **日本語**: `src/i18n/locales/ja.json`
- **英語**: `src/i18n/locales/en.json`
- **カバー範囲**:
  - アプリタイトル
  - タブラベル
  - すべての画面のテキスト
  - ボタン、メッセージ
  - エラーメッセージ
  - 曜日名
  - ごみカテゴリー名

### 3. UI要素の多言語化 ✅
- **App.js**: i18n統合
- **dataFormat.js**: カテゴリー設定の多言語対応
- **TabNavigator.js**: タブラベルの翻訳
- **HomeScreen.js**: 全テキスト翻訳 + 言語切り替えボタン
- **CalendarScreen.js**: 全テキスト翻訳 + 月表示フォーマット対応
- **SearchScreen.js**: 全テキスト翻訳

### 4. 言語切り替え機能 ✅
- **場所**: HomeScreen右上に🌐ボタン
- **機能**: 日本語/英語の切り替え
- **永続化**: AsyncStorageで保存
- **自動再読み込み**: 言語変更後にデータ再取得

### 5. Firestoreデータ取得の多言語対応 ✅
- **garbageData.js**: `fetchGarbageClassification`関数を更新
- **フォールバック**: 多言語フィールドがない場合は日本語を使用
- **対応フィールド**:
  - `name_ja` / `name_en`
  - `description_ja` / `description_en`
  - `examples_ja` / `examples_en`

## Firestoreデータ構造

### 1. municipalities コレクション（都道府県）

#### 新しい多言語対応の構造:
```json
{
  "prefecture": "東京都",
  "prefecture_en": "Tokyo",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### 後方互換性:
既存の単一言語フィールド（`prefecture`）も引き続きサポートされます。
```json
{
  "prefecture": "東京都"
}
```

### 2. areas サブコレクション（エリア）

#### 新しい多言語対応の構造:
```json
{
  "name": "渋谷区",
  "name_en": "Shibuya",
  "schedule": {
    "1": {
      "burnable": [1, 8, 15, 22, 29],
      "recyclable": [5, 12, 19, 26]
    }
  }
}
```

#### 後方互換性:
既存の単一言語フィールド（`name`）も引き続きサポートされます。
```json
{
  "name": "渋谷区",
  "schedule": {...}
}
```

### 3. garbageItems コレクション（ごみ分別情報）

#### 新しい多言語対応の構造:
```json
{
  "municipalityId": "prefecture_id",
  "category": "recyclable",
  "name_ja": "ペットボトル",
  "name_en": "PET Bottles",
  "description_ja": "キャップとラベルを外して、中をすすいでから出してください",
  "description_en": "Remove cap and label, rinse inside before disposal",
  "examples_ja": ["飲料用ペットボトル", "調味料のペットボトル"],
  "examples_en": ["Beverage bottles", "Seasoning bottles"]
}
```

#### 後方互換性:
既存の単一言語フィールド（`name`, `description`, `examples`）も引き続きサポートされます。
```json
{
  "municipalityId": "prefecture_id",
  "category": "recyclable",
  "name": "ペットボトル",
  "description": "キャップとラベルを外して...",
  "examples": ["飲料用ペットボトル"]
}
```

## 使用方法

### アプリ内での言語切り替え
1. ホーム画面右上の🌐ボタンをタップ
2. 日本語 または English を選択
3. 自動的にUIが更新されます

### デバイス言語の自動検出
- アプリ初回起動時にデバイスの言語設定を検出
- 日本語デバイス → 日本語で表示
- その他のデバイス → 英語で表示

## 管理画面での対応（gomicale-admin）

### 都道府県の登録
Firebase Console または管理画面から都道府県を登録する際、以下のフィールドを設定：
```json
{
  "prefecture": "東京都",
  "prefecture_en": "Tokyo"
}
```

### data-migration/page.tsx での対応
JSONインポート時に多言語フィールドを含めることができます:

```json
{
  "areas": [
    {
      "name": "渋谷区",
      "name_en": "Shibuya",
      "monthlySchedules": [...]
    }
  ],
  "garbageItems": [
    {
      "name_ja": "ペットボトル",
      "name_en": "PET Bottles",
      "category": "recyclable",
      "description_ja": "キャップとラベルを外して...",
      "description_en": "Remove cap and label...",
      "examples_ja": ["飲料用ペットボトル"],
      "examples_en": ["Beverage bottles"]
    }
  ]
}
```

### 地名の英語表記について

地名（都道府県名・エリア名）の英語表記は以下のガイドラインに従うことを推奨：

#### 都道府県
- **東京都** → `Tokyo`
- **大阪府** → `Osaka`
- **北海道** → `Hokkaido`
- **神奈川県** → `Kanagawa`
- **埼玉県** → `Saitama`

#### 市区町村（エリア）
- **渋谷区** → `Shibuya`
- **新宿区** → `Shinjuku`
- **さいたま市** → `Saitama City`
- **横浜市** → `Yokohama`

#### 地区名
複雑な地区名は：
- **上奥富、下奥富、柏原新田 地区** → `Kamiokutomi, Shimookutomi, Kashiwabarashinden District`
- または簡略化：`Okutomi Area`

## 翻訳の追加方法

### 新しい翻訳キーを追加する場合:

1. **ja.jsonに追加**:
```json
{
  "newSection": {
    "newKey": "新しいテキスト"
  }
}
```

2. **en.jsonに追加**:
```json
{
  "newSection": {
    "newKey": "New Text"
  }
}
```

3. **コンポーネントで使用**:
```javascript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
// ...
<Text>{t('newSection.newKey')}</Text>
```

### パラメータ付き翻訳:
```json
{
  "message": "こんにちは、{{name}}さん"
}
```
```javascript
t('message', { name: 'Taro' }) // → "こんにちは、Taroさん"
```

## テスト方法

1. アプリを起動
2. ホーム画面で言語切り替えボタン（🌐）をタップ
3. Englishを選択
4. すべてのタブを確認してUIが英語になっていることを確認
5. 日本語に戻して確認

## データの更新手順

### 既存データを多言語化する方法

#### 1. Firebase Consoleでの手動更新
1. Firebase Console → Firestore Database を開く
2. `municipalities` コレクションの各ドキュメントを開く
3. `prefecture_en` フィールドを追加（例: "Tokyo"）
4. 各`areas`サブコレクションのドキュメントを開く
5. `name_en` フィールドを追加（例: "Shibuya"）

#### 2. 一括更新スクリプト（オプション）
以下のようなスクリプトでFirestoreデータを一括更新可能：

```javascript
// 例: 都道府県名の一括更新
const prefectureTranslations = {
  "東京都": "Tokyo",
  "大阪府": "Osaka",
  "埼玉県": "Saitama"
};

// municipalities コレクションを更新
const municipalitiesSnapshot = await getDocs(collection(db, 'municipalities'));
for (const doc of municipalitiesSnapshot.docs) {
  const prefecture = doc.data().prefecture;
  if (prefectureTranslations[prefecture]) {
    await updateDoc(doc.ref, {
      prefecture_en: prefectureTranslations[prefecture]
    });
  }
}
```

## 今後の拡張

### 新しい言語を追加する場合:
1. `src/i18n/locales/[lang].json`を作成（例: `fr.json`）
2. `src/i18n/i18n.js`のresourcesに追加
3. HomeScreenの言語選択モーダルに選択肢を追加
4. Firestoreデータに`prefecture_[lang]`, `name_[lang]`フィールドを追加

## 注意事項

- **Firestoreの既存データは手動で多言語フィールドを追加する必要があります**
- データがない場合は日本語フィールドにフォールバックします
- 地名は固有名詞なので、ローマ字表記または公式英語表記を使用
- カレンダーの月表示フォーマットは言語によって自動的に変わります
- すべてのデータ取得関数は後方互換性を保っているため、段階的な移行が可能

