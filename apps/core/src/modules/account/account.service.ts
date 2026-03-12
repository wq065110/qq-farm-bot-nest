import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AccountManagerService } from '../../game/account-manager.service'
import { GameLogService } from '../../game/game-log.service'
import { StoreService } from '../../store/store.service'

@Injectable()
export class AccountService {
  private importLocks = new Map<string, Promise<any>>()

  constructor(
    private manager: AccountManagerService,
    private store: StoreService,
    private gameLog: GameLogService
  ) {}

  getAccounts() {
    return this.manager.getAccounts()
  }

  async createOrUpdateAccount(payload: any) {
    const skipAutoStart = payload?.skipAutoStart === true
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

    const loginType = String(payload?.loginType || '').trim()
    const hasLoginCodeUpdate = payload?.code !== undefined && String(payload.code || '').trim() !== ''

    this.manager.addAccountLog(
      effectiveIsUpdate ? 'update' : 'add',
      effectiveIsUpdate
        ? `更新账号: ${(targetAfter && (targetAfter.name || targetAfter.nick)) || body.name || accountId}`
        : `添加账号: ${(targetAfter && (targetAfter.name || targetAfter.nick)) || body.name || accountId}`,
      accountId,
      (targetAfter && (targetAfter.name || targetAfter.nick)) || body.name || ''
    )

    // 手动填码登录：写入农场日志（运行日志），便于统一查看
    if (loginType === 'manual' && hasLoginCodeUpdate) {
      const accName = (targetAfter && (targetAfter.name || targetAfter.nick)) || body.name || ''
      this.gameLog.appendLog(accountId, accName, {
        msg: `手动填码更新登录信息${effectiveIsUpdate ? '' : '并添加账号'}${accName ? `: ${accName}` : ''}`,
        tag: '系统',
        meta: { module: 'system', event: 'login_manual' }
      })
    }

    if (!effectiveIsUpdate && !skipAutoStart) {
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

  /**
   * 从 WS 连接 URL 解析 code/platform，临时连接游戏获取 openId，
   * 再合并/创建真实账号并改绑连接，最后启动账号。
   */
  async importFromUrl(url: string) {
    const raw = typeof url === 'string' ? url.trim() : ''
    if (!raw)
      throw new BadRequestException('缺少 url 参数')

    let parsed: URL
    try {
      parsed = new URL(raw)
    } catch {
      throw new BadRequestException('无效的 URL')
    }

    const code = parsed.searchParams.get('code')?.trim()
    const platform = parsed.searchParams.get('platform')?.trim() || 'qq'

    if (!code)
      throw new BadRequestException('URL 中缺少 code 参数')

    // 防重入：同一时间只允许一个导入在执行（code 每次不同，用全局锁避免短时间多请求重复执行）
    const lockKey = '__import__'
    if (this.importLocks.has(lockKey)) {
      throw new BadRequestException('已有账号正在导入中，请稍后再试')
    }

    const lockPromise = this.doImport(code, platform)
    this.importLocks.set(lockKey, lockPromise)
    try {
      await lockPromise
      return null
    } finally {
      this.importLocks.delete(lockKey)
    }
  }

  private async doImport(code: string, platform: string) {
    const normalizedPlatform = (platform || 'qq').trim() || 'qq'
    const tempId = `import_${Date.now()}`

    // 仅建立一次连接：使用临时账号 ID 连接游戏，获取 openId / 昵称等
    const userState = await (this.manager as any).linkClient.connectAccount(tempId, code, normalizedPlatform).catch((e: any) => {
      throw new BadRequestException(`无法连接游戏服务器，请检查 code 是否有效: ${e?.message || e}`)
    })

    const openId = String(userState?.openId || '').trim()
    if (!openId)
      throw new BadRequestException('无法获取账号信息，请检查 code 是否有效')

    const nameFromGame = String(userState?.name || '').trim()
    const avatarFromGame = String(userState?.avatarUrl || '').trim()

    // 查找是否已有相同 uin + platform 的账号
    const all = this.manager.getAccounts().accounts || []
    const existing = all.find((a: any) =>
      String(a.uin || '').trim() === openId && String(a.platform || 'qq') === normalizedPlatform
    )

    const payload: Record<string, any> = {
      code,
      platform: normalizedPlatform,
      uin: openId,
      skipAutoStart: true
    }

    let targetId: string
    if (existing) {
      payload.id = String(existing.id)
      if (!existing.name || existing.name === `小小农夫-${String(existing.id).padStart(2, '0')}`)
        payload.nick = nameFromGame || existing.nick || ''
      if (avatarFromGame)
        payload.avatar = avatarFromGame
      const result = await this.createOrUpdateAccount(payload)
      const updated = result.accounts || []
      const target = updated.find((a: any) => String(a.id) === String(existing.id))
      targetId = String((target || existing).id)
    } else {
      if (nameFromGame)
        payload.nick = nameFromGame
      if (avatarFromGame)
        payload.avatar = avatarFromGame
      const result = await this.createOrUpdateAccount(payload)
      const updated = result.accounts || []
      const target = updated.find((a: any) =>
        String(a.uin || '').trim() === openId && String(a.platform || 'qq') === normalizedPlatform
      ) ?? updated.at(-1)
      if (!target)
        throw new BadRequestException('导入账号失败：未能创建账号记录')
      targetId = String(target.id)
    }

    // 将临时连接改绑到真实账号 ID
    await this.manager.rebindLinkConnection(tempId, targetId)

    const name = nameFromGame || ''
    this.gameLog.appendLog(targetId, name, {
      msg: `远程链接导入并启动: ${name || targetId}`,
      tag: '系统',
      meta: { module: 'system', event: 'login_remote' }
    })
    this.manager.addAccountLog(
      'import_url',
      `通过链接导入并启动: ${name || targetId}`,
      targetId,
      name || ''
    )
    await this.manager.startAccount(targetId)
    this.manager.notifyAccountsUpdate()
    return null
  }
}
