<script setup lang="ts">
import logo from './assets/electron.svg'
const { ipcRenderer } = window as any

const handleSendMessage = async () => {

  ipcRenderer.invoke('open-win', 'https://www.baidu.com')

  const res = await ipcRenderer.invoke('system-info')
  console.log("handleSendMessage:", res)
  const params = {
    title: 'Hello World',
    message: 'This is a message from the main process!',
    buttons: ['OK', 'Cancel']
  }
  ipcRenderer.invoke('echo',params).then((res: any) => {
    console.log("echo:", res)
  }).catch((err: any) => {
    console.error("echo error:", err)
  })
}

</script>

<template>
  <div class="flex flex-col w-full items-center justify-between p-4 gap-8">
    <el-image
      :src="logo"
      fit="contain"/>

    <el-button type="primary" @click="handleSendMessage">
      Open Window  
    </el-button>  
  </div>
</template>

<style scoped lang="scss"></style>
