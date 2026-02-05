<template>
  <div class="sidebar h-full flex flex-col">
    <!-- Logo -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white">
          <i data-lucide="zap" class="w-5 h-5"></i>
        </div>
        <h1 class="font-black text-xl tracking-tight italic">ST MANAGER</h1>
      </div>
    </div>
    
    <!-- 导航 -->
    <div class="flex-1 overflow-auto p-4 space-y-6">
      <!-- 基础视图 -->
      <div class="space-y-2">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">资料库</h3>
        <button 
          @click="$emit('change-view', 'all')"
          :class="['w-full flex items-center justify-between px-3 py-2 rounded-lg transition',
                   currentView === 'all' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800']"
        >
          <div class="flex items-center gap-2">
            <i data-lucide="layout-grid" class="w-4 h-4"></i>
            <span class="font-medium">全部档案</span>
          </div>
          <span class="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{{ cards.length }}</span>
        </button>
      </div>
      
      <!-- 标签 -->
      <div class="space-y-2">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">标签</h3>
        <div class="space-y-1">
          <button 
            v-for="tag in uniqueTags"
            :key="tag"
            @click="$emit('change-tag', tag)"
            :class="['w-full text-left px-3 py-2 rounded-lg transition text-sm',
                     currentTag === tag ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800']"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 导入按钮 -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-800">
      <label class="block w-full px-4 py-3 bg-rose-500 text-white rounded-lg font-medium text-center cursor-pointer hover:bg-rose-600 transition">
        <i data-lucide="plus-circle" class="w-4 h-4 inline mr-2"></i>
        导入文件
        <input 
          type="file" 
          multiple 
          accept=".png,.json" 
          class="hidden"
          @change="handleFileSelect"
        >
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  cards: Array,
  currentView: String,
  currentTag: String
});

const emit = defineEmits(['change-view', 'change-tag', 'toggle-theme', 'import-files']);

// 提取所有不重复的标签
const uniqueTags = computed(() => {
  const tags = new Set();
  props.cards.forEach(card => {
    (card.data?.tags || []).forEach(tag => {
      if (tag && tag.trim()) {
        tags.add(tag.trim());
      }
    });
  });
  return Array.from(tags).sort();
});

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    emit('import-files', files);
  }
  event.target.value = '';
};
</script>

<style scoped>
.sidebar {
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
}
</style>