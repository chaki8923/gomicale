import i18n from '../i18n/i18n';

// サンプルデータ: 東京都渋谷区のごみ収集スケジュール
export const garbageSchedule = {
  '渋谷区': {
    // 地域別の収集曜日
    areas: {
      '渋谷1丁目': {
        burnable: [1, 4], // 月曜日と木曜日（0:日曜日, 1:月曜日, ...）
        nonBurnable: [3], // 水曜日
        recyclable: [2], // 火曜日
        bottles: [5], // 金曜日（第1・第3金曜日）
      },
      '恵比寿': {
        burnable: [2, 5], // 火曜日と金曜日
        nonBurnable: [4], // 木曜日
        recyclable: [1], // 月曜日
        bottles: [3], // 水曜日（第2・第4水曜日）
      },
      '代々木': {
        burnable: [1, 4], // 月曜日と木曜日
        nonBurnable: [2], // 火曜日
        recyclable: [5], // 金曜日
        bottles: [3], // 水曜日（第1・第3水曜日）
      },
    },
  },
};

// ごみの分別検索データ
export const garbageClassification = [
  {
    id: 1,
    name: 'ペットボトル',
    category: 'recyclable',
    description: 'キャップとラベルを外して、中をすすいでから出してください',
    examples: ['飲料用ペットボトル', '調味料のペットボトル'],
  },
  {
    id: 2,
    name: '新聞・雑誌',
    category: 'recyclable',
    description: 'ひもでしばって出してください',
    examples: ['新聞', '雑誌', 'チラシ', '段ボール'],
  },
  {
    id: 3,
    name: '缶',
    category: 'recyclable',
    description: '中をすすいで出してください',
    examples: ['飲料缶', '缶詰の缶'],
  },
  {
    id: 4,
    name: 'びん',
    category: 'bottles',
    description: 'キャップを外して、中をすすいでから出してください',
    examples: ['飲料びん', '調味料のびん'],
  },
  {
    id: 5,
    name: '生ごみ',
    category: 'burnable',
    description: '水分をよく切って出してください',
    examples: ['野菜くず', '果物の皮', '魚の骨'],
  },
  {
    id: 6,
    name: 'プラスチック製品',
    category: 'nonBurnable',
    description: '燃やせないプラスチック製品',
    examples: ['バケツ', '洗面器', 'プラスチック製おもちゃ'],
  },
  {
    id: 7,
    name: '電池',
    category: 'nonBurnable',
    description: '乾電池は区の回収ボックスへ。充電池は販売店の回収ボックスへ',
    examples: ['乾電池', 'ボタン電池'],
  },
  {
    id: 8,
    name: '紙パック',
    category: 'recyclable',
    description: '開いて洗って乾かしてから出してください',
    examples: ['牛乳パック', 'ジュースのパック'],
  },
  {
    id: 9,
    name: '衣類',
    category: 'recyclable',
    description: '洗濯してきれいなものを透明な袋に入れて出してください',
    examples: ['洋服', 'タオル', 'シーツ'],
  },
  {
    id: 10,
    name: '小型家電',
    category: 'nonBurnable',
    description: '30cm未満の小型家電は不燃ごみへ',
    examples: ['ドライヤー', '電卓', '小型扇風機'],
  },
];

// ごみカテゴリーの設定（多言語対応）
export const categoryConfig = {
  burnable: {
    get name() {
      return i18n.t('categories.burnable');
    },
    color: '#FF6B6B',
    icon: '🔥',
  },
  nonBurnable: {
    get name() {
      return i18n.t('categories.nonBurnable');
    },
    color: '#4ECDC4',
    icon: '🚫',
  },
  recyclable: {
    get name() {
      return i18n.t('categories.recyclable');
    },
    color: '#45B7D1',
    icon: '♻️',
  },
  bottles: {
    get name() {
      return i18n.t('categories.bottles');
    },
    color: '#96CEB4',
    icon: '🍶',
  },
  cans: {
    get name() {
      return i18n.t('categories.cans');
    },
    color: '#95E1D3',
    icon: '🥫',
  },
  plastics: {
    get name() {
      return i18n.t('categories.plastics');
    },
    color: '#F38181',
    icon: '📦',
  },
  pet_bottles: {
    get name() {
      return i18n.t('categories.pet_bottles');
    },
    color: '#AA96DA',
    icon: '🧴',
  },
  paper_and_cloth: {
    get name() {
      return i18n.t('categories.paper_and_cloth');
    },
    color: '#FCBAD3',
    icon: '📰',
  },
  hazardous_and_dangerous: {
    get name() {
      return i18n.t('categories.hazardous_and_dangerous');
    },
    color: '#FF8C42',
    icon: '⚠️',
  },
  cooking_oil: {
    get name() {
      return i18n.t('categories.cooking_oil');
    },
    color: '#FFD93D',
    icon: '🛢️',
  },
  bottles_and_cans: {
    get name() {
      return i18n.t('categories.bottles_and_cans');
    },
    color: '#7FCDCD',
    icon: '♻️',
  },
  resources: {
    get name() {
      return i18n.t('categories.resources');
    },
    color: '#6BCF7F',
    icon: '📦',
  },
  metal_pottery_glass: {
    get name() {
      return i18n.t('categories.metal_pottery_glass');
    },
    color: '#8B9DC3',
    icon: '🍶',
  },
};
