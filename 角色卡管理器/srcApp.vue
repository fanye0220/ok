<template>
  <div class="app-container h-screen overflow-hidden flex">
    <!-- 侧边栏 -->
    <aside class="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900">
      <Sidebar 
        :cards="cards"
        :currentView="currentView"
        :currentTag="currentTag"
        @change-view="changeView"
        @change-tag="changeTag"
        @toggle-theme="toggleTheme"
        @import-files="handleFileImport"
      />
    </aside>
    
    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col">
      <!-- 顶部工具栏 -->
      <div class="h-16 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between bg-white dark:bg-gray-900">
        <div class="flex items-center gap-4">
          <div class="relative">
            <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></i>
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="搜索名称、文件名..."
              class="pl-10 pr-4 py-2 w-64 bg-gray-100 dark:bg-gray-800 rounded-lg border-none text-sm"
            />
          </div>
          <select 
            v-model="sortBy"
            class="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
          >
            <option value="time-desc">最新时间</option>
            <option value="time-asc">最旧时间</option>
            <option value="name-asc">名称 A-Z</option>
            <option value="name-desc">名称 Z-A</option>
          </select>
        </div>
        
        <div class="flex items-center gap-3">
          <button @click="toggleEditMode" class="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600">
            {{ isEditMode ? '退出编辑' : '编辑模式' }}
          </button>
          <button @click="toggleTheme" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <i v-if="isDark" data-lucide="sun" class="w-5 h-5"></i>
            <i v-else data-lucide="moon" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
      
      <!-- 卡片网格 -->
      <div class="flex-1 overflow-auto p-6">
        <CardGrid 
          :cards="displayedCards"
          :isEditMode="isEditMode"
          :selectedIds="selectedIds"
          @select-card="selectCard"
          @view-detail="viewCardDetail"
        />
      </div>
    </main>
    
    <!-- 卡片详情模态框 -->
    <CardDetailModal 
      v-if="selectedCard"
      :card="selectedCard"
      @close="selectedCard = null"
      @save="saveCard"
      @delete="deleteCard"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Sidebar from './modules/components/Sidebar.vue';
import CardGrid from './modules/components/CardGrid.vue';
import CardDetailModal from './modules/components/CardDetailModal.vue';

// 状态
const cards = ref([]);
const currentView = ref('all');
const currentTag = ref(null);
const searchQuery = ref('');
const sortBy = ref('time-desc');
const isEditMode = ref(false);
const selectedIds = ref([]);
const selectedCard = ref(null);
const isDark = ref(localStorage.getItem('theme') === 'dark');

// 计算属性
const displayedCards = computed(() => {
  let filtered = [...cards.value];
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(card => 
      card.data?.name?.toLowerCase().includes(query) ||
      card.fileName?.toLowerCase().includes(query)
    );
  }
  
  // 标签过滤
  if (currentTag.value) {
    filtered = filtered.filter(card => 
      card.data?.tags?.includes(currentTag.value)
    );
  }
  
  // 排序
  filtered.sort((a, b) => {
    if (sortBy.value === 'name-asc') {
      return a.data?.name?.localeCompare(b.data?.name);
    } else if (sortBy.value === 'name-desc') {
      return b.data?.name?.localeCompare(a.data?.name);
    } else if (sortBy.value === 'time-asc') {
      return a.importDate - b.importDate;
    } else {
      return b.importDate - a.importDate;
    }
  });
  
  return filtered;
});

// 方法
const changeView = (view) => {
  currentView.value = view;
  currentTag.value = null;
};

const changeTag = (tag) => {
  currentTag.value = tag;
  currentView.value = 'tag';
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', isDark.value);
};

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (!isEditMode.value) selectedIds.value = [];
};

const selectCard = (id) => {
  if (isEditMode.value) {
    const index = selectedIds.value.indexOf(id);
    if (index > -1) {
      selectedIds.value.splice(index, 1);
    } else {
      selectedIds.value.push(id);
    }
  } else {
    selectedCard.value = cards.value.find(c => c.id === id);
  }
};

const viewCardDetail = (card) => {
  selectedCard.value = card;
};

const saveCard = async (updatedCard) => {
  const index = cards.value.findIndex(c => c.id === updatedCard.id);
  if (index > -1) {
    cards.value[index] = updatedCard;
    await saveToIndexedDB(updatedCard);
  }
};

const deleteCard = async (cardId) => {
  if (confirm('确定删除这个角色卡吗？')) {
    cards.value = cards.value.filter(c => c.id !== cardId);
    await deleteFromIndexedDB(cardId);
    selectedCard.value = null;
  }
};

const handleFileImport = async (files) => {
  for (const file of files) {
    try {
      const card = await parseCardFile(file);
      cards.value.push(card);
      await saveToIndexedDB(card);
    } catch (error) {
      console.error('导入失败:', file.name, error);
    }
  }
};

// 初始化
onMounted(() => {
  // 加载已保存的卡片
  loadCardsFromDB();
  
  // 应用主题
  document.documentElement.classList.toggle('dark', isDark.value);
  
  // 初始化图标
  lucide.createIcons();
});

// IndexedDB 辅助函数
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('STCardManager', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('cards')) {
        db.createObjectStore('cards', { keyPath: 'id' });
      }
    };
  });
};

const loadCardsFromDB = async () => {
  try {
    const db = await openDB();
    const transaction = db.transaction('cards', 'readonly');
    const store = transaction.objectStore('cards');
    const request = store.getAll();
    
    request.onsuccess = () => {
      cards.value = request.result.map(card => ({
        ...card,
        imgUrl: card.blob ? URL.createObjectURL(card.blob) : null
      }));
    };
  } catch (error) {
    console.error('加载卡片失败:', error);
  }
};

const saveToIndexedDB = async (card) => {
  try {
    const db = await openDB();
    const transaction = db.transaction('cards', 'readwrite');
    const store = transaction.objectStore('cards');
    store.put(card);
  } catch (error) {
    console.error('保存失败:', error);
  }
};

const deleteFromIndexedDB = async (cardId) => {
  try {
    const db = await openDB();
    const transaction = db.transaction('cards', 'readwrite');
    const store = transaction.objectStore('cards');
    store.delete(cardId);
  } catch (error) {
    console.error('删除失败:', error);
  }
};

// 解析卡片文件
const parseCardFile = async (file) => {
  let raw;
  
  if (file.type === 'image/png') {
    raw = await parsePNG(file);
  } else if (file.type === 'application/json') {
    const text = await file.text();
    raw = JSON.parse(text);
  } else {
    throw new Error('不支持的文件格式');
  }
  
  const cardData = raw.data || raw;
  
  return {
    id: generateId(),
    fileName: file.name,
    importDate: Date.now(),
    imgUrl: file.type === 'image/png' ? URL.createObjectURL(file) : null,
    blob: file.type === 'image/png' ? file : null,
    data: {
      name: cardData.name || '未命名角色',
      description: cardData.description || '',
      first_mes: cardData.first_mes || '',
      tags: cardData.tags || [],
      creator: cardData.creator || '',
      creator_notes: cardData.creator_notes || ''
    }
  };
};

// 生成随机ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// PNG解析函数
const parsePNG = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buffer = reader.result;
        const view = new DataView(buffer);
        
        // 验证PNG签名
        if (view.getUint32(0) !== 0x89504e47) {
          reject(new Error('不是有效的PNG文件'));
          return;
        }
        
        let offset = 8;
        while (offset < buffer.byteLength) {
          const length = view.getUint32(offset);
          const type = String.fromCharCode(...new Uint8Array(buffer.slice(offset + 4, offset + 8)));
          
          if (type === 'tEXt' || type === 'iTXt') {
            const chunkData = new Uint8Array(buffer.slice(offset + 8, offset + 8 + length));
            const keywordEnd = chunkData.indexOf(0);
            const keyword = new TextDecoder().decode(chunkData.slice(0, keywordEnd));
            
            if (keyword === 'chara') {
              let textData;
              if (type === 'tEXt') {
                textData = chunkData.slice(keywordEnd + 1);
              } else {
                // 跳过压缩标志、方法、语言标签和翻译关键字
                let cursor = keywordEnd + 3; // 跳过压缩标志和方法
                while (chunkData[cursor] !== 0) cursor++; // 跳过语言标签
                cursor++;
                while (chunkData[cursor] !== 0) cursor++; // 跳过翻译关键字
                cursor++;
                textData = chunkData.slice(cursor);
              }
              
              const encodedText = new TextDecoder().decode(textData);
              try {
                resolve(JSON.parse(encodedText));
                return;
              } catch (e) {
                try {
                  const decoded = atob(encodedText);
                  resolve(JSON.parse(decoded));
                  return;
                } catch (e2) {
                  resolve(JSON.parse(encodedText));
                  return;
                }
              }
            }
          }
          
          offset += 12 + length;
        }
        
        reject(new Error('没有找到角色卡数据'));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};
</script>

<style scoped>
.app-container {
  transition: background-color 0.3s ease;
}
</style>