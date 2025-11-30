import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { categoryConfig } from '../data/dataFormat';
import { fetchGarbageClassification } from '../data/garbageData';

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [garbageClassification, setGarbageClassification] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAreaName, setSelectedAreaName] = useState(null);
  const [isMyArea, setIsMyArea] = useState(false);

  // 画面にフォーカスが当たるたびにデータを再読み込み
  useFocusEffect(
    useCallback(() => {
      loadGarbageClassification();
    }, [])
  );

  const loadGarbageClassification = async () => {
    try {
      setLoading(true);
      const prefectureId = await AsyncStorage.getItem('selectedPrefectureId');
      const areaId = await AsyncStorage.getItem('selectedAreaId');
      const areaName = await AsyncStorage.getItem('selectedAreaName');
      const savedIsMyArea = await AsyncStorage.getItem('isMyArea');
      // エリアが所属する実際のcityIdを取得
      const areaCityId = await AsyncStorage.getItem('selectedAreaCityId');
      const cityId = await AsyncStorage.getItem('selectedCityId');
      
      setSelectedAreaName(areaName);
      setIsMyArea(savedIsMyArea === 'true');
      
      if (prefectureId && areaId && (areaCityId || cityId)) {
        // areaCityIdがあればそれを使用、なければcityIdを使用
        const items = await fetchGarbageClassification(prefectureId, areaCityId || cityId, areaId);
        setGarbageClassification(items);
      } else {
        // エリアが選択されていない場合は空配列
        setGarbageClassification([]);
      }
    } catch (error) {
      console.error('ごみ分別データの読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = searchQuery
    ? garbageClassification.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.examples.some((example) =>
            example.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : garbageClassification;

  const openDetail = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => {
    const config = categoryConfig[item.category];
    if (!config) {
      // カテゴリーが存在しない場合はスキップ
      return null;
    }
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: config.color }]}
        onPress={() => openDetail(item)}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.categoryBadge}>
            <MaterialCommunityIcons 
              name={config.icon} 
              size={14} 
              color={config.color} 
              style={styles.categoryIcon} 
            />
            <Text style={[styles.categoryText, { color: config.color }]}>
              {config.name}
            </Text>
          </View>
        </View>
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2089DC" />
        <Text style={styles.loadingText}>{t('search.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {selectedAreaName && (
          <View style={[styles.myAreaBanner, !isMyArea && styles.normalAreaBanner]}>
            {isMyArea && <Ionicons name="star" size={18} color="#FFD700" />}
            <Text style={styles.myAreaBannerText}>{selectedAreaName}</Text>
          </View>
        )}
      <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name={searchQuery ? "file-search-outline" : "magnify"} 
              size={64} 
              color="#E0E0E0" 
            />
            <Text style={styles.emptyText}>
              {searchQuery
                ? t('search.noResults')
                : t('search.searchPrompt')}
            </Text>
          </View>
        }
      />

      {/* 詳細モーダル */}
      {selectedItem && categoryConfig[selectedItem.category] && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleContainer}>
                    <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                      <Ionicons name="close" size={24} color="#555" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalScrollView}>
                    <View style={styles.modalBody}>
                      <View 
                        style={[
                          styles.categoryBadgeLarge, 
                          { backgroundColor: `${categoryConfig[selectedItem.category].color}15` }
                        ]}
                      >
                        <MaterialCommunityIcons 
                          name={categoryConfig[selectedItem.category].icon} 
                          size={24} 
                          color={categoryConfig[selectedItem.category].color} 
                        />
                        <Text 
                          style={[
                            styles.categoryTextLarge, 
                            { color: categoryConfig[selectedItem.category].color }
                          ]}
                        >
                          {categoryConfig[selectedItem.category].name}
                        </Text>
                      </View>

                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="information-circle-outline" size={20} color="#555" />
                        <Text style={styles.sectionTitle}>{t('search.howToDispose')}</Text>
                        </View>
                        <Text style={styles.sectionText}>
                          {selectedItem.description}
                        </Text>
                      </View>

                      {selectedItem.examples && selectedItem.examples.length > 0 && (
                      <View style={styles.section}>
                          <View style={styles.sectionHeader}>
                            <Ionicons name="list-outline" size={20} color="#555" />
                        <Text style={styles.sectionTitle}>{t('search.examples')}</Text>
                          </View>
                          <View style={styles.examplesContainer}>
                        {selectedItem.examples.map((example, index) => (
                              <View key={index} style={styles.exampleItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.exampleText}>{example}</Text>
                              </View>
                        ))}
                      </View>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  myAreaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2089DC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
  },
  myAreaBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  normalAreaBanner: {
    backgroundColor: '#7F8C8D',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  arrowContainer: {
    marginLeft: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: 16,
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
    height: '80%',
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
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  modalScrollView: {
    flex: 1,
  },
  modalBody: {
    padding: 24,
    paddingTop: 10,
  },
  categoryBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 32,
    alignSelf: 'flex-start',
  },
  categoryTextLarge: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555',
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
  examplesContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#95A5A6',
    marginTop: 8,
    marginRight: 10,
  },
  exampleText: {
    fontSize: 15,
    color: '#444',
    flex: 1,
    lineHeight: 22,
  },
});
