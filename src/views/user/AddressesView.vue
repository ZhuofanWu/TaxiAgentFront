<script setup lang="ts">
import { NButton, NCard, NForm, NFormItem, NInput, NSelect, NSpin, NTag, NText } from 'naive-ui'
import { usePoiAddresses } from '@/composables/usePoiAddresses'

const {
  mapEl,
  loading,
  saving,
  searching,
  mode,
  pois,
  selectedPoiId,
  form,
  tagType,
  searchKeyword,
  searchResults,
  searchPerformed,
  isEditing,
  tagOptions,
  tagDuplicate,
  canSubmit,
  mapBooting,
  geocoding,
  startCreate,
  startEdit,
  cancelEdit,
  handleSearch,
  applySearchResult,
  handleSave,
  handleSelect,
} = usePoiAddresses()
</script>

<template>
  <div class="addresses-page">
    <div class="page-head">
      <div class="title">地址管理</div>
      <NText depth="3">管理常用兴趣点，拖拽地图精准定位</NText>
    </div>

    <div class="two-col">
      <div class="col">
        <NCard class="map-card" :content-style="{ padding: 0 }">
          <template #header>
            <div class="map-head">
              <div class="map-title">地图</div>
              <NText depth="3">{{ isEditing ? '拖动地图定位' : '点击标记查看详情' }}</NText>
            </div>
          </template>
          <NSpin :show="mapBooting">
            <div class="map-wrap" :class="{ editing: isEditing }">
              <div ref="mapEl" class="map" />
              <div v-if="isEditing" class="crosshair" />
              <div v-if="isEditing" class="crosshair-hint">
                {{ geocoding ? '地址解析中...' : '拖拽地图定位，停止后自动补全地址' }}
              </div>
            </div>
          </NSpin>
        </NCard>
      </div>

      <div class="col">
        <NCard class="list-card">
          <template #header>
            <div class="list-head">
              <div class="list-title">兴趣点</div>
              <div class="list-actions">
                <NButton v-if="!isEditing" type="primary" @click="startCreate">新建兴趣点</NButton>
                <NButton v-else @click="cancelEdit">返回列表</NButton>
              </div>
            </div>
          </template>

          <NSpin :show="loading">
            <div v-if="!isEditing" class="poi-list">
              <div v-if="pois.length === 0" class="empty">暂无兴趣点</div>
              <div
                v-for="poi in pois"
                :key="poi.id"
                class="poi-card"
                :class="{ active: poi.id === selectedPoiId }"
                @click="handleSelect(poi.id)"
              >
                <div class="poi-head">
                  <NTag size="small" :type="poi.id === selectedPoiId ? 'primary' : 'default'">
                    {{ poi.poiTag }}
                  </NTag>
                  <div class="poi-name">{{ poi.poiName }}</div>
                </div>
                <div class="poi-address">{{ poi.poiAddress }}</div>
                <div class="poi-actions">
                  <NButton size="tiny" @click.stop="startEdit(poi)">编辑</NButton>
                </div>
              </div>
            </div>

            <div v-else class="form-wrap">
              <NForm label-placement="left" label-width="72">
                <NFormItem label="标签">
                  <template v-if="mode === 'edit'">
                    <NInput v-model:value="form.poiTag" disabled />
                  </template>
                  <template v-else>
                    <NSelect v-model:value="tagType" :options="tagOptions" />
                  </template>
                </NFormItem>
                <NFormItem v-if="mode === 'create' && tagType === 'custom'" label="自定义">
                  <NInput v-model:value="form.poiTag" placeholder="请输入标签" />
                </NFormItem>
                <NFormItem label="名称">
                  <NInput v-model:value="form.poiName" placeholder="如：万科小区" />
                </NFormItem>
                <NFormItem label="地址">
                  <NInput
                    v-model:value="form.poiAddress"
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 3 }"
                  />
                </NFormItem>
                <NFormItem label="经纬度">
                  <div class="coords">
                    <NInput v-model:value="form.longitude" placeholder="经度" readonly />
                    <NInput v-model:value="form.latitude" placeholder="纬度" readonly />
                  </div>
                </NFormItem>
              </NForm>

              <div v-if="mode === 'create'" class="search-area">
                <div class="search-bar">
                  <NInput
                    v-model:value="searchKeyword"
                    placeholder="搜索兴趣点"
                    @keyup.enter="handleSearch"
                  />
                  <NButton :loading="searching" @click="handleSearch">搜索</NButton>
                </div>
                <div v-if="searchResults.length" class="search-results">
                  <div
                    v-for="result in searchResults"
                    :key="result.id"
                    class="search-item"
                    @click="applySearchResult(result)"
                  >
                    <div class="search-name">{{ result.name }}</div>
                    <div class="search-address">{{ result.address }}</div>
                  </div>
                </div>
                <div v-else-if="searchPerformed" class="search-empty">暂无搜索结果</div>
              </div>

              <div class="form-footer">
                <NButton
                  type="primary"
                  :loading="saving"
                  :disabled="!canSubmit"
                  @click="handleSave"
                >
                  {{ mode === 'edit' ? '保存修改' : '创建兴趣点' }}
                </NButton>
                <NButton @click="cancelEdit">取消</NButton>
                <NText v-if="tagDuplicate" depth="3" class="error-text">
                  标签已存在，请选择其他标签
                </NText>
              </div>
            </div>
          </NSpin>
        </NCard>
      </div>
    </div>
  </div>
</template>

<style scoped src="./AddressesView.css"></style>
