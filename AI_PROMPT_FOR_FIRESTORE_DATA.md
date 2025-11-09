# ゴミ収集スケジュールデータ変換プロンプト

このプロンプトを使用して、既存のフラットなゴミ収集スケジュールデータを階層的な構造に変換してください。

## データ構造の要件

### 1. 基本構造
- **通常の都道府県**: 都道府県 → 市区町村 → 地域 → スケジュール の4階層
- **東京都のみ特例**: 都道府県 → 区 → 地域 → スケジュール の4階層

### 2. 出力フォーマット

```json
{
  "municipalities": [
    {
      "id": "tokyo",
      "prefecture": "東京都",
      "prefecture_en": "Tokyo",
      "cities": [
        {
          "id": "fuchu_city",
          "name": "府中市",
          "name_en": "Fuchu City",
          "type": "city",
          "areas": [
            {
              "id": "fuchu_1_2",
              "name": "府中町1丁目・2丁目/宮西町/宮町",
              "name_en": "Fuchucho 1-chome/2-chome, Miyanishicho, Miyacho",
              "schedule": {
                "1": {
                  "burnable": [6, 9, 13, 16, 20, 23, 27, 30],
                  "nonBurnable": [8, 22],
                  "plastics": [5, 12, 19, 26],
                  "pet_bottles": [15, 29],
                  "bottles": [12, 26],
                  "cans": [5, 19],
                  "paper_and_cloth": [7, 14, 21, 28],
                  "hazardous": [12],
                  "harmful": [26],
                  "cooking_oil": [26]
                },
                "2": {
                  "burnable": [3, 6, 10, 13, 17, 20, 24, 27],
                  "nonBurnable": [5, 19],
                  "plastics": [2, 9, 16, 23],
                  "pet_bottles": [12, 26],
                  "bottles": [9, 23],
                  "cans": [2, 16],
                  "paper_and_cloth": [4, 11, 18, 25],
                  "hazardous": [12],
                  "harmful": [26],
                  "cooking_oil": [23]
                }
              }
            }
          ]
        },
        {
          "id": "shibuya_ku",
          "name": "渋谷区",
          "name_en": "Shibuya Ward",
          "type": "ward",
          "areas": [
            {
              "id": "shibuya_central",
              "name": "渋谷1丁目",
              "name_en": "Shibuya 1-chome",
              "schedule": {
                ...
              }
            }
          ]
        }
      ]
    },
    {
      "id": "osaka",
      "prefecture": "大阪府",
      "prefecture_en": "Osaka",
      "cities": [
        {
          "id": "osaka_city",
          "name": "大阪市",
          "name_en": "Osaka City",
          "type": "city",
          "areas": [
            ...
          ]
        }
      ]
    }
  ],
  "garbageItems": [
    {
      "name": "燃やすごみ",
      "name_en": "Burnable Garbage",
      "category": "burnable",
      "description": "ごみは朝8時までに出してください。一度収集に回った後に出されたものは収集しません。雨水などが入ると重くなるため、袋の口は必ず縛ってください。汚れが落ちない容器包装プラスチックは燃やすごみとして出してください。",
      "description_en": "Please put out garbage by 8:00 AM. We will not collect garbage put out after collection has passed. Be sure to tie the bag opening to prevent rainwater from entering and making it heavy. Put container and packaging plastics that cannot be cleaned as burnable garbage.",
      "examples": []
    },
    {
      "name": "燃やさないごみ",
      "name_en": "Non-burnable Garbage",
      "category": "nonBurnable",
      "description": "汚れが落ちないペットボトル・びん・かんは燃やさないごみで捨ててください。",
      "description_en": "Dispose of PET bottles, bottles, and cans that cannot be cleaned as non-burnable garbage.",
      "examples": []
    },
    {
      "name": "容器包装プラスチック",
      "name_en": "Plastic Containers",
      "category": "plastics",
      "description": "ペットボトルのキャップとラベルは、ボトルから外して容器包装プラスチックに捨ててください。汚れが落ちない場合は「燃やすごみ」へ。",
      "description_en": "Remove PET bottle caps and labels from bottles and dispose of them as plastic containers. If they cannot be cleaned, put them in 'Burnable Garbage'.",
      "examples": [
        "ペットボトルのキャップ",
        "ペットボトルのラベル"
      ]
    },
    {
      "name": "ペットボトル",
      "name_en": "PET Bottles",
      "category": "pet_bottles",
      "description": "ビニール袋ではなく、かごなどの容器やネットに入れて出してください。キャップとラベルは外して「容器包装プラスチック」へ。汚れが落ちない場合は「燃やさないごみ」へ。",
      "description_en": "Put them in a container such as a basket or net, not in plastic bags. Remove caps and labels and put them in 'Plastic Containers'. If they cannot be cleaned, put them in 'Non-burnable Garbage'.",
      "examples": []
    },
    {
      "name": "びん",
      "name_en": "Bottles",
      "category": "bottles",
      "description": "ビニール袋ではなく、かごなどの容器やネットに入れて出してください。汚れが落ちない場合は「燃やさないごみ」へ。",
      "description_en": "Put them in a container such as a basket or net, not in plastic bags. If they cannot be cleaned, put them in 'Non-burnable Garbage'.",
      "examples": []
    },
    {
      "name": "かん",
      "name_en": "Cans",
      "category": "cans",
      "description": "ビニール袋ではなく、かごなどの容器やネットに入れて出してください。汚れが落ちない場合は「燃やさないごみ」へ。",
      "description_en": "Put them in a container such as a basket or net, not in plastic bags. If they cannot be cleaned, put them in 'Non-burnable Garbage'.",
      "examples": []
    },
    {
      "name": "古紙・古布",
      "name_en": "Paper and Cloth",
      "category": "paper_and_cloth",
      "description": "古布は濡れるとリサイクルできないため、雨が降っていたら収集に出さないでください。45リットルまでの袋で出してください。",
      "description_en": "Do not put out old cloth for collection if it is raining, as it cannot be recycled when wet. Use bags up to 45 liters.",
      "examples": [
        "雑誌・雑がみ",
        "新聞",
        "段ボール",
        "紙パック",
        "古布"
      ]
    },
    {
      "name": "危険ごみ",
      "name_en": "Hazardous Waste",
      "category": "hazardous",
      "description": "収集車や施設の火災を防ぐため、必ず危険ごみの日に出してください。",
      "description_en": "Be sure to put it out on hazardous waste day to prevent fires in collection vehicles and facilities.",
      "examples": [
        "リチウムイオン電池などの充電式電池",
        "ライター",
        "スプレー缶"
      ]
    },
    {
      "name": "有害ごみ",
      "name_en": "Harmful Waste",
      "category": "harmful",
      "description": "けい藻土を含む製品は有害ごみです。割れたり欠けているものは袋を二重にして出してね。",
      "description_en": "Products containing diatomaceous earth are harmful waste. Put broken or chipped items in double bags.",
      "examples": [
        "けい藻土を含む製品"
      ]
    },
    {
      "name": "家庭廃食用油",
      "name_en": "Cooking Oil",
      "category": "cooking_oil",
      "description": "各文化センターへ持ち込んでください。",
      "description_en": "Please bring it to each cultural center.",
      "examples": []
    }
  ]
}
```

### 3. スケジュールフォーマット
- 月のキーは **"1", "2", ... "12"** の文字列形式（ゼロパディングなし）
- 各カテゴリーの値は日付の配列（例: [1, 5, 10, 15]）
- サポートするカテゴリー:
  - `burnable`: 燃やすごみ
  - `nonBurnable`: 燃やさないごみ
  - `plastics`: 容器包装プラスチック
  - `pet_bottles`: ペットボトル
  - `bottles`: びん
  - `cans`: かん
  - `paper_and_cloth`: 古紙・古布
  - `hazardous`: 危険ごみ
  - `harmful`: 有害ごみ
  - `cooking_oil`: 家庭廃食用油

### 4. ID命名規則
- **都道府県ID**: ローマ字小文字（例: "tokyo", "osaka", "kanagawa"）
- **市区町村ID**: ローマ字小文字_アンダースコア区切り（例: "fuchu_city", "shibuya_ku", "osaka_city"）
  - 市の場合: `{市名}_city` (例: "fuchu_city")
  - 区の場合: `{区名}_ku` (例: "shibuya_ku")
  - 町・村の場合: `{名前}_town` または `{名前}_village`
- **地域ID**: 意味のある短い識別子（例: "fuchu_1_2", "area_central"）

### 5. 多言語対応フィールド
- **日本語**: `name`, `prefecture`, `description`
- **英語**: `name_en`, `prefecture_en`, `description_en`
- 将来的に他言語を追加する場合: `name_zh` (中国語), `name_ko` (韓国語) など

### 6. 市区町村のタイプ
- `type` フィールドで市区町村の種類を指定:
  - `"city"`: 市
  - `"ward"`: 区（東京23区など）
  - `"town"`: 町
  - `"village"`: 村

### 7. 東京都の特別処理
- 東京23区の場合は、`type: "ward"` を設定
- 東京都の市（八王子市、町田市など）の場合は、`type: "city"` を設定

## 変換指示

以下の手順で既存データを変換してください：

1. **地域名から都道府県と市区町村を特定**
   - 地域名に含まれる住所情報から都道府県名と市区町村名を抽出
   - 例: "府中町1丁目" → 東京都府中市

2. **スケジュールデータの形式変換**
   - 月のキーを "2025-04" 形式から "4" 形式に変換
   - または既に月番号形式の場合はそのまま使用

3. **ID生成**
   - 都道府県名、市区町村名、地域名からそれぞれのIDを生成
   - IDは英数字とアンダースコアのみ使用

4. **階層構造の構築**
   - municipalities → cities → areas の階層を作成
   - 同じ都道府県・市区町村の地域は同じグループにまとめる

5. **多言語対応**
   - 日本語フィールドは必須
   - 英語フィールドは可能な限り翻訳を付与

## 入力データ例

```json
{
  "areas": [
    {
      "name": "府中町1丁目・2丁目/宮西町/宮町",
      "name_en": "Fuchucho 1-chome/2-chome, Miyanishicho, Miyacho",
      "monthlySchedules": [
        {
          "month": "2025-04",
          "schedule": {
            "burnable": [2, 4, 9, 11, 16, 18, 23, 25, 30],
            ...
          }
        }
      ]
    }
  ],
  "garbageItems": [...]
}
```

## 変換時の注意事項

1. **データの完全性**: すべての地域、すべての月のデータを漏れなく変換
2. **IDの一貫性**: 同じ市区町村には必ず同じIDを使用
3. **スケジュールの正確性**: 日付データを正確に変換（数値の配列として）
4. **多言語の整合性**: 日本語と英語で同じ内容を表現

## 出力形式

- UTF-8エンコーディングのJSONファイル
- インデント: 2スペース
- 改行コード: LF
- ファイル名: `garbage_schedule_hierarchical.json`

## 質問があれば

データ変換中に不明な点があれば、以下を確認してください：
- 地域名から市区町村が特定できない場合は、追加情報を提供してください
- スケジュールデータに欠損がある場合は、その旨を報告してください
- 多言語翻訳が不適切な場合は、修正案を提案してください


