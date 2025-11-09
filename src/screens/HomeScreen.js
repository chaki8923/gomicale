import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categoryConfig } from '../data/dataFormat';
import { fetchMunicipalities, fetchCities, fetchAreas, fetchAreaSchedule } from '../data/garbageData';
import { saveLanguage } from '../i18n/i18n';

// 人口順の都道府県リスト（上位から）
const PREFECTURE_ORDER = [
  '東京都', '神奈川県', '大阪府', '愛知県', '埼玉県', '千葉県', '兵庫県', '北海道',
  '福岡県', '静岡県', '茨城県', '広島県', '京都府', '宮城県', '新潟県', '長野県',
  '岐阜県', '群馬県', '栃木県', '岡山県', '三重県', '熊本県', '鹿児島県', '沖縄県',
  '滋賀県', '山口県', '愛媛県', '奈良県', '長崎県', '青森県', '岩手県', '大分県',
  '石川県', '山形県', '宮崎県', '富山県', '秋田県', '和歌山県', '香川県', '山梨県',
  '佐賀県', '福井県', '徳島県', '高知県', '島根県', '鳥取県'
];

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedAreaName, setSelectedAreaName] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedCityName, setSelectedCityName] = useState(null);
  const [selectedPrefectureId, setSelectedPrefectureId] = useState(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState(null);
  const [prefectures, setPrefectures] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areaSchedule, setAreaSchedule] = useState(null);
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [prefectureModalVisible, setPrefectureModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prefectureSearchQuery, setPrefectureSearchQuery] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [areaSearchQuery, setAreaSearchQuery] = useState('');

  // 画面にフォーカスが当たるたびにデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (selectedAreaId && areaSchedule) {
      updateTodaySchedule();
    }
  }, [selectedAreaId, areaSchedule]);

  const sortPrefectures = (prefecturesList) => {
    return prefecturesList.sort((a, b) => {
      const indexA = PREFECTURE_ORDER.indexOf(a.prefecture);
      const indexB = PREFECTURE_ORDER.indexOf(b.prefecture);
      
      // 両方がリストにある場合、リスト順
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // Aのみリストにある場合、Aを先に
      if (indexA !== -1) return -1;
      // Bのみリストにある場合、Bを先に
      if (indexB !== -1) return 1;
      // 両方リストにない場合、五十音順
      return a.prefecture.localeCompare(b.prefecture, 'ja');
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 都道府県一覧を取得してソート
      const prefecturesList = await fetchMunicipalities();
      const sortedPrefectures = sortPrefectures(prefecturesList);
      setPrefectures(sortedPrefectures);

      // 保存されている都道府県ID、市区町村ID、エリアIDを読み込み
      const savedPrefectureId = await AsyncStorage.getItem('selectedPrefectureId');
      const savedCityId = await AsyncStorage.getItem('selectedCityId');
      const savedCityName = await AsyncStorage.getItem('selectedCityName');
      const savedAreaId = await AsyncStorage.getItem('selectedAreaId');
      const savedAreaName = await AsyncStorage.getItem('selectedAreaName');

      if (savedPrefectureId && prefecturesList.length > 0) {
        const prefecture = prefecturesList.find(p => p.id === savedPrefectureId);
        if (prefecture) {
          setSelectedPrefectureId(savedPrefectureId);
          setSelectedPrefecture(prefecture.prefecture);
          await loadPrefectureData(savedPrefectureId, savedCityId, savedCityName, savedAreaId, savedAreaName);
        } else {
          // 保存された都道府県が見つからない場合、選択を促す
          setPrefectureModalVisible(true);
        }
      } else if (prefecturesList.length > 0) {
        // 都道府県選択を促す
        setPrefectureModalVisible(true);
      }
    } catch (error) {
      console.error('データの読み込みエラー:', error);
      alert(t('home.dataLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadPrefectureData = async (prefectureId, savedCityId = null, savedCityName = null, savedAreaId = null, savedAreaName = null) => {
    try {
      // 市区町村一覧を取得
      const citiesList = await fetchCities(prefectureId);
      setCities(citiesList);

      if (savedCityId) {
        const city = citiesList.find(c => c.id === savedCityId);
        if (city) {
          setSelectedCityId(savedCityId);
          setSelectedCityName(city.name);
          // cityオブジェクト全体を渡す（idsプロパティを含む）
          await loadCityData(prefectureId, city, savedAreaId, savedAreaName);
        } else {
          setCityModalVisible(true);
        }
      } else if (citiesList.length > 0) {
        setCityModalVisible(true);
      }
    } catch (error) {
      console.error('都道府県データの読み込みエラー:', error);
    }
  };

  const loadCityData = async (prefectureId, cityId, savedAreaId = null, savedAreaName = null) => {
    try {
      // cityIdまたはcityオブジェクトからIDを取得
      // cityオブジェクトの場合、idsプロパティがあれば複数のIDを使用
      let cityIds;
      if (typeof cityId === 'object' && cityId.ids) {
        cityIds = cityId.ids;
      } else if (typeof cityId === 'string') {
        cityIds = [cityId];
      } else {
        cityIds = [cityId];
      }

      // エリア一覧を取得（複数のcityIdから）
      const areasList = await fetchAreas(prefectureId, cityIds);
      setAreas(areasList);

      if (savedAreaId) {
        const area = areasList.find(a => a.id === savedAreaId);
        if (area) {
          setSelectedAreaId(savedAreaId);
          setSelectedAreaName(area.name);
          setAreaSchedule(area.schedule);
        } else {
          setAreaModalVisible(true);
        }
      } else if (areasList.length > 0) {
        setAreaModalVisible(true);
      }
    } catch (error) {
      console.error('市区町村データの読み込みエラー:', error);
    }
  };

  const selectPrefecture = async (prefecture) => {
    try {
      setSelectedPrefectureId(prefecture.id);
      setSelectedPrefecture(prefecture.prefecture);
      await AsyncStorage.setItem('selectedPrefectureId', prefecture.id);
      
      // 以前の市区町村とエリア選択をクリア
      setSelectedCityId(null);
      setSelectedCityName(null);
      setSelectedAreaId(null);
      setSelectedAreaName(null);
      await AsyncStorage.removeItem('selectedCityId');
      await AsyncStorage.removeItem('selectedCityName');
      await AsyncStorage.removeItem('selectedAreaId');
      await AsyncStorage.removeItem('selectedAreaName');
      
      await loadPrefectureData(prefecture.id);
      setPrefectureModalVisible(false);
      setCityModalVisible(true);
    } catch (error) {
      console.error('都道府県の選択エラー:', error);
    }
  };

  const selectCity = async (city) => {
    try {
      setSelectedCityId(city.id);
      setSelectedCityName(city.name);
      await AsyncStorage.setItem('selectedCityId', city.id);
      await AsyncStorage.setItem('selectedCityName', city.name);
      // 複数のIDがある場合は保存
      if (city.ids && city.ids.length > 1) {
        await AsyncStorage.setItem('selectedCityIds', JSON.stringify(city.ids));
      }
      
      // 以前のエリア選択をクリア
      setSelectedAreaId(null);
      setSelectedAreaName(null);
      await AsyncStorage.removeItem('selectedAreaId');
      await AsyncStorage.removeItem('selectedAreaName');
      
      // cityオブジェクト全体を渡す（idsプロパティを含む）
      await loadCityData(selectedPrefectureId, city);
      setCityModalVisible(false);
      setAreaModalVisible(true);
    } catch (error) {
      console.error('市区町村の選択エラー:', error);
    }
  };

  const selectArea = async (area) => {
    try {
      await AsyncStorage.setItem('selectedAreaId', area.id);
      await AsyncStorage.setItem('selectedAreaName', area.name);
      await AsyncStorage.setItem('selectedCityId', selectedCityId);
      await AsyncStorage.setItem('selectedPrefectureId', selectedPrefectureId);
      // エリアが属するcityIdも保存（後でスケジュール取得に必要）
      if (area.cityId) {
        await AsyncStorage.setItem('selectedAreaCityId', area.cityId);
      }
      
      setSelectedAreaId(area.id);
      setSelectedAreaName(area.name);
      setAreaSchedule(area.schedule);
      setAreaModalVisible(false);
    } catch (error) {
      console.error('エリアの保存エラー:', error);
    }
  };

  const changeLocation = () => {
    setPrefectureModalVisible(true);
  };

  const changeLanguage = async (lang) => {
    try {
      await i18n.changeLanguage(lang);
      await saveLanguage(lang);
      setLanguageModalVisible(false);
      // データを再読み込みして言語変更を反映
      loadData();
    } catch (error) {
      console.error('言語変更エラー:', error);
    }
  };

  const openRequestForm = async () => {
    const url = 'https://forms.gle/Fhe7bpjwjBkoiJYy5';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          t('home.requestAreaAddition'),
          'フォームを開けませんでした',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('リンクを開くエラー:', error);
      Alert.alert(
        t('home.requestAreaAddition'),
        'フォームを開けませんでした',
        [{ text: 'OK' }]
      );
    }
  };

  const updateTodaySchedule = () => {
    if (!areaSchedule) {
      setTodaySchedule([]);
      return;
    }

    try {
      const today = new Date();
      const month = today.getMonth() + 1; // 1-12
      const day = today.getDate(); // 1-31
      
      const todayGarbage = [];
      const monthKey = String(month);
      const monthSchedule = areaSchedule[monthKey];
      
      if (monthSchedule && typeof monthSchedule === 'object') {
        Object.keys(monthSchedule).forEach((category) => {
          const days = monthSchedule[category];
          if (Array.isArray(days) && days.includes(day)) {
            // categoryConfigに存在するカテゴリーのみ追加
            if (categoryConfig[category]) {
              todayGarbage.push({
                category,
                ...categoryConfig[category],
              });
            }
          }
        });
      }

      setTodaySchedule(todayGarbage);
    } catch (error) {
      console.error('今日のスケジュール更新エラー:', error);
      setTodaySchedule([]);
    }
  };

  const getNextSchedule = () => {
    if (!selectedAreaId || !areaSchedule) return [];
    
    try {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const nextScheduleMap = new Map();

      // 今月から数ヶ月先までチェック
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const checkDate = new Date(currentYear, currentMonth - 1 + monthOffset, 1);
        const checkMonth = checkDate.getMonth() + 1;
        const monthKey = String(checkMonth);
        const monthSchedule = areaSchedule[monthKey];
        
        if (!monthSchedule || typeof monthSchedule !== 'object') continue;

        Object.keys(monthSchedule).forEach((category) => {
          if (!categoryConfig[category]) return;
          
          const days = monthSchedule[category];
          if (!Array.isArray(days) || days.length === 0) return;

          // 今月の場合は今日以降の日付のみ
          const validDays = monthOffset === 0 
            ? days.filter(day => day > currentDay)
            : days;

          if (validDays.length > 0) {
            const nextDay = validDays[0];
            const nextDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), nextDay);
            const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
            
            // まだ登録されていないか、より早い日付の場合のみ追加
            if (!nextScheduleMap.has(category) || nextScheduleMap.get(category).daysUntil > daysUntil) {
              nextScheduleMap.set(category, {
                category,
                daysUntil,
                date: nextDate,
                dayName: ['日', '月', '火', '水', '木', '金', '土'][nextDate.getDay()],
                ...categoryConfig[category],
              });
            }
          }
        });
      }

      return Array.from(nextScheduleMap.values()).sort((a, b) => a.daysUntil - b.daysUntil);
    } catch (error) {
      console.error('次回スケジュール取得エラー:', error);
      return [];
    }
  };

  const getWeekdayName = (dayIndex) => {
    const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return t(`weekdays.${weekdays[dayIndex]}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>{t('home.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('app.title')}</Text>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Text style={styles.languageButtonText}>
              🌐 {i18n.language.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.municipalityButton}
          onPress={changeLocation}
        >
          <Text style={styles.municipalityButtonText}>
            📍 {selectedPrefecture || t('home.selectPrefecture')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cityButton}
          onPress={() => selectedPrefectureId ? setCityModalVisible(true) : changeLocation()}
        >
          <Text style={styles.cityButtonText}>
            🏙️ {selectedCityName || t('home.selectCity')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.areaButton}
          onPress={() => selectedCityId ? setAreaModalVisible(true) : (selectedPrefectureId ? setCityModalVisible(true) : changeLocation())}
        >
          <Text style={styles.areaButtonText}>
            🏘️ {selectedAreaName || t('home.selectArea')}
          </Text>
        </TouchableOpacity>
      </View>

      {todaySchedule.length > 0 ? (
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>{t('home.todayCollection')}</Text>
          {todaySchedule.map((item, index) => (
            <View
              key={index}
              style={[styles.card, { borderLeftColor: item.color }]}
            >
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <Text style={styles.cardTitle}>{item.name}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>{t('home.todayCollection')}</Text>
          <Text style={styles.noSchedule}>{t('home.noCollection')}</Text>
        </View>
      )}

      <View style={styles.nextSection}>
        <Text style={styles.sectionTitle}>{t('home.nextCollection')}</Text>
        {getNextSchedule().map((item, index) => (
          <View
            key={index}
            style={[styles.card, { borderLeftColor: item.color }]}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>
                {item.daysUntil === 0
                  ? t('home.today')
                  : item.daysUntil === 1
                  ? t('home.tomorrow')
                  : t('home.daysLater', { days: item.daysUntil, dayName: getWeekdayName(item.date.getDay()) })}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* 都道府県選択モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={prefectureModalVisible}
        onRequestClose={() => {
          setPrefectureModalVisible(false);
          setPrefectureSearchQuery('');
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setPrefectureModalVisible(false);
          setPrefectureSearchQuery('');
        }}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t('home.selectPrefectureTitle')}</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('home.searchPrefecture')}
                  value={prefectureSearchQuery}
                  onChangeText={setPrefectureSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <ScrollView style={styles.modalScrollView}>
                  {prefectures.length === 0 ? (
                    <Text style={styles.noDataText}>
                      {t('home.noPrefectureData')}
                    </Text>
                  ) : (
                    prefectures
                      .filter(prefecture => 
                        prefecture.prefecture.toLowerCase().includes(prefectureSearchQuery.toLowerCase())
                      )
                      .map((prefecture, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.modalButton}
                          onPress={() => {
                            selectPrefecture(prefecture);
                            setPrefectureSearchQuery('');
                          }}
                        >
                          <Text style={styles.modalButtonText}>
                            {prefecture.prefecture}
                          </Text>
                        </TouchableOpacity>
                      ))
                  )}
                </ScrollView>
                {selectedPrefectureId && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => {
                      setPrefectureModalVisible(false);
                      setPrefectureSearchQuery('');
                    }}
                  >
                    <Text style={styles.modalCancelText}>{t('home.cancel')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 市区町村選択モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cityModalVisible}
        onRequestClose={() => {
          setCityModalVisible(false);
          setCitySearchQuery('');
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setCityModalVisible(false);
          setCitySearchQuery('');
        }}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t('home.selectCityTitle')}</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('home.searchCity')}
                  value={citySearchQuery}
                  onChangeText={setCitySearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <ScrollView style={styles.modalScrollView}>
                  {cities.length === 0 ? (
                    <Text style={styles.noDataText}>
                      {t('home.noCityData')}
                    </Text>
                  ) : (
                    cities
                      .filter(city => 
                        city.name.toLowerCase().includes(citySearchQuery.toLowerCase())
                      )
                      .map((city, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.modalButton}
                          onPress={() => {
                            selectCity(city);
                            setCitySearchQuery('');
                          }}
                        >
                          <Text style={styles.modalButtonText}>
                            {city.name}
                          </Text>
                        </TouchableOpacity>
                      ))
                  )}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setCityModalVisible(false);
                    setCitySearchQuery('');
                  }}
                >
                  <Text style={styles.modalCancelText}>{t('home.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* エリア選択モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={areaModalVisible}
        onRequestClose={() => {
          setAreaModalVisible(false);
          setAreaSearchQuery('');
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setAreaModalVisible(false);
          setAreaSearchQuery('');
        }}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t('home.selectAreaTitle')}</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('home.searchArea')}
                  value={areaSearchQuery}
                  onChangeText={setAreaSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <ScrollView style={styles.modalScrollView}>
                  {areas.length === 0 ? (
                    <Text style={styles.noDataText}>
                      {t('home.noAreaData')}
                    </Text>
                  ) : (
                    areas
                      .filter(area => 
                        area.name.toLowerCase().includes(areaSearchQuery.toLowerCase())
                      )
                      .map((area, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.modalButton}
                          onPress={() => {
                            selectArea(area);
                            setAreaSearchQuery('');
                          }}
                        >
                          <Text style={styles.modalButtonText}>{area.name}</Text>
                        </TouchableOpacity>
                      ))
                  )}
                </ScrollView>
                <View style={styles.requestAreaContainer}>
                  <Text style={styles.requestAreaText}>{t('home.requestAreaAddition')}</Text>
                  <Text style={styles.requestAreaNote}>✨ {t('home.requestAreaAdditionNote')}</Text>
                  <TouchableOpacity
                    style={styles.requestAreaButton}
                    onPress={openRequestForm}
                  >
                    <Text style={styles.requestAreaButtonText}>{t('home.requestAreaButton')}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setAreaModalVisible(false);
                    setAreaSearchQuery('');
                  }}
                >
                  <Text style={styles.modalCancelText}>{t('home.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 言語選択モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => changeLanguage('ja')}
            >
              <Text style={styles.modalButtonText}>{t('settings.japanese')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => changeLanguage('en')}
            >
              <Text style={styles.modalButtonText}>{t('settings.english')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t('home.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7F8C8D',
  },
  noDataText: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  languageButton: {
    backgroundColor: '#95A5A6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  languageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  municipalityButton: {
    backgroundColor: '#5F9EA0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  municipalityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cityButton: {
    backgroundColor: '#48B3A4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  cityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  areaButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  areaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  todaySection: {
    padding: 20,
  },
  nextSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  noSchedule: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
    paddingVertical: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '80%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#E1E8ED',
    marginTop: 10,
  },
  modalCancelText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  requestAreaContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD93D',
  },
  requestAreaText: {
    fontSize: 13,
    color: '#856404',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  requestAreaNote: {
    fontSize: 12,
    color: '#28a745',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  requestAreaButton: {
    backgroundColor: '#FFD93D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestAreaButtonText: {
    color: '#2C3E50',
    fontSize: 14,
    fontWeight: '600',
  },
});
