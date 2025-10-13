import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * 市町村のごみ収集スケジュールを取得
 * @param {string} municipalityId - 市町村ID
 * @returns {Promise<Object>} 地域別の収集スケジュール
 */
export const fetchGarbageSchedule = async (municipalityId) => {
  try {
    // 市町村情報を取得
    const municipalityDoc = await getDoc(doc(db, 'municipalities', municipalityId));
    if (!municipalityDoc.exists()) {
      throw new Error('市町村が見つかりません');
    }

    const municipalityName = municipalityDoc.data().name;

    // 地域データを取得
    const areasSnapshot = await getDocs(
      collection(db, 'municipalities', municipalityId, 'areas')
    );

    const areas = {};
    areasSnapshot.docs.forEach(doc => {
      const data = doc.data();
      areas[data.name] = data.schedule;
    });

    return {
      [municipalityName]: {
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
 * すべての市町村を取得
 * @returns {Promise<Array>} 市町村の配列
 */
export const fetchMunicipalities = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'municipalities'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    throw error;
  }
};

/**
 * 市町村IDで市町村名を取得
 * @param {string} municipalityId - 市町村ID
 * @returns {Promise<string>} 市町村名
 */
export const getMunicipalityName = async (municipalityId) => {
  try {
    const municipalityDoc = await getDoc(doc(db, 'municipalities', municipalityId));
    if (municipalityDoc.exists()) {
      return municipalityDoc.data().name;
    }
    return null;
  } catch (error) {
    console.error('Error fetching municipality name:', error);
    throw error;
  }
};

