import api from '../request'

export function fetchAccounts() {
  return api.get('/api/accounts')
}

export function saveAccount(payload: any) {
  return api.post('/api/accounts', payload)
}

export function startAccount(uin: string) {
  return api.post(`/api/accounts/${uin}/start`)
}

export function stopAccount(uin: string) {
  return api.post(`/api/accounts/${uin}/stop`)
}

export function deleteAccount(uin: string) {
  return api.delete(`/api/accounts/${uin}`)
}

export function fetchAccountLogs(limit = 100) {
  return api.get(`/api/account-logs?limit=${Math.max(1, Number(limit) || 100)}`)
}

export function createQR() {
  return api.post('/api/qr/create')
}

export function checkQR(code: string) {
  return api.post('/api/qr/check', { code })
}
