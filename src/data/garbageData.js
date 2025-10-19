import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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
 * 都道府県のエリア一覧を取得
 * @param {string} municipalityId - 都道府県ID
 * @returns {Promise<Array>} エリアの配列
 */
export const fetchAreas = async (municipalityId) => {
  try {
    const areasSnapshot = await getDocs(
      collection(db, 'municipalities', municipalityId, 'areas')
    );

    return areasSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      schedule: normalizeSchedule(doc.data().schedule)
    }));
  } catch (error) {
    console.error('Error fetching areas:', error);
    throw error;
  }
};

/**
 * エリアIDから収集スケジュールを取得
 * @param {string} municipalityId - 都道府県ID
 * @param {string} areaId - エリアID
 * @returns {Promise<Object>} 収集スケジュール
 */
export const fetchAreaSchedule = async (municipalityId, areaId) => {
  try {
    const areaDoc = await getDoc(doc(db, 'municipalities', municipalityId, 'areas', areaId));
    if (!areaDoc.exists()) {
      throw new Error('エリアが見つかりません');
    }

    return {
      name: areaDoc.data().name,
      schedule: normalizeSchedule(areaDoc.data().schedule)
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

    // 地域データを取得
    const areasSnapshot = await getDocs(
      collection(db, 'municipalities', municipalityId, 'areas')
    );

    const areas = {};
    areasSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // スケジュールデータを正規化して保存
      areas[data.name] = normalizeSchedule(data.schedule);
    });

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
 * ごみ分別情報を取得
 * @param {string} municipalityId - 市町村ID
 * @returns {Promise<Array>} ごみ分別品目の配列
 */
export const fetchGarbageClassification = async (municipalityId) => {
  try {
    const q = query(
      collection(db, 'garbageItems'),
      where('municipalityId', '==', municipalityId)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc, index) => ({
      id: index + 1,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching garbage classification:', error);
    throw error;
  }
};

/**
 * すべての都道府県を取得
 * @returns {Promise<Array>} 都道府県の配列
 */
export const fetchMunicipalities = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'municipalities'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      prefecture: doc.data().prefecture
    }));
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    throw error;
  }
};

/**
 * 都道府県IDで都道府県名を取得
 * @param {string} municipalityId - 都道府県ID
 * @returns {Promise<string>} 都道府県名
 */
export const getMunicipalityName = async (municipalityId) => {
  try {
    const municipalityDoc = await getDoc(doc(db, 'municipalities', municipalityId));
    if (municipalityDoc.exists()) {
      return municipalityDoc.data().prefecture;
    }
    return null;
  } catch (error) {
    console.error('Error fetching municipality prefecture:', error);
    throw error;
  }
};

