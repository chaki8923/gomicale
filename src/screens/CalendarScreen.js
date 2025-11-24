import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { categoryConfig } from '../data/dataFormat';
import { fetchAreaSchedule } from '../data/garbageData';

// 日本語ロケール設定
LocaleConfig.locales['ja'] = {
  monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日'
};
LocaleConfig.defaultLocale = 'ja';

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedPrefectureId, setSelectedPrefectureId] = useState(null);
  const [areaSchedule, setAreaSchedule] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // 画面にフォーカスが当たるたびにデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadSelectedArea();
    }, [])
  );

  useEffect(() => {
    if (i18n.language) {
      LocaleConfig.defaultLocale = i18n.language === 'ja' ? 'ja' : '';
    }
  }, [i18n.language]);

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
      for (let monthOffset = -1; monthOffset < 12; monthOffset++) {
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
        <ActivityIndicator size="large" color="#2089DC" />
        <Text style={styles.loadingText}>{t('calendar.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {!selectedAreaId ? (
          <View style={styles.noAreaContainer}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={64} color="#E0E0E0" />
            <Text style={styles.noAreaText}>
              {t('calendar.selectAreaPrompt')}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.calendarCard}>
              <Calendar
                markedDates={{
                  ...markedDates,
                  [selectedDate]: {
                    ...(markedDates[selectedDate] || {}),
                    selected: true,
                    selectedColor: '#2089DC',
                    selectedTextColor: '#ffffff',
                  },
                }}
                onDayPress={onDayPress}
                monthFormat={i18n.language === 'ja' ? 'yyyy年 MM月' : 'MMMM yyyy'}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#b6c1cd',
                  selectedDayBackgroundColor: '#2089DC',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#2089DC',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  dotColor: '#00adf5',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#2089DC',
                  monthTextColor: '#2C3E50',
                  indicatorColor: 'blue',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '500',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 13
                }}
                markingType={'multi-dot'}
                enableSwipeMonths={true}
                current={selectedDate}
              />
            </View>

            <View style={styles.scheduleSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={20} color="#2089DC" />
                <Text style={styles.sectionTitle}>
                  {t('calendar.collectionSchedule', { date: selectedDate })}
                </Text>
              </View>

              {getGarbageForDate(selectedDate).length > 0 ? (
                getGarbageForDate(selectedDate).map((item, index) => (
                  <View
                    key={index}
                    style={[styles.garbageCard, { borderLeftColor: item.color }]}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                      <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                    </View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.noScheduleText}>{t('calendar.noSchedule')}</Text>
                </View>
              )}
            </View>

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
  noAreaContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  noAreaText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  calendarCard: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  scheduleSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginLeft: 8,
  },
  garbageCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F2F5',
    borderStyle: 'dashed',
  },
  noScheduleText: {
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '500',
  },
  legendContainer: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 12,
    paddingRight: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
});
