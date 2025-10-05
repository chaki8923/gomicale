import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { garbageSchedule, categoryConfig } from '../data/sampleData';

export default function CalendarScreen() {
  const [selectedArea, setSelectedArea] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadSelectedArea();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      generateMarkedDates();
    }
  }, [selectedArea]);

  const loadSelectedArea = async () => {
    try {
      const area = await AsyncStorage.getItem('selectedArea');
      if (area) {
        setSelectedArea(area);
      }
    } catch (error) {
      console.error('エリアの読み込みエラー:', error);
    }
  };

  const generateMarkedDates = () => {
    if (!selectedArea) return;

    const schedule = garbageSchedule['渋谷区'].areas[selectedArea];
    const marked = {};
    const today = new Date();
    
    // 今月と来月のカレンダーにマークを追加
    for (let month = 0; month < 3; month++) {
      const currentDate = new Date(today.getFullYear(), today.getMonth() + month, 1);
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayOfWeek = date.getDay();
        const dateString = date.toISOString().split('T')[0];

        const garbageTypes = [];
        Object.keys(schedule).forEach((category) => {
          if (schedule[category].includes(dayOfWeek)) {
            garbageTypes.push({
              category,
              color: categoryConfig[category].color,
            });
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
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const getGarbageForDate = (dateString) => {
    if (!markedDates[dateString]) return [];
    return markedDates[dateString].garbageTypes.map((type) => ({
      ...categoryConfig[type.category],
    }));
  };

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
