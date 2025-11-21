import { httpPost, httpGet } from '@/utils/http'

export interface Result<T = any> {
  code: number
  message: string
  data: T
}

export interface RechargeDTO {
  amount: number
  payType: number // 1-微信，2-支付宝
  returnUrl: string
}

export interface WithdrawDTO {
  amount: number
  withdrawType: number // 1-微信，2-支付宝
  account?: string
  realName?: string
}

export interface PaymentRecord {
  id: number
  amount: number
  status: number // 0: Pending, 1: Success, 2: Fail
  createTime: string
  payType?: number // 1-微信，2-支付宝
  paymentMethod?: string
  remark?: string
  orderNo?: string
}

export interface BalanceData {
  availableBalance: number
  frozenBalance: number
  totalBalance: number
}

// 创建充值订单
export const createRecharge = (data: RechargeDTO) => {
  return httpPost<Result<string>>('/payment/recharge', data)
}

// 申请提现
export const applyWithdraw = (data: WithdrawDTO) => {
  return httpPost<Result<any>>('/payment/withdraw/apply', data)
}

// 查询充值记录
export const getRechargeRecords = (page: number = 1, size: number = 10) => {
  return httpGet<Result<{ records: PaymentRecord[], total: number, current: number, size: number }>>('/payment/recharge/records', { page, size })
}

// 查询提现记录
export const getWithdrawRecords = (page: number = 1, size: number = 10) => {
  return httpGet<Result<{ records: PaymentRecord[], total: number, current: number, size: number }>>('/payment/withdraw/records', { page, size })
}

// 查询用户余额
export const getUserBalance = () => {
  return httpGet<Result<BalanceData>>('/payment/balance')
}
