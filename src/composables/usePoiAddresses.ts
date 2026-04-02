import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useUserLocationStore } from '@/stores/userLocation'
import { createUserPoi, getUserPois, updateUserPoi } from '@/api/poi'
import type { UserPoi } from '@/types/user'
import { useAmapPoiMap, type PoiSearchResult } from '@/composables/useAmapPoiMap'
import type { LngLatTuple } from '@/utils/amap'

type Mode = 'list' | 'create' | 'edit'
type TagType = 'home' | 'work' | 'custom'

export function usePoiAddresses() {
  const message = useMessage()
  const locationStore = useUserLocationStore()

  const mapEl = ref<HTMLDivElement | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const searching = ref(false)

  const mode = ref<Mode>('list')
  const pois = ref<UserPoi[]>([])
  const selectedPoiId = ref<number | null>(null)

  const form = reactive({
    id: null as number | null,
    poiTag: '',
    poiName: '',
    poiAddress: '',
    longitude: '',
    latitude: '',
  })

  const tagType = ref<TagType>('home')
  const searchKeyword = ref('')
  const searchResults = ref<PoiSearchResult[]>([])
  const searchPerformed = ref(false)

  const isEditing = computed(() => mode.value !== 'list')
  const existingTags = computed(() => new Set(pois.value.map((poi) => poi.poiTag.trim())))
  const tagOptions = computed(() => [
    {
      label: '家',
      value: 'home',
      disabled: mode.value === 'create' && existingTags.value.has('家'),
    },
    {
      label: '公司',
      value: 'work',
      disabled: mode.value === 'create' && existingTags.value.has('公司'),
    },
    {
      label: '自定义',
      value: 'custom',
    },
  ])

  const tagDuplicate = computed(() => {
    if (mode.value !== 'create') return false
    const tag = form.poiTag.trim()
    if (!tag) return false
    return existingTags.value.has(tag)
  })

  const canSubmit = computed(() => {
    if (!form.poiName.trim() || !form.poiAddress.trim()) return false
    if (!isFiniteNumber(form.longitude) || !isFiniteNumber(form.latitude)) return false
    if (mode.value === 'create') {
      if (!form.poiTag.trim()) return false
      if (tagDuplicate.value) return false
    }
    return true
  })

  const {
    mapBooting,
    geocoding,
    bootstrapMap,
    setMarkers,
    setActivePoi,
    setEditMode,
    setCenter,
    getCenter,
    reverseGeocode,
    searchPlaces,
  } = useAmapPoiMap(mapEl, {
    onMarkerClick: (id) => {
      if (mode.value !== 'list') return
      handleSelect(id)
    },
    onCenterChange: ({ lng, lat, address }) => {
      if (!isEditing.value) return
      form.longitude = formatCoord(lng)
      form.latitude = formatCoord(lat)
      if (address) {
        form.poiAddress = address
      }
    },
    onGeocodeError: (msg) => {
      if (msg) message.warning(msg)
    },
  })

  watch(selectedPoiId, (id) => {
    if (mode.value !== 'list') return
    setActivePoi(id)
  })

  watch(tagType, (next) => {
    if (mode.value !== 'create') return
    syncTagType(next)
  })

  function parsePoiPosition(poi: UserPoi): LngLatTuple | null {
    const lng = Number(poi.longitude)
    const lat = Number(poi.latitude)
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
    return [lng, lat]
  }

  function formatCoord(value: number): string {
    if (!Number.isFinite(value)) return String(value)
    return value.toFixed(6)
  }

  function isFiniteNumber(value: string): boolean {
    const n = Number(value)
    return Number.isFinite(n)
  }

  function resetForm() {
    form.id = null
    form.poiTag = ''
    form.poiName = ''
    form.poiAddress = ''
    form.longitude = ''
    form.latitude = ''
  }

  function syncTagType(next: TagType) {
    if (next === 'home') {
      form.poiTag = '家'
    } else if (next === 'work') {
      form.poiTag = '公司'
    } else if (next === 'custom' && (form.poiTag === '家' || form.poiTag === '公司')) {
      form.poiTag = ''
    }
  }

  function getDefaultTagType(): TagType {
    if (!existingTags.value.has('家')) return 'home'
    if (!existingTags.value.has('公司')) return 'work'
    return 'custom'
  }

  async function ensureBaseLocation() {
    let center = getCenter()
    let address = ''
    const loc = locationStore.location ?? (await locationStore.ensureLocation())
    if (loc) {
      const lng = Number(loc.longitude)
      const lat = Number(loc.latitude)
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        center = [lng, lat]
        address = loc.address
      }
    }

    if (!center) {
      center = [116.397428, 39.90923]
    }

    form.longitude = formatCoord(center[0])
    form.latitude = formatCoord(center[1])
    if (address) {
      form.poiAddress = address
    } else {
      try {
        form.poiAddress = await reverseGeocode(center)
      } catch (e: unknown) {
        message.warning(toErrorMessage(e))
      }
    }
    setCenter(center)
  }

  async function loadPois() {
    loading.value = true
    try {
      const data = await getUserPois()
      pois.value = Array.isArray(data) ? data : []
      syncMarkers()
      const first = pois.value[0]
      if (mode.value === 'list' && !selectedPoiId.value && first) {
        selectedPoiId.value = first.id
        setActivePoi(selectedPoiId.value)
      }
    } catch (e: unknown) {
      message.error(toErrorMessage(e))
    } finally {
      loading.value = false
    }
  }

  function syncMarkers() {
    const items = pois.value.flatMap((poi) => {
      const position = parsePoiPosition(poi)
      if (!position) return []
      return [{ id: poi.id, position }]
    })
    setMarkers(items)
  }

  function handleSelect(id: number) {
    selectedPoiId.value = id
  }

  async function startCreate() {
    mode.value = 'create'
    setEditMode(true)
    selectedPoiId.value = null
    searchResults.value = []
    searchKeyword.value = ''
    searchPerformed.value = false
    resetForm()
    tagType.value = getDefaultTagType()
    syncTagType(tagType.value)
    await ensureBaseLocation()
  }

  function startEdit(poi: UserPoi) {
    mode.value = 'edit'
    setEditMode(true)
    selectedPoiId.value = poi.id
    form.id = poi.id
    form.poiTag = poi.poiTag
    form.poiName = poi.poiName
    form.poiAddress = poi.poiAddress
    form.longitude = String(poi.longitude)
    form.latitude = String(poi.latitude)
    const position = parsePoiPosition(poi)
    if (position) setCenter(position)
  }

  function cancelEdit() {
    mode.value = 'list'
    setEditMode(false)
    searchResults.value = []
    searchKeyword.value = ''
    searchPerformed.value = false
    if (selectedPoiId.value) {
      setActivePoi(selectedPoiId.value)
    }
  }

  async function handleSearch() {
    const keyword = searchKeyword.value.trim()
    searchPerformed.value = true
    if (!keyword) {
      searchResults.value = []
      return
    }
    searching.value = true
    try {
      searchResults.value = await searchPlaces(keyword)
    } catch (e: unknown) {
      message.error(toErrorMessage(e))
    } finally {
      searching.value = false
    }
  }

  function applySearchResult(result: PoiSearchResult) {
    form.poiName = result.name
    form.poiAddress = result.address
    form.longitude = formatCoord(result.location[0])
    form.latitude = formatCoord(result.location[1])
    setCenter(result.location)
  }

  async function handleSave() {
    if (!canSubmit.value) return
    saving.value = true
    try {
      if (mode.value === 'create') {
        await createUserPoi({
          poiTag: form.poiTag.trim(),
          poiName: form.poiName.trim(),
          poiAddress: form.poiAddress.trim(),
          longitude: formatCoord(Number(form.longitude)),
          latitude: formatCoord(Number(form.latitude)),
        })
        message.success('兴趣点已创建')
      } else if (mode.value === 'edit' && form.id != null) {
        await updateUserPoi({
          id: form.id,
          poiTag: form.poiTag.trim(),
          poiName: form.poiName.trim(),
          poiAddress: form.poiAddress.trim(),
          longitude: formatCoord(Number(form.longitude)),
          latitude: formatCoord(Number(form.latitude)),
        })
        message.success('兴趣点已更新')
      }
      await loadPois()
      mode.value = 'list'
      setEditMode(false)
      const next = pois.value.find((poi) => poi.poiTag === form.poiTag)?.id ?? null
      selectedPoiId.value = next ?? pois.value[0]?.id ?? null
      setActivePoi(selectedPoiId.value)
    } catch (e: unknown) {
      message.error(toErrorMessage(e))
    } finally {
      saving.value = false
    }
  }

  onMounted(async () => {
    const loc = await locationStore.ensureLocation()
    let center: LngLatTuple | null = null
    if (loc) {
      const lng = Number(loc.longitude)
      const lat = Number(loc.latitude)
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        center = [lng, lat]
      }
    }
    try {
      await bootstrapMap(center)
    } catch (e: unknown) {
      message.error(toErrorMessage(e))
    }
    await loadPois()
  })

  return {
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
  }
}

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message || 'Unknown error'
  if (typeof e === 'string') return e
  return 'Unknown error'
}
