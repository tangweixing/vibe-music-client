<script setup lang="ts">
import { defineAsyncComponent, provide } from 'vue'
import { AudioPlayer } from '@/hooks/useAudioPlayer'
const Header = defineAsyncComponent(() => import('@/layout/components/header/index.vue'))
const Aside = defineAsyncComponent(() => import('@/layout/components/aside/index.vue'))
const Main = defineAsyncComponent(() => import('@/layout/components/main/index.vue'))
const Footer = defineAsyncComponent(() => import('@/layout/components/footer/index.vue'))
provide('audioPlayer', AudioPlayer())
</script>

<template>
  <div class="absolute w-full flex flex-col h-full">
    <div class="w-full flex flex-col h-full overflow-hidden bg-themeBgColor backdrop-blur-lg">
      <Header />
      <div class="flex flex-1 overflow-hidden">
        <Aside />
        <Main />
      </div>
      <Footer />
    </div>
  </div>
</template>
