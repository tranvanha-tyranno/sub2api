<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@/components/icons'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { shopProducts, formatVnd } from './catalog'

const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()
const category = ref('all')
const search = ref('')
const product = computed(() => shopProducts.find(item => item.slug === route.params.slug))
const visibleProducts = computed(() => shopProducts.filter(item =>
  (category.value === 'all' || item.accent === category.value) &&
  `${item.name} ${item.company} ${item.credit}`.toLowerCase().includes(search.value.trim().toLowerCase())
))
const siteName = computed(() => appStore.siteName || 'Sub2API')
const categories = [
  { id: 'all', label: 'Tất cả sản phẩm', count: shopProducts.length },
  { id: 'codex', label: 'API Codex', count: 3 },
  { id: 'gemini', label: 'API Gemini', count: 3 }
]
const cover = (accent: 'codex' | 'gemini') => `/shop/${accent}-cover.svg`
</script>

<template>
  <div class="shop-page">
    <header class="shop-header">
      <div class="shop-container shop-header-inner">
        <router-link to="/shop" class="shop-brand" :aria-label="`${siteName} - cửa hàng`">
          <img :src="appStore.siteLogo || '/logo.svg'" alt="" class="shop-brand-logo" />
          <span>{{ siteName }}</span>
        </router-link>
        <nav class="shop-nav" aria-label="Điều hướng chính">
          <router-link to="/shop" class="shop-nav-link">Sản phẩm</router-link>
          <router-link v-if="authStore.isAuthenticated" to="/dashboard" class="shop-nav-link">Tài khoản</router-link>
        </nav>
        <div class="shop-account-actions">
          <template v-if="!authStore.isAuthenticated">
            <router-link to="/login?redirect=/shop" class="shop-login">Đăng nhập</router-link>
            <router-link to="/register?redirect=/shop" class="shop-register">Đăng ký</router-link>
          </template>
          <router-link v-else to="/dashboard" class="shop-register">Bảng điều khiển</router-link>
        </div>
      </div>
    </header>

    <main v-if="!route.params.slug" class="shop-container shop-shell">
      <aside class="shop-sidebar" aria-label="Danh mục sản phẩm">
        <h2>Danh mục sản phẩm</h2>
        <div class="shop-category-list">
          <button v-for="item in categories" :key="item.id" type="button" :class="['shop-category', { active: category === item.id }]" :aria-pressed="category === item.id" @click="category = item.id">
            <span class="shop-category-icon">{{ item.id === 'all' ? '◇' : item.id === 'codex' ? '⌘' : '✦' }}</span>
            <span class="shop-category-label">{{ item.label }}</span>
            <small>{{ item.count }} gói</small>
          </button>
        </div>
        <div class="shop-sidebar-bottom"><span>API CREDIT</span><strong>Codex<br />& Gemini</strong><small>06 gói đang hiển thị</small></div>
      </aside>

      <section class="shop-content" aria-label="Các gói API">
        <div class="shop-breadcrumb"><router-link to="/shop">Trang chủ</router-link><Icon name="chevronRight" size="xs" /><strong>Sản phẩm API</strong></div>
        <div class="shop-content-heading"><div><span class="shop-heading-kicker">CỬA HÀNG API</span><h1>{{ category === 'all' ? 'Tất cả gói API' : category === 'codex' ? 'Gói API Codex' : 'Gói API Gemini' }}</h1></div><span>{{ visibleProducts.length }} gói</span></div>
        <div class="shop-toolbar">
          <div class="shop-mobile-categories" role="group" aria-label="Lọc theo dịch vụ">
            <button v-for="item in categories" :key="item.id" type="button" :class="{ active: category === item.id }" :aria-pressed="category === item.id" @click="category = item.id">{{ item.label }}</button>
          </div>
          <label class="shop-search"><Icon name="search" size="sm" /><span class="sr-only">Tìm gói</span><input v-model="search" type="search" placeholder="Tìm gói API..." /></label>
        </div>
        <div v-if="visibleProducts.length" class="shop-grid">
          <article v-for="item in visibleProducts" :key="item.slug" class="shop-product-card">
            <router-link :to="`/shop/${item.slug}`" class="shop-product-art" :aria-label="`Xem gói ${item.name}`"><img :src="cover(item.accent)" :alt="`Ảnh bìa API ${item.provider}`" /><span class="shop-art-badge">{{ item.provider }}</span></router-link>
            <div class="shop-product-body">
              <h2><router-link :to="`/shop/${item.slug}`">API {{ item.name }}</router-link></h2>
              <p class="shop-credit-line">{{ item.credit }} credit · Dùng đến khi hết</p>
              <strong class="shop-price">{{ formatVnd(item.price) }}</strong>
              <span class="shop-price-note">Giá tham khảo</span>
              <ul><li v-for="tag in item.compatibility" :key="tag"><Icon name="check" size="xs" />{{ tag }}</li></ul>
              <router-link :to="`/shop/${item.slug}`" class="shop-card-action">Xem gói <Icon name="chevronRight" size="sm" /></router-link>
            </div>
          </article>
        </div>
        <p v-else class="shop-empty">Không tìm thấy gói phù hợp.</p>
      </section>

      <aside class="shop-aside" aria-label="Thông tin cửa hàng">
        <section class="shop-aside-panel"><h2>Thông tin sản phẩm</h2><div class="shop-info-list"><div><span>Dịch vụ</span><strong>Codex · Gemini</strong></div><div><span>Gói hiện có</span><strong>06 gói</strong></div><div><span>Credit</span><strong>10 / 50 / 100</strong></div><div><span>Thời hạn</span><strong>Dùng đến khi hết</strong></div><div><span>Trạng thái</span><strong class="shop-status">Chưa mở bán</strong></div></div></section>
        <section class="shop-aside-panel shop-aside-help"><h2>Câu hỏi thường gặp</h2><div><strong>Giá đã chính thức chưa?</strong><p>Giá hiện chỉ để tham khảo và có thể thay đổi khi mở bán.</p></div><div><strong>Có thể mua gói ngay không?</strong><p>Chức năng đặt hàng và cấp credit đang được hoàn thiện.</p></div></section>
        <div class="shop-aside-note">Giá và quy đổi credit hiện là dữ liệu mẫu.</div>
      </aside>
    </main>

    <main v-else-if="product" class="shop-container shop-detail">
      <div class="shop-breadcrumb"><router-link to="/shop">Sản phẩm</router-link><Icon name="chevronRight" size="xs" /><strong>API {{ product.name }}</strong></div>
      <div class="shop-detail-grid">
        <div class="shop-detail-media"><img :src="cover(product.accent)" :alt="`Ảnh bìa API ${product.provider}`" /><div class="shop-detail-other"><span>Các gói {{ product.provider }} khác</span><router-link v-for="item in shopProducts.filter(entry => entry.accent === product?.accent && entry.slug !== product?.slug)" :key="item.slug" :to="`/shop/${item.slug}`">{{ item.credit }} credit <Icon name="chevronRight" size="xs" /></router-link></div></div>
        <div class="shop-detail-summary">
          <span class="shop-heading-kicker">{{ product.company }} / API CREDIT</span>
          <h1>API {{ product.name }}</h1>
          <p>{{ product.description }}</p>
          <div class="shop-detail-price"><strong>{{ formatVnd(product.price) }}</strong><span>Giá tham khảo · {{ product.credit }} credit</span></div>
          <div class="shop-detail-spec"><span>Credit</span><strong>{{ product.credit }} credit</strong></div><div class="shop-detail-spec"><span>Thời hạn</span><strong>Dùng đến khi hết</strong></div><div class="shop-detail-spec"><span>Tương thích</span><strong>{{ product.compatibility.join(', ') }}</strong></div>
          <button type="button" class="shop-unavailable" disabled>Chưa mở bán</button>
          <p class="shop-sale-note">Giá và quy đổi credit chỉ là dữ liệu mẫu. Chức năng đặt hàng và cấp credit đang được hoàn thiện.</p>
          <router-link v-if="!authStore.isAuthenticated" :to="{ path: '/register', query: { redirect: route.fullPath } }" class="shop-auth-link">Tạo tài khoản <Icon name="chevronRight" size="xs" /></router-link>
          <router-link v-else to="/dashboard" class="shop-auth-link">Vào tài khoản <Icon name="chevronRight" size="xs" /></router-link>
        </div>
      </div>
    </main>
    <main v-else class="shop-container shop-empty shop-not-found"><h1>Gói không tồn tại</h1><router-link to="/shop">Quay lại cửa hàng</router-link></main>
    <footer class="shop-footer"><div class="shop-container"><span>{{ siteName }} · API Store</span><span>Giá hiển thị chỉ để tham khảo</span></div></footer>
  </div>
</template>

<style src="./shop.css"></style>
