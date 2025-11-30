import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import i18n from '../i18n/i18n';

/**
 * スケジュールデータを正規化
 * "2025-04" 形式と "1" 形式の両方に対応
 * @param {Object} schedule - 元のスケジュールデータ
 * @returns {Object} 正規化されたスケジュールデータ（月番号のみをキーとする）
 */
const normalizeSchedule = (schedule) => {
  if (!schedule || typeof schedule !== 'object') {
    return {};
  }

  const normalized = {};
  
  Object.keys(schedule).forEach(key => {
    let month;
    
    // "2025-04" 形式の場合、月部分を抽出
    if (key.includes('-')) {
      const parts = key.split('-');
      month = String(parseInt(parts[1], 10)); // "04" -> "4"
    } else {
      // すでに月番号形式の場合
      month = String(parseInt(key, 10)); // "01" -> "1", "1" -> "1"
    }
    
    normalized[month] = schedule[key];
  });
  
  return normalized;
};

/**
 * 都道府県の市区町村一覧を取得（多言語対応）
 * @param {string} municipalityId - 都道府県ID
 * @returns {Promise<Array>} 市区町村の配列
 */
export const fetchCities = async (municipalityId) => {
  try {
    const citiesSnapshot = await getDocs(
      collection(db, 'municipalities', municipalityId, 'cities')
    );
    const currentLang = i18n.language || 'ja';

    const citiesMap = new Map();
    
    citiesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // 多言語対応: 現在の言語に応じたフィールドを使用、なければ日本語
      const name = currentLang === 'ja' 
        ? (data.name || data.name_ja)
        : (data[`name_${currentLang}`] || data.name_ja || data.name);
      
      // 重複する名前がある場合、すべてのcityIdを配列で保持
      if (!citiesMap.has(name)) {
        citiesMap.set(name, {
          ids: [doc.id], // 複数のIDを配列で保持
        name: name,
          type: data.type || 'city'
        });
      } else {
        // 同じ名前のcityがある場合、IDを追加
        const existingCity = citiesMap.get(name);
        existingCity.ids.push(doc.id);
      }
    });

    // idsを単一のidに変換（後方互換性のため、最初のIDを使用）
    return Array.from(citiesMap.values()).map(city => ({
      id: city.ids[0], // 表示用には最初のIDを使用
      ids: city.ids,    // すべてのIDを保持
      name: city.name,
      type: city.type
    }));
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};

/**
 * 市区町村のエリア一覧を取得（多言語対応）
 * @param {string} municipalityId - 都道府県ID
 * @param {string} cityId - 市区町村ID または cityオブジェクト（idsプロパティを持つ）
 * @returns {Promise<Array>} エリアの配列
 */
export const fetchAreas = async (municipalityId, cityId) => {
  try {
    const currentLang = i18n.language || 'ja';
    let allAreas = [];

    // cityIdが配列の場合は、すべてのIDからエリアを取得
    const cityIds = Array.isArray(cityId) ? cityId : [cityId];

    // 各cityIdからエリアを取得してマージ
    for (const id of cityIds) {
      const areasSnapshot = await getDocs(
        collection(db, 'municipalities', municipalityId, 'cities', id, 'areas')
      );

      const areas = areasSnapshot.docs.map(doc => {
      const data = doc.data();
      // 多言語対応: 現在の言語に応じたフィールドを使用、なければ日本語
      const name = currentLang === 'ja' 
        ? (data.name || data.name_ja)
        : (data[`name_${currentLang}`] || data.name_ja || data.name);
      
      return {
        id: doc.id,
          cityId: id, // どのcityIdから取得したかを保持
        name: name,
        schedule: normalizeSchedule(data.schedule)
      };
    });

      allAreas = allAreas.concat(areas);
    }

    // エリア名でソート（五十音順）
    return allAreas.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  } catch (error) {
    console.error('Error fetching areas:', error);
    throw error;
  }
};

/**
 * エリアIDから収集スケジュールを取得（多言語対応）
 * @param {string} municipalityId - 都道府県ID
 * @param {string} cityId - 市区町村ID（エリアが所属する実際のcityId）
 * @param {string} areaId - エリアID
 * @returns {Promise<Object>} 収集スケジュール
 */
export const fetchAreaSchedule = async (municipalityId, cityId, areaId) => {
  try {
    const areaDoc = await getDoc(doc(db, 'municipalities', municipalityId, 'cities', cityId, 'areas', areaId));
    if (!areaDoc.exists()) {
      throw new Error('エリアが見つかりません');
    }

    const data = areaDoc.data();
    const currentLang = i18n.language || 'ja';
    
    // 多言語対応: 現在の言語に応じたフィールドを使用、なければ日本語
    const name = currentLang === 'ja'
      ? (data.name || data.name_ja)
      : (data[`name_${currentLang}`] || data.name_ja || data.name);

    return {
      name: name,
      schedule: normalizeSchedule(data.schedule)
    };
  } catch (error) {
    console.error('Error fetching area schedule:', error);
    throw error;
  }
};

/**
 * 都道府県のごみ収集スケジュールを取得（旧バージョン互換性のため）
 * @param {string} municipalityId - 都道府県ID
 * @returns {Promise<Object>} 地域別の収集スケジュール
 */
export const fetchGarbageSchedule = async (municipalityId) => {
  try {
    // 都道府県情報を取得
    const municipalityDoc = await getDoc(doc(db, 'municipalities', municipalityId));
    if (!municipalityDoc.exists()) {
      throw new Error('都道府県が見つかりません');
    }

    const prefecture = municipalityDoc.data().prefecture;

    // 市区町村データを取得
    const citiesSnapshot = await getDocs(
      collection(db, 'municipalities', municipalityId, 'cities')
    );

    const areas = {};
    
    // 各市区町村の地域データを取得
    for (const cityDoc of citiesSnapshot.docs) {
      const areasSnapshot = await getDocs(
        collection(db, 'municipalities', municipalityId, 'cities', cityDoc.id, 'areas')
      );
      
      areasSnapshot.docs.forEach(areaDoc => {
        const data = areaDoc.data();
        // スケジュールデータを正規化して保存
        areas[data.name] = normalizeSchedule(data.schedule);
      });
    }

    return {
      [prefecture]: {
        areas: areas
      }
    };
  } catch (error) {
    console.error('Error fetching garbage schedule:', error);
    throw error;
  }
};

/**
 * ごみ分別情報を取得（エリアごと、多言語対応）
 * @param {string} municipalityId - 都道府県ID
 * @param {string} cityId - 市区町村ID（エリアが所属する実際のcityId）
 * @param {string} areaId - エリアID
 * @returns {Promise<Array>} ごみ分別品目の配列
 */
export const fetchGarbageClassification = async (municipalityId, cityId, areaId) => {
  try {
    // エリアのサブコレクションからgarbageItemsを取得
    const garbageItemsSnapshot = await getDocs(
      collection(db, 'municipalities', municipalityId, 'cities', cityId, 'areas', areaId, 'garbageItems')
    );
    const currentLang = i18n.language || 'ja';

    return garbageItemsSnapshot.docs.map((docData, index) => {
      const data = docData.data();
      
      // 多言語フィールドが存在する場合は現在の言語に応じたフィールドを使用
      // フォールバックとして日本語フィールドまたは単一フィールドを使用
      const name = data[`name_${currentLang}`] || data.name_ja || data.name || '';
      const description = data[`description_${currentLang}`] || data.description_ja || data.description || '';
      const examples = data[`examples_${currentLang}`] || data.examples_ja || data.examples || [];

      return {
        id: docData.id,
        name,
        description,
        examples,
        category: data.category,
        // 元のデータも保持（検索用など）
        originalData: data
      };
    });
  } catch (error) {
    console.error('Error fetching garbage classification:', error);
    throw error;
  }
};

/**
 * すべての都道府県を取得（多言語対応）
 * @returns {Promise<Array>} 都道府県の配列
 */
export const fetchMunicipalities = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'municipalities'));
    const currentLang = i18n.language || 'ja';
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // 多言語対応: 現在の言語に応じたフィールドを使用、なければ日本語
      const prefecture = currentLang === 'ja'
        ? (data.prefecture || data.prefecture_ja)
        : (data[`prefecture_${currentLang}`] || data.prefecture_ja || data.prefecture);
      
      return {
        id: doc.id,
        prefecture: prefecture
      };
    });
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    throw error;
  }
};

/**
 * 都道府県IDで都道府県名を取得（多言語対応）
 * @param {string} municipalityId - 都道府県ID
 * @returns {Promise<string>} 都道府県名
 */
export const getMunicipalityName = async (municipalityId) => {
  try {
    const municipalityDoc = await getDoc(doc(db, 'municipalities', municipalityId));
    if (municipalityDoc.exists()) {
      const data = municipalityDoc.data();
      const currentLang = i18n.language || 'ja';
      
      // 多言語対応: 現在の言語に応じたフィールドを使用、なければ日本語
      const prefecture = currentLang === 'ja'
        ? (data.prefecture || data.prefecture_ja)
        : (data[`prefecture_${currentLang}`] || data.prefecture_ja || data.prefecture);
      
      return prefecture;
    }
    return null;
  } catch (error) {
    console.error('Error fetching municipality prefecture:', error);
    throw error;
  }
};

