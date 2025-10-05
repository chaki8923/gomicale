import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { garbageSchedule, categoryConfig } from '../data/sampleData';

export default function HomeScreen() {
  const [selectedArea, setSelectedArea] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState([]);

  useEffect(() => {
    loadSelectedArea();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      updateTodaySchedule();
    }
  }, [selectedArea]);

  const loadSelectedArea = async () => {
    try {
      const area = await AsyncStorage.getItem('selectedArea');
      if (area) {
        setSelectedArea(area);
      } else {
        setModalVisible(true);
      }
    } catch (error) {
      console.error('エリアの読み込みエラー:', error);
    }
  };

  const selectArea = async (area) => {
    try {
      await AsyncStorage.setItem('selectedArea', area);
      setSelectedArea(area);
      setModalVisible(false);
    } catch (error) {
      console.error('エリアの保存エラー:', error);
    }
  };

  const updateTodaySchedule = () => {
    const today = new Date().getDay();
    const schedule = garbageSchedule['渋谷区'].areas[selectedArea];
    const todayGarbage = [];

    if (schedule) {
      Object.keys(schedule).forEach((category) => {
        if (schedule[category].includes(today)) {
          todayGarbage.push({
            category,
            ...categoryConfig[category],
          });
        }
      });
    }

    setTodaySchedule(todayGarbage);
  };

  const getNextSchedule = () => {
    if (!selectedArea) return [];
    
    const schedule = garbageSchedule['渋谷区'].areas[selectedArea];
    const today = new Date().getDay();
    const nextSchedule = [];

    Object.keys(schedule).forEach((category) => {
      const days = schedule[category];
      let nextDay = days.find((day) => day > today);
      if (!nextDay) {
        nextDay = days[0]; // 来週
      }
      
      const daysUntil = nextDay > today ? nextDay - today : 7 - today + nextDay;
      nextSchedule.push({
        category,
        daysUntil,
        dayName: ['日', '月', '火', '水', '木', '金', '土'][nextDay],
        ...categoryConfig[category],
      });
    });

    return nextSchedule.sort((a, b) => a.daysUntil - b.daysUntil);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ごみカレ 🗑️</Text>
        <TouchableOpacity
          style={styles.areaButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.areaButtonText}>
            {selectedArea || '地域を選択'}
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
            {Object.keys(garbageSchedule['渋谷区'].areas).map((area, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalButton}
                onPress={() => selectArea(area)}
              >
                <Text style={styles.modalButtonText}>{area}</Text>
              </TouchableOpacity>
            ))}
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
