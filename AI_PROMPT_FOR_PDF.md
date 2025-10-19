# AI Prompt for Garbage Collection Calendar PDF to JSON Conversion

## 🤖 AIへのプロンプト（多言語対応版）

```
以下のごみ収集カレンダーPDFを解析し、指定されたJSON形式で出力してください。

## 出力形式

以下のJSON構造で出力してください：

```json
{
  "areas": [
    {
      "name": "エリア名（日本語）",
      "name_en": "Area Name (English)",
      "monthlySchedules": [
        {
          "month": "YYYY-MM",
          "schedule": {
            "category_key": [日付の配列]
          }
        }
      ]
    }
  ],
  "garbageItems": [
    {
      "name_ja": "ごみの名前（日本語）",
      "name_en": "Garbage Name (English)",
      "category": "category_key",
      "description_ja": "出し方の説明（日本語）",
      "description_en": "Disposal instructions (English)",
      "examples_ja": ["例1", "例2"],
      "examples_en": ["Example 1", "Example 2"]
    }
  ]
}
```

## カテゴリーの標準化

以下のカテゴリーキーを使用してください：

| 日本語名 | カテゴリーキー | 英語名 |
|---------|--------------|--------|
| 燃やすごみ | `burnable` | Burnable Waste |
| 燃やさないごみ | `nonBurnable` | Non-Burnable Waste |
| 資源ごみ | `recyclable` | Recyclables |
| びん | `bottles` | Bottles |
| かん | `cans` | Cans |
| 容器包装プラスチック | `plastics` | Plastic Containers |
| ペットボトル | `pet_bottles` | PET Bottles |
| 古布・紙類 | `paper_and_cloth` | Paper & Cloth |
| 危険・有害ごみ | `hazardous_and_dangerous` | Hazardous Waste |
| 家庭廃食用油 | `cooking_oil` | Cooking Oil |
| びん・缶・小型電化製品 | `bottles_and_cans` | Bottles, Cans & Small Appliances |
| 資源物 | `resources` | Resources |
| 金属・陶器・ガラス | `metal_pottery_glass` | Metal, Pottery & Glass |

PDFに記載されているカテゴリー名を上記の標準カテゴリーにマッピングしてください。

## 抽出ルール

### 1. エリア情報（areas）
- **name**: PDFに記載されている地域名をそのまま使用
- **name_en**: 地域名を英語表記に変換（以下のルールに従う）
  - 都道府県名: 「東京都」→ "Tokyo"、「大阪府」→ "Osaka"
  - 市区町村: 「渋谷区」→ "Shibuya"、「さいたま市」→ "Saitama City"
  - 地区名: 「〜地区」→ "~ District"、「〜エリア」→ "~ Area"
  - 複雑な地名: ローマ字表記を使用（例: 「上奥富」→ "Kamiokutomi"）

### 2. 月次スケジュール（monthlySchedules）
- **month**: "YYYY-MM" 形式（例: "2025-04"）
- **schedule**: カテゴリーキーをキーとし、収集日（日付の数字）の配列を値とする
  - 例: `{"burnable": [1, 8, 15, 22, 29], "recyclable": [5, 12, 19, 26]}`
- 曜日ベースの記載がある場合は、その月のカレンダーから該当日を計算して配列にする

### 3. ごみ分別情報（garbageItems）
- **name_ja**: ごみの種類の日本語名
- **name_en**: ごみの種類の英語名（適切に翻訳）
- **category**: 上記の標準カテゴリーキーを使用
- **description_ja**: 出し方の説明（日本語）
  - PDFに記載されている注意事項や出し方をそのまま使用
- **description_en**: 出し方の説明を英語に翻訳
  - 簡潔で明確な英語に翻訳
- **examples_ja**: 具体例の配列（日本語）
- **examples_en**: 具体例の配列を英語に翻訳

### 4. 翻訳ガイドライン

#### よく使われる表現の翻訳例
- 「キャップとラベルを外して」→ "Remove cap and label"
- 「中をすすいで」→ "Rinse inside"
- 「水分をよく切って」→ "Drain water well"
- 「ひもでしばって」→ "Tie with string"
- 「透明な袋に入れて」→ "Put in a transparent bag"
- 「〜cm未満」→ "Less than ~ cm"
- 「別袋で出す」→ "Put in a separate bag"

#### 品目の翻訳例
- 「生ごみ」→ "Food Waste"
- 「プラスチック製品」→ "Plastic Products"
- 「小型家電」→ "Small Appliances"
- 「乾電池」→ "Dry Batteries"
- 「紙パック」→ "Paper Cartons"
- 「衣類」→ "Clothing"
- 「新聞・雑誌」→ "Newspapers & Magazines"

## 注意事項

1. PDFに記載されている全てのエリアを抽出してください
2. 収集スケジュールは月ごとに正確に抽出してください
3. 「第1・第3金曜日」のような記載がある場合は、その月の該当日を計算してください
4. 不明瞭な情報がある場合は、合理的な推測をしてください
5. 出力は必ず有効なJSON形式にしてください
6. コメントやメモは含めないでください

## 出力例

```json
{
  "areas": [
    {
      "name": "上奥富、下奥富、柏原新田 地区",
      "name_en": "Kamiokutomi, Shimookutomi, Kashiwabarashinden District",
      "monthlySchedules": [
        {
          "month": "2025-04",
          "schedule": {
            "burnable": [1, 4, 8, 11, 15, 18, 22, 25, 29],
            "nonBurnable": [23],
            "plastics": [3, 10, 17, 24],
            "pet_bottles": [9],
            "bottles_and_cans": [2, 16],
            "paper_and_cloth": [7, 28]
          }
        },
        {
          "month": "2025-05",
          "schedule": {
            "burnable": [2, 6, 9, 13, 16, 20, 23, 27, 30],
            "nonBurnable": [21],
            "plastics": [1, 8, 15, 22, 29],
            "pet_bottles": [14],
            "bottles_and_cans": [7, 21],
            "paper_and_cloth": [12, 26]
          }
        }
      ]
    },
    {
      "name": "入曽 地区",
      "name_en": "Iriso District",
      "monthlySchedules": [
        {
          "month": "2025-04",
          "schedule": {
            "burnable": [2, 5, 9, 12, 16, 19, 23, 26, 30],
            "nonBurnable": [24],
            "plastics": [4, 11, 18, 25],
            "pet_bottles": [10],
            "bottles_and_cans": [3, 17],
            "paper_and_cloth": [8, 29]
          }
        }
      ]
    }
  ],
  "garbageItems": [
    {
      "name_ja": "ペットボトル",
      "name_en": "PET Bottles",
      "category": "pet_bottles",
      "description_ja": "キャップとラベルを外して、中をすすいでから出してください。",
      "description_en": "Remove cap and label, rinse inside before disposal.",
      "examples_ja": ["飲料用ペットボトル", "調味料のペットボトル"],
      "examples_en": ["Beverage bottles", "Seasoning bottles"]
    },
    {
      "name_ja": "びん・缶・小型電化製品",
      "name_en": "Bottles, Cans and Small Appliances",
      "category": "bottles_and_cans",
      "description_ja": "スプレー缶、乾電池、小型電化製品は、それぞれ別袋で出してください。",
      "description_en": "Put spray cans, dry batteries, and small appliances in separate bags.",
      "examples_ja": ["飲料用・食品用等のびん・缶", "スプレー缶", "乾電池", "小型電化製品"],
      "examples_en": ["Bottles and cans for beverages and food", "Spray cans", "Dry batteries", "Small appliances"]
    },
    {
      "name_ja": "燃やすごみ",
      "name_en": "Burnable Waste",
      "category": "burnable",
      "description_ja": "生ごみは水分をよく切って出してください。",
      "description_en": "Drain water well from food waste before disposal.",
      "examples_ja": ["生ごみ", "紙くず", "木製品", "衣類（リサイクルできないもの）"],
      "examples_en": ["Food waste", "Paper scraps", "Wooden items", "Clothing (non-recyclable)"]
    },
    {
      "name_ja": "容器包装プラスチック",
      "name_en": "Plastic Containers and Packaging",
      "category": "plastics",
      "description_ja": "中をすすいで、汚れを落としてから出してください。",
      "description_en": "Rinse and remove dirt before disposal.",
      "examples_ja": ["食品トレー", "レジ袋", "ペットボトルのキャップ", "カップ麺の容器"],
      "examples_en": ["Food trays", "Shopping bags", "PET bottle caps", "Instant noodle cups"]
    }
  ]
}
```

PDFの内容を解析して、上記の形式でJSONを出力してください。
```

---

## 📝 使用方法（gomicale-admin）

### pdf-import ページでの実装

1. **PDF → テキスト抽出**
   ```typescript
   // PDFをテキスト化
   const pdfText = await extractTextFromPDF(file);
   ```

2. **AI APIに送信**
   ```typescript
   // Gemini API などに送信
   const prompt = `${AI_PROMPT_TEMPLATE}\n\nPDF内容:\n${pdfText}`;
   const response = await callAI(prompt);
   const jsonData = JSON.parse(response);
   ```

3. **JSONを検証**
   ```typescript
   // スキーマ検証
   validateJSON(jsonData);
   ```

4. **Firestoreにインポート**
   ```typescript
   // data-migrationと同じロジックを使用
   await importToFirestore(jsonData);
   ```

---

## 🔧 プロンプト改善のポイント

### より精度を上げるには

1. **PDFのサンプルを提供**
   - 実際のPDFの構造をプロンプトに含める
   - 複数のパターンに対応できるように例を増やす

2. **エラーケースの指示**
   - 不明瞭な記載がある場合の対処法
   - 欠落データの処理方法

3. **バリデーションルール**
   - 日付の妥当性チェック
   - カテゴリーの存在確認
   - 必須フィールドの確認

4. **後処理の指示**
   - 重複データの削除
   - データの正規化
   - フォーマットの統一

---

## 🎯 期待される出力品質

### チェックリスト

- [ ] 全てのエリアが抽出されている
- [ ] スケジュールの日付が正確（月の日数を超えていない）
- [ ] カテゴリーキーが標準化されている
- [ ] 日本語・英語の両方が含まれている
- [ ] 説明文が簡潔で明確
- [ ] 具体例が適切
- [ ] 有効なJSON形式
- [ ] 文字エンコーディングが正しい

---

## 💡 ヒント

### 地名の英語表記リファレンス

#### 主要都道府県
- 北海道 → Hokkaido
- 東京都 → Tokyo
- 大阪府 → Osaka
- 京都府 → Kyoto
- 神奈川県 → Kanagawa
- 埼玉県 → Saitama
- 千葉県 → Chiba
- 愛知県 → Aichi
- 福岡県 → Fukuoka

#### 地名の接尾語
- 〜市 → ~ City
- 〜区 → ~ (区名のみローマ字)
- 〜町 → ~ Town
- 〜村 → ~ Village
- 〜地区 → ~ District
- 〜エリア → ~ Area

### カテゴリーマッピングのヒント

PDFでよく使われる表現とカテゴリーの対応：
- 「もえるごみ」「燃えるゴミ」→ `burnable`
- 「もえないごみ」「燃えないゴミ」→ `nonBurnable`
- 「資源」「リサイクル」→ `recyclable`
- 「プラ」「プラスチック製容器包装」→ `plastics`
- 「ペット」「PETボトル」→ `pet_bottles`
- 「紙・布」「古紙」→ `paper_and_cloth`
- 「有害」「危険物」→ `hazardous_and_dangerous`

