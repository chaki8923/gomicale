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
  Platform,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  const [isMyArea, setIsMyArea] = useState(false);

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
      const savedIsMyArea = await AsyncStorage.getItem('isMyArea');
      setIsMyArea(savedIsMyArea === 'true');

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
      setIsMyArea(false);
      await AsyncStorage.removeItem('selectedCityId');
      await AsyncStorage.removeItem('selectedCityName');
      await AsyncStorage.removeItem('selectedAreaId');
      await AsyncStorage.removeItem('selectedAreaName');
      await AsyncStorage.removeItem('isMyArea');
      
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
      setIsMyArea(false);
      await AsyncStorage.removeItem('selectedAreaId');
      await AsyncStorage.removeItem('selectedAreaName');
      await AsyncStorage.removeItem('isMyArea');
      
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
      
      // エリア変更時はマイエリア登録をリセット
      setIsMyArea(false);
      await AsyncStorage.removeItem('isMyArea');
      
      setSelectedAreaId(area.id);
      setSelectedAreaName(area.name);
      setAreaSchedule(area.schedule);
      setAreaModalVisible(false);
    } catch (error) {
      console.error('エリアの保存エラー:', error);
    }
  };

  const toggleMyArea = async () => {
    try {
      const newIsMyArea = !isMyArea;
      setIsMyArea(newIsMyArea);
      await AsyncStorage.setItem('isMyArea', String(newIsMyArea));
      
      if (newIsMyArea) {
        // マイエリアに登録
        Alert.alert(
          t('home.myAreaRegistered'),
          t('home.myAreaRegisteredMessage'),
          [{ text: 'OK' }]
        );
      } else {
        // マイエリアから解除
        Alert.alert(
          t('home.myAreaRemoved'),
          t('home.myAreaRemovedMessage'),
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('マイエリア登録エラー:', error);
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
        <ActivityIndicator size="large" color="#2089DC" />
        <Text style={styles.loadingText}>{t('home.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('app.title')}</Text>
          </View>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Ionicons name="globe-outline" size={20} color="#555" />
            <Text style={styles.languageButtonText}>
              {i18n.language.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationContainer}>
        <TouchableOpacity
            style={styles.locationButton}
          onPress={changeLocation}
        >
            <Ionicons name="location-outline" size={18} color="#2089DC" />
            <Text style={styles.locationButtonText} numberOfLines={1}>
              {selectedPrefecture || t('home.selectPrefecture')}
          </Text>
            <Ionicons name="chevron-down" size={16} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.locationButton}
          onPress={() => selectedPrefectureId ? setCityModalVisible(true) : changeLocation()}
        >
            <Ionicons name="business-outline" size={18} color="#2089DC" />
            <Text style={styles.locationButtonText} numberOfLines={1}>
              {selectedCityName || t('home.selectCity')}
          </Text>
            <Ionicons name="chevron-down" size={16} color="#999" />
        </TouchableOpacity>
        </View>

        <View style={styles.areaRow}>
          <TouchableOpacity
            style={styles.areaSelectButton}
            onPress={() => selectedCityId ? setAreaModalVisible(true) : (selectedPrefectureId ? setCityModalVisible(true) : changeLocation())}
          >
            <Ionicons name="home-outline" size={20} color="#FFFFFF" />
            <Text style={styles.areaSelectButtonText} numberOfLines={1}>
              {selectedAreaName || t('home.selectArea')}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          
          {selectedAreaId && (
            <TouchableOpacity
              style={[styles.myAreaButton, isMyArea && styles.myAreaButtonActive]}
              onPress={toggleMyArea}
            >
              <Ionicons 
                name={isMyArea ? "star" : "star-outline"} 
                size={22} 
                color={isMyArea ? "#FFD700" : "#FFFFFF"} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
      {todaySchedule.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="today-outline" size={22} color="#2089DC" />
          <Text style={styles.sectionTitle}>{t('home.todayCollection')}</Text>
            </View>
          {todaySchedule.map((item, index) => (
            <View
              key={index}
              style={[styles.card, { borderLeftColor: item.color }]}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                  <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
                </View>
              <Text style={styles.cardTitle}>{item.name}</Text>
            </View>
          ))}
        </View>
      ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="today-outline" size={22} color="#95A5A6" />
              <Text style={[styles.sectionTitle, { color: '#95A5A6' }]}>{t('home.todayCollection')}</Text>
            </View>
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="check-circle-outline" size={48} color="#E0E0E0" />
              <Text style={styles.noScheduleText}>{t('home.noCollection')}</Text>
            </View>
        </View>
      )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={22} color="#2089DC" />
        <Text style={styles.sectionTitle}>{t('home.nextCollection')}</Text>
          </View>
        {getNextSchedule().map((item, index) => (
          <View
            key={index}
            style={[styles.card, { borderLeftColor: item.color }]}
          >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
              </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.dateBadge}>
                  <Ionicons name="time-outline" size={14} color="#7F8C8D" />
              <Text style={styles.cardSubtitle}>
                {item.daysUntil === 0
                  ? t('home.today')
                  : item.daysUntil === 1
                  ? t('home.tomorrow')
                  : t('home.daysLater', { days: item.daysUntil, dayName: getWeekdayName(item.date.getDay()) })}
              </Text>
                </View>
            </View>
          </View>
        ))}
      </View>
      </ScrollView>

      {/* 共通モーダルコンポーネント */}
      {[
        { visible: prefectureModalVisible, close: () => setPrefectureModalVisible(false), title: t('home.selectPrefectureTitle'), data: prefectures, onSelect: selectPrefecture, searchVal: prefectureSearchQuery, setSearch: setPrefectureSearchQuery, placeholder: t('home.searchPrefecture'), displayKey: 'prefecture', noData: t('home.noPrefectureData') },
        { visible: cityModalVisible, close: () => setCityModalVisible(false), title: t('home.selectCityTitle'), data: cities, onSelect: selectCity, searchVal: citySearchQuery, setSearch: setCitySearchQuery, placeholder: t('home.searchCity'), displayKey: 'name', noData: t('home.noCityData') },
        { visible: areaModalVisible, close: () => setAreaModalVisible(false), title: t('home.selectAreaTitle'), data: areas, onSelect: selectArea, searchVal: areaSearchQuery, setSearch: setAreaSearchQuery, placeholder: t('home.searchArea'), displayKey: 'name', noData: t('home.noAreaData'), showRequest: true }
      ].map((modal, idx) => (
      <Modal
          key={idx}
        animationType="slide"
        transparent={true}
          visible={modal.visible}
          onRequestClose={modal.close}
      >
          <TouchableWithoutFeedback onPress={modal.close}>
            <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{modal.title}</Text>
                    <TouchableOpacity onPress={modal.close} style={styles.closeIconButton}>
                      <Ionicons name="close" size={24} color="#555" />
                        </TouchableOpacity>
              </View>
                  
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                      placeholder={modal.placeholder}
                      value={modal.searchVal}
                      onChangeText={modal.setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                      placeholderTextColor="#999"
                    />
              </View>

                  <ScrollView style={styles.modalList} contentContainerStyle={{ paddingBottom: 20 }}>
                    {modal.data.length === 0 ? (
                      <View style={styles.noDataContainer}>
                        <MaterialCommunityIcons name="file-search-outline" size={48} color="#E0E0E0" />
                        <Text style={styles.noDataText}>{modal.noData}</Text>
                      </View>
                  ) : (
                      modal.data
                        .filter(item => 
                          item[modal.displayKey].toLowerCase().includes(modal.searchVal.toLowerCase())
                      )
                        .map((item, index) => (
                        <TouchableOpacity
                          key={index}
                            style={styles.listItem}
                          onPress={() => {
                              modal.onSelect(item);
                              modal.setSearch('');
                          }}
                        >
                            <Text style={styles.listItemText}>{item[modal.displayKey]}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#DDD" />
                        </TouchableOpacity>
                      ))
                  )}
                    
                    {modal.showRequest && (
                <View style={styles.requestAreaContainer}>
                        <View style={styles.requestHeader}>
                          <MaterialCommunityIcons name="map-plus" size={20} color="#2089DC" />
                  <Text style={styles.requestAreaText}>{t('home.requestAreaAddition')}</Text>
                        </View>
                        <Text style={styles.requestAreaNote}>{t('home.requestAreaAdditionNote')}</Text>
                  <TouchableOpacity
                    style={styles.requestAreaButton}
                    onPress={openRequestForm}
                  >
                    <Text style={styles.requestAreaButtonText}>{t('home.requestAreaButton')}</Text>
                          <Ionicons name="open-outline" size={16} color="#FFF" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
                    )}
                  </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      ))}

      {/* 言語選択モーダル */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContainer, { height: 'auto', maxHeight: 300 }]}>
                <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
                  <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={styles.closeIconButton}>
                    <Ionicons name="close" size={24} color="#555" />
                  </TouchableOpacity>
                </View>
                <View style={{ padding: 20 }}>
            <TouchableOpacity
                    style={[styles.languageOption, i18n.language === 'ja' && styles.selectedLanguage]}
              onPress={() => changeLanguage('ja')}
            >
                    <Text style={[styles.languageOptionText, i18n.language === 'ja' && styles.selectedLanguageText]}>
                      {t('settings.japanese')}
                    </Text>
                    {i18n.language === 'ja' && <Ionicons name="checkmark" size={20} color="#2089DC" />}
            </TouchableOpacity>
            <TouchableOpacity
                    style={[styles.languageOption, i18n.language === 'en' && styles.selectedLanguage]}
              onPress={() => changeLanguage('en')}
            >
                    <Text style={[styles.languageOptionText, i18n.language === 'en' && styles.selectedLanguageText]}>
                      {t('settings.english')}
                    </Text>
                    {i18n.language === 'en' && <Ionicons name="checkmark" size={20} color="#2089DC" />}
            </TouchableOpacity>
          </View>
        </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C3E50',
    letterSpacing: 0.5,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  languageButtonText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    padding: 10,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  locationButtonText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 6,
  },
  areaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  areaSelectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2089DC',
    padding: 14,
    borderRadius: 14,
    justifyContent: 'space-between',
    shadowColor: '#2089DC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  myAreaButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F8C8D',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myAreaButtonActive: {
    backgroundColor: '#2089DC',
  },
  areaSelectButtonText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  contentContainer: {
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F2F5',
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    marginLeft: 4,
    fontWeight: '500',
  },
  noScheduleText: {
    fontSize: 15,
    color: '#95A5A6',
    marginTop: 12,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  closeIconButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    margin: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  modalList: {
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noDataText: {
    marginTop: 12,
    fontSize: 15,
    color: '#95A5A6',
  },
  
  // Request Area
  requestAreaContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#EBF8FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestAreaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C5282',
    marginLeft: 8,
  },
  requestAreaNote: {
    fontSize: 13,
    color: '#4A5568',
    marginBottom: 16,
    lineHeight: 20,
  },
  requestAreaButton: {
    flexDirection: 'row',
    backgroundColor: '#2089DC',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAreaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Language Options
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  selectedLanguage: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  languageOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    color: '#2089DC',
    fontWeight: '700',
  },
});
