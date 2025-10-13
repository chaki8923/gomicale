import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categoryConfig } from '../data/sampleData';
import { fetchGarbageSchedule } from '../data/garbageData';

export default function CalendarScreen() {
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState(null);
  const [garbageSchedule, setGarbageSchedule] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSelectedArea();
  }, []);

  useEffect(() => {
    if (selectedArea && garbageSchedule) {
      generateMarkedDates();
    }
  }, [selectedArea, garbageSchedule]);

  const loadSelectedArea = async () => {
    try {
      setLoading(true);
      const area = await AsyncStorage.getItem('selectedArea');
      const municipalityId = await AsyncStorage.getItem('selectedMunicipalityId');
      
      if (area && municipalityId) {
        setSelectedArea(area);
        setSelectedMunicipalityId(municipalityId);
        
        const schedule = await fetchGarbageSchedule(municipalityId);
        setGarbageSchedule(schedule);
      }
    } catch (error) {
      console.error('エリアの読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkedDates = () => {
    if (!selectedArea || !garbageSchedule) return;

    try {
      const municipalityName = Object.keys(garbageSchedule)[0];
      if (!municipalityName || !garbageSchedule[municipalityName] || !garbageSchedule[municipalityName].areas) {
        return;
      }

      const schedule = garbageSchedule[municipalityName].areas[selectedArea];
      if (!schedule || typeof schedule !== 'object') return;
      
      const marked = {};
      const today = new Date();
    
    // 今月から数ヶ月分のカレンダーにマークを追加
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const currentDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // 1-12
      const daysInMonth = new Date(year, month, 0).getDate();

      // スケジュールから該当月のデータを取得
      const monthKey = String(month);
      const monthSchedule = schedule[monthKey];
      
      if (!monthSchedule) continue;

      // 各日付をチェック
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dateString = date.toISOString().split('T')[0];

        const garbageTypes = [];
        
        // 各カテゴリーをチェック
        Object.keys(monthSchedule).forEach((category) => {
          const days = monthSchedule[category];
          if (Array.isArray(days) && days.includes(day)) {
            // categoryConfigに存在するカテゴリーのみ追加
            if (categoryConfig[category]) {
              garbageTypes.push({
                category,
                color: categoryConfig[category].color,
              });
            }
          }
        });

        if (garbageTypes.length > 0) {
          marked[dateString] = {
            marked: true,
            dots: garbageTypes.map((type) => ({ color: type.color })),
            garbageTypes,
          };
        }
      }
    }

      setMarkedDates(marked);
    } catch (error) {
      console.error('カレンダーマーク生成エラー:', error);
      setMarkedDates({});
    }
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const getGarbageForDate = (dateString) => {
    if (!markedDates[dateString] || !markedDates[dateString].garbageTypes) return [];
    return markedDates[dateString].garbageTypes
      .filter(type => categoryConfig[type.category])
      .map((type) => ({
        ...categoryConfig[type.category],
      }));
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
      {!selectedArea ? (
        <View style={styles.noAreaContainer}>
          <Text style={styles.noAreaText}>
            ホーム画面で地域を選択してください
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.calendarContainer}>
            <Calendar
              markedDates={{
                ...markedDates,
                ...(selectedDate && {
                  [selectedDate]: {
                    ...markedDates[selectedDate],
                    selected: true,
                    selectedColor: '#4ECDC4',
                  },
                }),
              }}
              onDayPress={onDayPress}
              monthFormat={'yyyy年 MM月'}
              theme={{
                todayTextColor: '#4ECDC4',
                selectedDayBackgroundColor: '#4ECDC4',
                dotColor: '#4ECDC4',
                arrowColor: '#4ECDC4',
                textMonthFontWeight: 'bold',
                textMonthFontSize: 18,
              }}
              markingType={'multi-dot'}
            />
          </View>

          {selectedDate && (
            <View style={styles.detailContainer}>
              <Text style={styles.detailTitle}>
                {selectedDate} の収集予定
              </Text>
              {getGarbageForDate(selectedDate).length > 0 ? (
                getGarbageForDate(selectedDate).map((item, index) => (
                  <View
                    key={index}
                    style={[styles.card, { borderLeftColor: item.color }]}
                  >
                    <Text style={styles.cardIcon}>{item.icon}</Text>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noSchedule}>収集はありません</Text>
              )}
            </View>
          )}

          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>凡例</Text>
            <View style={styles.legendGrid}>
              {Object.keys(categoryConfig).map((key, index) => (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: categoryConfig[key].color },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    {categoryConfig[key].name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
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
  noAreaContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAreaText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailContainer: {
    margin: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#F7F9FC',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  noSchedule: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    paddingVertical: 20,
  },
  legendContainer: {
    margin: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#2C3E50',
  },
});
