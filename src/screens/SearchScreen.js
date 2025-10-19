import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categoryConfig } from '../data/dataFormat';
import { fetchGarbageClassification } from '../data/garbageData';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [garbageClassification, setGarbageClassification] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGarbageClassification();
  }, []);

  const loadGarbageClassification = async () => {
    try {
      setLoading(true);
      const municipalityId = await AsyncStorage.getItem('selectedMunicipalityId');
      
      if (municipalityId) {
        const items = await fetchGarbageClassification(municipalityId);
        setGarbageClassification(items);
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
            <Text style={styles.categoryIcon}>{config.icon}</Text>
            <Text style={styles.categoryText}>{config.name}</Text>
          </View>
        </View>
        <Text style={styles.arrowIcon}>›</Text>
      </TouchableOpacity>
    );
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
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ごみの名前を入力（例: ペットボトル）"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? '該当するごみが見つかりませんでした'
                : 'ごみの名前を検索してください'}
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
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View
                style={[
                  styles.modalHeader,
                  { backgroundColor: categoryConfig[selectedItem.category].color },
                ]}
              >
                <Text style={styles.modalIcon}>
                  {categoryConfig[selectedItem.category].icon}
                </Text>
                <Text style={styles.modalTitle}>{selectedItem.name}</Text>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.categoryBadgeLarge}>
                  <Text style={styles.categoryTextLarge}>
                    {categoryConfig[selectedItem.category].name}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>出し方</Text>
                  <Text style={styles.sectionText}>
                    {selectedItem.description}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>例</Text>
                  {selectedItem.examples.map((example, index) => (
                    <Text key={index} style={styles.exampleText}>
                      • {example}
                    </Text>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
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
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  searchInput: {
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  categoryText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  arrowIcon: {
    fontSize: 30,
    color: '#BDC3C7',
    marginLeft: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  categoryBadgeLarge: {
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryTextLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 16,
    color: '#34495E',
    lineHeight: 24,
  },
  exampleText: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 8,
    paddingLeft: 10,
  },
  closeButton: {
    backgroundColor: '#4ECDC4',
    padding: 18,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
