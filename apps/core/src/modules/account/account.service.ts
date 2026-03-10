import { Injectable, NotFoundException } from '@nestjs/common'
import { AccountManagerService } from '../../game/account-manager.service'
import { GameLogService } from '../../game/game-log.service'
import { StoreService } from '../../store/store.service'

@Injectable()
export class AccountService {
  constructor(
    private manager: AccountManagerService,
    private store: StoreService,
    private gameLog: GameLogService
  ) {}

  getAccounts() {
    return this.manager.getAccounts()
  }

  async createOrUpdateAccount(payload: any) {
    const isUpdateById = !!payload.id
    const resolvedUpdateId = isUpdateById ? this.manager.resolveAccountId(payload.id) : ''
    const body = isUpdateById ? { ...payload, id: resolvedUpdateId || String(payload.id) } : payload

    const before = this.manager.getAccounts()
    const beforeAccounts = before.accounts || []

    // 显式 id 更新：以 id 为主；否则（QQ 平台）尝试按 uin+platform 匹配已有账号
    let targetBefore: any = null
    if (isUpdateById) {
      targetBefore = beforeAccounts.find((a: any) => String(a.id) === String(body.id))
    } else if (payload.uin && (payload.platform || 'qq') === 'qq') {
      const uin = String(payload.uin)
      const platform = String(payload.platform || 'qq')
      targetBefore = beforeAccounts.find((a: any) =>
        String(a.uin) === uin && String(a.platform || 'qq') === platform
      )
    }

    const data = this.store.addOrUpdateAccount(body)
    const afterAccounts = data.accounts || []

    // 先按 QQ uin+platform 匹配最新账号，否则回退到 id；用于日志与启动/重启
    let targetAfter: any = null
    if (payload.uin && (payload.platform || 'qq') === 'qq') {
      const uin = String(payload.uin)
      const platform = String(payload.platform || 'qq')
      targetAfter = afterAccounts.find((a: any) =>
        String(a.uin) === uin && String(a.platform || 'qq') === platform
      )
    }
    if (!targetAfter && isUpdateById) {
      targetAfter = afterAccounts.find((a: any) => String(a.id) === String(body.id))
    }

    const accountId = targetAfter
      ? String(targetAfter.id)
      : (isUpdateById
          ? String(body.id)
          : String((afterAccounts.at(-1) || {}).id || ''))

    const effectiveIsUpdate = !!targetBefore

    this.manager.addAccountLog(
      effectiveIsUpdate ? 'update' : 'add',
      effectiveIsUpdate
        ? `更新账号: ${(targetAfter && (targetAfter.name || targetAfter.nick)) || body.name || accountId}`
        : `添加账号: ${(targetAfter && (targetAfter.name || targetAfter.nick)) || body.name || accountId}`,
      accountId,
      (targetAfter && (targetAfter.name || targetAfter.nick)) || body.name || ''
    )

    if (!effectiveIsUpdate) {
      const newAcc = afterAccounts.find((a: any) => String(a.id) === accountId) || afterAccounts.at(-1)
      if (newAcc)
        await this.manager.startAccount(String(newAcc.id))
    }

    await this.manager.syncGhostConnections()
    this.manager.notifyAccountsUpdate()
    return this.manager.getAccounts()
  }

  /** 删除账号：先停止 core 侧 runner，再通知 link 真正断开连接并清理 store */
  async deleteAccount(id: string) {
    const resolvedId = this.manager.resolveAccountId(id) || String(id)
    const before = this.manager.getAccounts()
    const target = (before.accounts || []).find((a: any) =>
      String(a.id) === resolvedId || String(a.uin) === id || String(a.qq) === id
    )

    await this.manager.stopAccount(resolvedId)
    await this.manager.disconnectFromLink(resolvedId)
    const data = this.store.deleteAccount(resolvedId)
    this.gameLog.deleteAccountLogs(resolvedId)
    await this.manager.syncGhostConnections()

    this.manager.addAccountLog(
      'delete',
      `删除账号: ${(target && target.name) || id}`,
      resolvedId,
      target ? target.name : ''
    )

    this.manager.notifyAccountsUpdate()
    return data
  }

  async startAccount(id: string) {
    const resolvedId = (this.manager.resolveAccountId(id) || String(id || '').trim()).trim()
    if (!resolvedId)
      throw new NotFoundException('账号未找到')
    const acc = this.store.getAccountById(resolvedId)
    if (!acc)
      throw new NotFoundException('账号未找到')
    if (!acc.code || String(acc.code).trim() === '') {
      throw new NotFoundException('请先扫码登录获取 Code 后再启动')
    }
    const ok = await this.manager.startAccount(resolvedId)
    if (!ok)
      throw new NotFoundException('账号已在运行中')
    return null
  }

  async stopAccount(id: string) {
    const resolvedId = this.manager.resolveAccountId(id)
    await this.manager.stopAccount(resolvedId)
    return null
  }

  updateRemark(body: any) {
    const rawRef = body.id || body.accountId || body.uin
    const accounts = this.manager.getAccounts().accounts || []
    const target = accounts.find((a: any) =>
      String(a.id) === String(rawRef) || String(a.uin) === String(rawRef) || String(a.qq) === String(rawRef)
    )

    if (!target?.id)
      throw new NotFoundException('账号未找到')

    const remark = String(body.remark ?? body.name ?? '').trim()
    if (!remark)
      throw new NotFoundException('缺少备注')

    this.store.addOrUpdateAccount({ id: String(target.id), name: remark })
    this.manager.setRuntimeAccountName(String(target.id), remark)
    this.manager.addAccountLog('update', `更新账号备注: ${remark}`, String(target.id), remark)
    this.manager.notifyAccountsUpdate()

    return this.manager.getAccounts()
  }

  getAccountLogs(limit: number) {
    return this.manager.getAccountLogs(limit)
  }
}
