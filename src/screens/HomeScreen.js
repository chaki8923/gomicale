import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categoryConfig } from '../data/dataFormat';
import { fetchMunicipalities, fetchGarbageSchedule } from '../data/garbageData';

export default function HomeScreen() {
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState(null);
  const [selectedMunicipalityName, setSelectedMunicipalityName] = useState(null);
  const [municipalities, setMunicipalities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [garbageSchedule, setGarbageSchedule] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [municipalityModalVisible, setMunicipalityModalVisible] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedArea && garbageSchedule) {
      updateTodaySchedule();
    }
  }, [selectedArea, garbageSchedule]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 市町村一覧を取得
      const municipalitiesList = await fetchMunicipalities();
      setMunicipalities(municipalitiesList);

      // 保存されている市町村IDと地域を読み込み
      const savedMunicipalityId = await AsyncStorage.getItem('selectedMunicipalityId');
      const savedArea = await AsyncStorage.getItem('selectedArea');

      if (savedMunicipalityId && municipalitiesList.length > 0) {
        const municipality = municipalitiesList.find(m => m.id === savedMunicipalityId);
        if (municipality) {
          setSelectedMunicipalityId(savedMunicipalityId);
          setSelectedMunicipalityName(`${municipality.prefecture}${municipality.name}`);
          await loadMunicipalityData(savedMunicipalityId, savedArea);
        } else {
          // 保存された市町村が見つからない場合、選択を促す
          setMunicipalityModalVisible(true);
        }
      } else if (municipalitiesList.length > 0) {
        // 市町村選択を促す
        setMunicipalityModalVisible(true);
      }
    } catch (error) {
      console.error('データの読み込みエラー:', error);
      alert('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipalityData = async (municipalityId, savedArea = null) => {
    try {
      const schedule = await fetchGarbageSchedule(municipalityId);
      setGarbageSchedule(schedule);

      // 地域一覧を取得
      const municipalityName = Object.keys(schedule)[0];
      const areasList = Object.keys(schedule[municipalityName].areas);
      setAreas(areasList);

      if (savedArea && areasList.includes(savedArea)) {
        setSelectedArea(savedArea);
      } else if (!savedArea && areasList.length > 0) {
        setModalVisible(true);
      }
    } catch (error) {
      console.error('市町村データの読み込みエラー:', error);
    }
  };

  const selectMunicipality = async (municipality) => {
    try {
      setSelectedMunicipalityId(municipality.id);
      setSelectedMunicipalityName(`${municipality.prefecture}${municipality.name}`);
      await AsyncStorage.setItem('selectedMunicipalityId', municipality.id);
      await loadMunicipalityData(municipality.id);
      setMunicipalityModalVisible(false);
      setModalVisible(true);
    } catch (error) {
      console.error('市町村の選択エラー:', error);
    }
  };

  const selectArea = async (area) => {
    try {
      await AsyncStorage.setItem('selectedArea', area);
      await AsyncStorage.setItem('selectedMunicipalityId', selectedMunicipalityId);
      setSelectedArea(area);
      setModalVisible(false);
    } catch (error) {
      console.error('エリアの保存エラー:', error);
    }
  };

  const changeLocation = () => {
    setMunicipalityModalVisible(true);
  };

  const updateTodaySchedule = () => {
    if (!garbageSchedule || !selectedArea) {
      setTodaySchedule([]);
      return;
    }

    try {
      const today = new Date();
      const month = today.getMonth() + 1; // 1-12
      const day = today.getDate(); // 1-31
      
      const municipalityName = Object.keys(garbageSchedule)[0];
      if (!municipalityName || !garbageSchedule[municipalityName] || !garbageSchedule[municipalityName].areas) {
        setTodaySchedule([]);
        return;
      }

      const schedule = garbageSchedule[municipalityName].areas[selectedArea];
      const todayGarbage = [];

      if (schedule && typeof schedule === 'object') {
        const monthKey = String(month);
        const monthSchedule = schedule[monthKey];
        
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
      }

      setTodaySchedule(todayGarbage);
    } catch (error) {
      console.error('今日のスケジュール更新エラー:', error);
      setTodaySchedule([]);
    }
  };

  const getNextSchedule = () => {
    if (!selectedArea || !garbageSchedule) return [];
    
    try {
      const municipalityName = Object.keys(garbageSchedule)[0];
      if (!municipalityName || !garbageSchedule[municipalityName] || !garbageSchedule[municipalityName].areas) {
        return [];
      }

      const schedule = garbageSchedule[municipalityName].areas[selectedArea];
      if (!schedule || typeof schedule !== 'object') {
        return [];
      }

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
        const monthSchedule = schedule[monthKey];
        
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ごみカレ 🗑️</Text>
        <TouchableOpacity
          style={styles.municipalityButton}
          onPress={changeLocation}
        >
          <Text style={styles.municipalityButtonText}>
            📍 {selectedMunicipalityName || '市町村を選択'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.areaButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.areaButtonText}>
            🏘️ {selectedArea || '地域を選択'}
          </Text>
        </TouchableOpacity>
      </View>

      {todaySchedule.length > 0 ? (
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>今日の収集</Text>
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
          <Text style={styles.sectionTitle}>今日の収集</Text>
          <Text style={styles.noSchedule}>今日の収集はありません</Text>
        </View>
      )}

      <View style={styles.nextSection}>
        <Text style={styles.sectionTitle}>次回の収集予定</Text>
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
                  ? '今日'
                  : item.daysUntil === 1
                  ? '明日'
                  : `${item.daysUntil}日後（${item.dayName}曜日）`}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* 市町村選択モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={municipalityModalVisible}
        onRequestClose={() => setMunicipalityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>市町村を選択してください</Text>
            {municipalities.length === 0 ? (
              <Text style={styles.noDataText}>
                市町村データがありません。管理画面から登録してください。
              </Text>
            ) : (
              municipalities.map((municipality, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalButton}
                  onPress={() => selectMunicipality(municipality)}
                >
                  <Text style={styles.modalButtonText}>
                    {municipality.prefecture} {municipality.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            {selectedMunicipalityId && (
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setMunicipalityModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* 地域選択モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>地域を選択してください</Text>
            {areas.length === 0 ? (
              <Text style={styles.noDataText}>
                地域データがありません。管理画面から登録してください。
              </Text>
            ) : (
              areas.map((area, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalButton}
                  onPress={() => selectArea(area)}
                >
                  <Text style={styles.modalButtonText}>{area}</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>キャンセル</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
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
});
