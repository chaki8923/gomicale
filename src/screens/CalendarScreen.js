import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categoryConfig } from '../data/dataFormat';
import { fetchAreaSchedule } from '../data/garbageData';

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedPrefectureId, setSelectedPrefectureId] = useState(null);
  const [areaSchedule, setAreaSchedule] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // 画面にフォーカスが当たるたびにデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadSelectedArea();
    }, [])
  );

  useEffect(() => {
    if (selectedAreaId && areaSchedule) {
      generateMarkedDates();
    }
  }, [selectedAreaId, areaSchedule]);

  const loadSelectedArea = async () => {
    try {
      setLoading(true);
      const areaId = await AsyncStorage.getItem('selectedAreaId');
      const cityId = await AsyncStorage.getItem('selectedCityId');
      const prefectureId = await AsyncStorage.getItem('selectedPrefectureId');
      
      if (areaId && cityId && prefectureId) {
        setSelectedAreaId(areaId);
        setSelectedCityId(cityId);
        setSelectedPrefectureId(prefectureId);
        
        const schedule = await fetchAreaSchedule(prefectureId, cityId, areaId);
        setAreaSchedule(schedule.schedule);
      }
    } catch (error) {
      console.error('エリアの読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMarkedDates = () => {
    if (!selectedAreaId || !areaSchedule) return;

    try {
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
        const monthSchedule = areaSchedule[monthKey];
        
        if (!monthSchedule) continue;

        // 各日付をチェック
        for (let day = 1; day <= daysInMonth; day++) {
          // タイムゾーンの影響を受けないように、直接日付文字列を作成
          const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

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
        <Text style={styles.loadingText}>{t('calendar.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {!selectedAreaId ? (
        <View style={styles.noAreaContainer}>
          <Text style={styles.noAreaText}>
            {t('calendar.selectAreaPrompt')}
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
              monthFormat={i18n.language === 'ja' ? 'yyyy年 MM月' : 'MMMM yyyy'}
              theme={{
                todayTextColor: '#4ECDC4',
                selectedDayBackgroundColor: '#4ECDC4',
                dotColor: '#4ECDC4',
                arrowColor: '#4ECDC4',
                textMonthFontWeight: 'bold',
                textMonthFontSize: 18,
              }}
              markingType={'multi-dot'}
              // 月の切り替えを有効化
              enableSwipeMonths={true}
              // 現在の月を初期表示
              current={new Date().toISOString().split('T')[0]}
              // 過去と未来の月を表示可能にする
              minDate={new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]}
              maxDate={new Date(new Date().getFullYear(), new Date().getMonth() + 12, 0).toISOString().split('T')[0]}
              // 余分な日を非表示
              hideExtraDays={true}
              // 月が変更されたときの処理
              onMonthChange={(month) => {
                console.log('月が変更されました:', month);
              }}
            />
          </View>

          {selectedDate && (
            <View style={styles.detailContainer}>
              <Text style={styles.detailTitle}>
                {t('calendar.collectionSchedule', { date: selectedDate })}
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
                <Text style={styles.noSchedule}>{t('calendar.noSchedule')}</Text>
              )}
            </View>
          )}

          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>{t('calendar.legend')}</Text>
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
