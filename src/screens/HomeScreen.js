import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categoryConfig } from '../data/dataFormat';
import { fetchMunicipalities, fetchAreas, fetchAreaSchedule } from '../data/garbageData';
import { saveLanguage } from '../i18n/i18n';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedAreaName, setSelectedAreaName] = useState(null);
  const [selectedPrefectureId, setSelectedPrefectureId] = useState(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState(null);
  const [prefectures, setPrefectures] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areaSchedule, setAreaSchedule] = useState(null);
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [prefectureModalVisible, setPrefectureModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 都道府県一覧を取得
      const prefecturesList = await fetchMunicipalities();
      setPrefectures(prefecturesList);

      // 保存されている都道府県IDとエリアIDを読み込み
      const savedPrefectureId = await AsyncStorage.getItem('selectedPrefectureId');
      const savedAreaId = await AsyncStorage.getItem('selectedAreaId');
      const savedAreaName = await AsyncStorage.getItem('selectedAreaName');

      if (savedPrefectureId && prefecturesList.length > 0) {
        const prefecture = prefecturesList.find(p => p.id === savedPrefectureId);
        if (prefecture) {
          setSelectedPrefectureId(savedPrefectureId);
          setSelectedPrefecture(prefecture.prefecture);
          await loadPrefectureData(savedPrefectureId, savedAreaId, savedAreaName);
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

  const loadPrefectureData = async (prefectureId, savedAreaId = null, savedAreaName = null) => {
    try {
      // エリア一覧を取得
      const areasList = await fetchAreas(prefectureId);
      setAreas(areasList);

      if (savedAreaId) {
        const area = areasList.find(a => a.id === savedAreaId);
        if (area) {
          setSelectedAreaId(savedAreaId);
          setSelectedAreaName(area.name); // エリアリストから最新の名前を取得
          setAreaSchedule(area.schedule);
        } else {
          setAreaModalVisible(true);
        }
      } else if (areasList.length > 0) {
        setAreaModalVisible(true);
      }
    } catch (error) {
      console.error('都道府県データの読み込みエラー:', error);
    }
  };

  const selectPrefecture = async (prefecture) => {
    try {
      setSelectedPrefectureId(prefecture.id);
      setSelectedPrefecture(prefecture.prefecture);
      await AsyncStorage.setItem('selectedPrefectureId', prefecture.id);
      
      // 以前のエリア選択をクリア
      setSelectedAreaId(null);
      setSelectedAreaName(null);
      await AsyncStorage.removeItem('selectedAreaId');
      await AsyncStorage.removeItem('selectedAreaName');
      
      await loadPrefectureData(prefecture.id);
      setPrefectureModalVisible(false);
      setAreaModalVisible(true);
    } catch (error) {
      console.error('都道府県の選択エラー:', error);
    }
  };

  const selectArea = async (area) => {
    try {
      await AsyncStorage.setItem('selectedAreaId', area.id);
      await AsyncStorage.setItem('selectedAreaName', area.name);
      await AsyncStorage.setItem('selectedPrefectureId', selectedPrefectureId);
      
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
          style={styles.areaButton}
          onPress={() => setAreaModalVisible(true)}
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
        onRequestClose={() => setPrefectureModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('home.selectPrefectureTitle')}</Text>
            <ScrollView style={styles.modalScrollView}>
              {prefectures.length === 0 ? (
                <Text style={styles.noDataText}>
                  {t('home.noPrefectureData')}
                </Text>
              ) : (
                prefectures.map((prefecture, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalButton}
                    onPress={() => selectPrefecture(prefecture)}
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
                onPress={() => setPrefectureModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>{t('home.cancel')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* エリア選択モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={areaModalVisible}
        onRequestClose={() => setAreaModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('home.selectAreaTitle')}</Text>
            <ScrollView style={styles.modalScrollView}>
              {areas.length === 0 ? (
                <Text style={styles.noDataText}>
                  {t('home.noAreaData')}
                </Text>
              ) : (
                areas.map((area, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalButton}
                    onPress={() => selectArea(area)}
                  >
                    <Text style={styles.modalButtonText}>{area.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <View style={styles.requestAreaContainer}>
              <Text style={styles.requestAreaText}>{t('home.requestAreaAddition')}</Text>
              <TouchableOpacity
                style={styles.requestAreaButton}
                onPress={openRequestForm}
              >
                <Text style={styles.requestAreaButtonText}>{t('home.requestAreaButton')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setAreaModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t('home.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 20,
    textAlign: 'center',
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
    marginBottom: 8,
    textAlign: 'center',
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
