<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserStore } from '@/stores/modules/user'
import { getUserBalance, createRecharge, applyWithdraw, getRechargeRecords, getWithdrawRecords } from '@/api/payment'
import type { BalanceData, PaymentRecord } from '@/api/payment'
import { useRouter, useRoute } from 'vue-router'
import AuthTabs from '@/components/Auth/AuthTabs.vue'

const router = useRouter()
const route = useRoute()
const userStore = UserStore()
const loading = ref(false)
const authVisible = ref(false)

// 钱包相关状态
const balance = reactive<BalanceData>({
  availableBalance: 0,
  frozenBalance: 0,
  totalBalance: 0
})
const rechargeVisible = ref(false)
const withdrawVisible = ref(false)
const recordsVisible = ref(false)
const activeRecordTab = ref('recharge')

const rechargeForm = reactive({
  amount: 0,
  paymentMethod: 'ALIPAY' as 'ALIPAY' | 'WECHAT'
})

const withdrawForm = reactive({
  amount: 0,
  paymentMethod: 'ALIPAY' as 'ALIPAY' | 'WECHAT',
  account: '',
  realName: ''
})

const rechargeRecords = ref<PaymentRecord[]>([])
const withdrawRecords = ref<PaymentRecord[]>([])
const recordPage = ref(1)
const recordSize = ref(10)
const recordTotal = ref(0)
const recordLoading = ref(false)

// 预设金额
const presetAmounts = [10, 30, 50, 100, 200, 500]

// 选择充值金额
const selectRechargeAmount = (amount: number) => {
  rechargeForm.amount = amount
}

// 选择提现金额
const selectWithdrawAmount = (amount: number) => {
  withdrawForm.amount = amount
}

// 获取余额
const fetchBalance = async () => {
  try {
    const res = await getUserBalance()
    if (res.code === 0) {
      Object.assign(balance, res.data)
    }
  } catch (error) {
    console.error('获取余额失败', error)
  }
}

// 打开充值
const openRecharge = () => {
  rechargeForm.amount = 0
  rechargeForm.paymentMethod = 'ALIPAY'
  rechargeVisible.value = true
}

// 提交充值
const handleRecharge = async () => {
  if (rechargeForm.amount <= 0) {
    ElMessage.warning('请输入有效的充值金额')
    return
  }
  loading.value = true
  try {
    const params = {
      amount: rechargeForm.amount,
      payType: rechargeForm.paymentMethod === 'ALIPAY' ? 2 : 1,
      returnUrl: window.location.href
    }
    const res: any = await createRecharge(params)
    console.log('充值响应:', res)

    // 处理直接返回HTML字符串的情况
    if (typeof res === 'string') {
      const div = document.createElement('div')
      div.innerHTML = res
      document.body.appendChild(div)
      const form = div.querySelector('form')
      if (form) {
        form.submit()
        rechargeVisible.value = false
      } else {
        ElMessage.error('支付表单生成失败')
      }
      return
    }

    if (res.code === 0) {
      const result = res.message
      
      if (result) {
        if (typeof result === 'string') {
          if (result.startsWith('http')) {
            window.location.href = result
          } else {
            // 如果是HTML表单，创建一个div插入并提交
            const div = document.createElement('div')
            div.innerHTML = result
            document.body.appendChild(div)
            const form = div.querySelector('form')
            if (form) form.submit()
          }
          rechargeVisible.value = false
        } else {
          console.error('支付数据格式错误:', result)
          ElMessage.error('支付数据格式错误')
        }
      } else {
        ElMessage.error('获取支付信息为空')
      }
    } else {
      ElMessage.error(res.message || '创建充值订单失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '充值失败')
  } finally {
    loading.value = false
  }
}

// 打开提现
const openWithdraw = () => {
  withdrawForm.amount = 0
  withdrawForm.paymentMethod = 'ALIPAY'
  withdrawForm.account = ''
  withdrawForm.realName = ''
  withdrawVisible.value = true
}

// 提交提现
const handleWithdraw = async () => {
  if (withdrawForm.amount <= 0) {
    ElMessage.warning('请输入有效的提现金额')
    return
  }
  if (withdrawForm.amount > balance.availableBalance) {
    ElMessage.warning('余额不足')
    return
  }
  loading.value = true
  try {
    const params = {
      amount: withdrawForm.amount,
      withdrawType: withdrawForm.paymentMethod === 'ALIPAY' ? 2 : 1,
      account: withdrawForm.account,
      realName: withdrawForm.realName
    }
    const res = await applyWithdraw(params)
    if (res.code === 0) {
      ElMessage.success('提现申请已提交，等待审核')
      withdrawVisible.value = false
      fetchBalance() // 刷新余额
    } else {
      ElMessage.error(res.message || '提现申请失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '提现失败')
  } finally {
    loading.value = false
  }
}

// 打开记录
const openRecords = () => {
  recordsVisible.value = true
  fetchRecords()
}

// 获取记录
const fetchRecords = async () => {
  recordLoading.value = true
  try {
    if (activeRecordTab.value === 'recharge') {
      const res = await getRechargeRecords(recordPage.value, recordSize.value)
      if (res.code === 0) {
        const data = res.data as any
        rechargeRecords.value = data.records || data.list || data.items || []
        recordTotal.value = Number(data.total) || 0
      }
    } else {
      const res = await getWithdrawRecords(recordPage.value, recordSize.value)
      if (res.code === 0) {
        const data = res.data as any
        withdrawRecords.value = data.records || data.list || data.items || []
        recordTotal.value = Number(data.total) || 0
      }
    }
  } catch (error) {
    console.error('获取记录失败', error)
  } finally {
    recordLoading.value = false
  }
}

const handleTabChange = () => {
  recordPage.value = 1
  fetchRecords()
}

const handlePageChange = (page: number) => {
  recordPage.value = page
  fetchRecords()
}

// 检查是否是支付宝回调
const checkAlipayReturn = () => {
  const { out_trade_no } = route.query
  if (out_trade_no) {
    ElMessage.success('支付操作已提交，正在更新余额...')
    setTimeout(() => {
      fetchBalance()
    }, 1500)
    setTimeout(() => {
      fetchBalance()
    }, 4000)
    router.replace({ path: route.path, query: {} })
  }
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    authVisible.value = true
  } else {
    fetchBalance()
    checkAlipayReturn()
  }
})
</script>

<template>
  <div class="wallet-container">
    <div class="wallet-header">
      <h2 class="page-title">我的钱包</h2>
      <div class="header-actions">
        <el-button link @click="openRecords">
          <icon-ep:document class="mr-1" /> 交易记录
        </el-button>
      </div>
    </div>

    <div class="balance-card">
      <div class="coin-icon">
        <span class="currency-symbol">¥</span>
      </div>
      <div class="balance-label">我的零钱</div>
      <div class="balance-amount">{{ balance.availableBalance.toFixed(2) }}</div>
      
      <div class="action-buttons">
        <el-button type="success" class="action-btn recharge-btn" @click="openRecharge">充值</el-button>
        <el-button class="action-btn withdraw-btn" @click="openWithdraw">提现</el-button>
      </div>
    </div>

    <!-- 充值弹窗 -->
    <el-dialog v-model="rechargeVisible" title="充值" width="480px" append-to-body destroy-on-close custom-class="wallet-dialog">
      <div class="dialog-content">
        <div class="section-label">充值金额</div>
        <div class="amount-grid">
          <div 
            v-for="amount in presetAmounts" 
            :key="amount"
            class="amount-item"
            :class="{ active: rechargeForm.amount === amount }"
            @click="selectRechargeAmount(amount)"
          >
            {{ amount }}元
          </div>
        </div>
        <div class="custom-amount">
          <el-input-number 
            v-model="rechargeForm.amount" 
            :min="0.01" 
            :precision="2" 
            :step="10" 
            placeholder="自定义金额"
            style="width: 100%" 
            :controls="false"
          />
        </div>

        <div class="section-label mt-4">支付方式</div>
        <div class="payment-methods">
          <div 
            class="payment-item"
            :class="{ active: rechargeForm.paymentMethod === 'ALIPAY' }"
            @click="rechargeForm.paymentMethod = 'ALIPAY'"
          >
            <icon-ri:alipay-fill class="payment-icon alipay" />
            <span class="payment-name">支付宝</span>
            <div class="check-mark" v-if="rechargeForm.paymentMethod === 'ALIPAY'">
              <icon-ep:check />
            </div>
          </div>
          <div 
            class="payment-item"
            :class="{ active: rechargeForm.paymentMethod === 'WECHAT' }"
            @click="rechargeForm.paymentMethod = 'WECHAT'"
          >
            <icon-ri:wechat-fill class="payment-icon wechat" />
            <span class="payment-name">微信支付</span>
            <div class="check-mark" v-if="rechargeForm.paymentMethod === 'WECHAT'">
              <icon-ep:check />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer-btn">
          <el-button type="primary" :loading="loading" @click="handleRecharge" class="w-full" size="large" round>立即充值</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 提现弹窗 -->
    <el-dialog v-model="withdrawVisible" title="提现" width="480px" append-to-body destroy-on-close custom-class="wallet-dialog">
      <div class="dialog-content">
        <div class="balance-display">
          <span class="label">当前余额</span>
          <span class="value">¥ {{ balance.availableBalance.toFixed(2) }}</span>
        </div>

        <div class="section-label">提现到</div>
        <div class="payment-methods">
          <div 
            class="payment-item"
            :class="{ active: withdrawForm.paymentMethod === 'ALIPAY' }"
            @click="withdrawForm.paymentMethod = 'ALIPAY'"
          >
            <icon-ri:alipay-fill class="payment-icon alipay" />
            <span class="payment-name">支付宝</span>
            <div class="check-mark" v-if="withdrawForm.paymentMethod === 'ALIPAY'">
              <icon-ep:check />
            </div>
          </div>
          <div 
            class="payment-item"
            :class="{ active: withdrawForm.paymentMethod === 'WECHAT' }"
            @click="withdrawForm.paymentMethod = 'WECHAT'"
          >
            <icon-ri:wechat-fill class="payment-icon wechat" />
            <span class="payment-name">微信支付</span>
            <div class="check-mark" v-if="withdrawForm.paymentMethod === 'WECHAT'">
              <icon-ep:check />
            </div>
          </div>
        </div>

        <div class="section-label mt-4">提现金额</div>
        <div class="amount-grid">
          <div 
            v-for="amount in presetAmounts" 
            :key="amount"
            class="amount-item"
            :class="{ active: withdrawForm.amount === amount }"
            @click="selectWithdrawAmount(amount)"
          >
            提现{{ amount }}元
          </div>
        </div>
        <div class="custom-amount">
          <el-input-number 
            v-model="withdrawForm.amount" 
            :min="0.01" 
            :max="balance.availableBalance"
            :precision="2" 
            :step="10" 
            placeholder="自定义金额"
            style="width: 100%" 
            :controls="false"
          />
        </div>

        <div class="account-inputs mt-4">
          <el-input v-model="withdrawForm.account" placeholder="请输入收款账号" class="mb-2">
            <template #prefix>
              <icon-ep:user />
            </template>
          </el-input>
          <el-input v-model="withdrawForm.realName" placeholder="请输入真实姓名">
            <template #prefix>
              <icon-ep:postcard />
            </template>
          </el-input>
        </div>

        <div class="notes mt-4">
          <div class="note-title">注意事项</div>
          <div class="note-item">1. 提现申请将在申请成功后1-3个工作日审批到账，请耐心等待</div>
          <div class="note-item">2. 请确保收款账号和真实姓名一致，否则可能导致提现失败</div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer-btn">
          <el-button type="warning" :loading="loading" @click="handleWithdraw" class="w-full" size="large" round color="#ff9800">立即提现</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 记录弹窗 -->
    <el-dialog v-model="recordsVisible" title="交易记录" width="800px" append-to-body destroy-on-close>
      <el-tabs v-model="activeRecordTab" @tab-change="handleTabChange">
        <el-tab-pane label="充值记录" name="recharge">
          <el-table :data="rechargeRecords" v-loading="recordLoading" style="width: 100%">
            <el-table-column prop="createTime" label="时间" width="180" />
            <el-table-column prop="amount" label="金额">
              <template #default="{ row }">
                ¥ {{ row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="payType" label="方式">
               <template #default="{ row }">
                {{ (row.payType === 2 || row.paymentMethod === 'ALIPAY') ? '支付宝' : (row.payType === 1 || row.paymentMethod === 'WECHAT') ? '微信' : '未知' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'">
                  {{ row.status === 1 ? '成功' : row.status === 2 ? '失败' : '处理中' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="提现记录" name="withdraw">
          <el-table :data="withdrawRecords" v-loading="recordLoading" style="width: 100%">
            <el-table-column prop="createTime" label="时间" width="180" />
            <el-table-column prop="amount" label="金额">
              <template #default="{ row }">
                ¥ {{ row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="payType" label="方式">
               <template #default="{ row }">
                {{ (row.payType === 2 || row.paymentMethod === 'ALIPAY') ? '支付宝' : (row.payType === 1 || row.paymentMethod === 'WECHAT') ? '微信' : '未知' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'">
                  {{ row.status === 1 ? '成功' : row.status === 2 ? '失败' : '审核中' }}
                </el-tag>
              </template>
            </el-table-column>
             <el-table-column prop="remark" label="备注" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="recordPage"
          v-model:page-size="recordSize"
          :total="recordTotal"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-dialog>

    <!-- 登录弹窗 -->
    <AuthTabs v-model="authVisible" />
  </div>
</template>

<style scoped>
.wallet-container {
  max-width: 800px;
  margin: 30px auto;
  padding: 0 20px;
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.balance-card {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.coin-icon {
  width: 64px;
  height: 64px;
  background-color: #fef0f0;
  color: #f56c6c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.currency-symbol {
  font-size: 32px;
  font-weight: bold;
}

.balance-label {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.balance-amount {
  font-size: 48px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  margin-bottom: 40px;
  font-family: 'DIN Alternate', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.action-buttons {
  display: flex;
  gap: 20px;
  width: 100%;
  max-width: 400px;
  justify-content: center;
}

.action-btn {
  flex: 1;
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
}

.recharge-btn {
  background-color: #07c160;
  border-color: #07c160;
}

.recharge-btn:hover {
  background-color: #06ad56;
  border-color: #06ad56;
}

.withdraw-btn {
  background-color: #f2f2f2;
  border-color: #f2f2f2;
  color: #333;
}

.withdraw-btn:hover {
  background-color: #e6e6e6;
  border-color: #e6e6e6;
  color: #333;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* Dialog Styles */
.section-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
  font-weight: 500;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.amount-item {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px 0;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.amount-item:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.amount-item.active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: bold;
}

.custom-amount {
  margin-bottom: 20px;
}

.payment-methods {
  display: flex;
  gap: 12px;
}

.payment-item {
  flex: 1;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.payment-item:hover {
  border-color: var(--el-color-primary);
}

.payment-item.active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.payment-icon {
  font-size: 24px;
  margin-right: 8px;
}

.payment-icon.alipay {
  color: #1677ff;
}

.payment-icon.wechat {
  color: #07c160;
}

.check-mark {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 0;
  height: 0;
  border-top: 20px solid var(--el-color-primary);
  border-left: 20px solid transparent;
  border-top-right-radius: 8px;
}

.check-mark :deep(svg) {
  position: absolute;
  top: -18px;
  right: 1px;
  font-size: 12px;
  color: white;
}

.balance-display {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.balance-display .label {
  color: var(--el-text-color-secondary);
}

.balance-display .value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.notes {
  background-color: #fff7e6;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #ff9800;
}

.note-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.note-item {
  line-height: 1.6;
  opacity: 0.9;
}

.mt-4 {
  margin-top: 16px;
}

.mb-2 {
  margin-bottom: 8px;
}

.w-full {
  width: 100%;
}
</style>
