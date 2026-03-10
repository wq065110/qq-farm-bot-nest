import type { StoreService } from '../../store/store.service'
import type { GameConfigService } from '../game-config.service'
import type { IGameTransport } from '../interfaces/game-transport.interface'
import type { AnalyticsWorker } from './analytics.worker'
import type { StatsTracker } from './stats.worker'
import { Logger } from '@nestjs/common'
import { Scheduler } from '@qq-farm/shared'
import { getLandTypeByLevel, PHASE_NAMES, PlantPhase } from '../constants'
import { getServerTimeSec, sleep, toNum, toTimeSec } from '../utils'

const NORMAL_FERTILIZER_ID = 1011
const ORGANIC_FERTILIZER_ID = 1012

function buildLandMap(lands: any[]): Map<number, any> {
  const map = new Map<number, any>()
  for (const land of lands || []) {
    const id = toNum(land?.id)
    if (id > 0)
      map.set(id, land)
  }
  return map
}

function getSlaveLandIds(land: any): number[] {
  const ids: any[] = Array.isArray(land?.slave_land_ids) ? land.slave_land_ids : []
  return [...new Set(ids.map(id => toNum(id)).filter(n => Number.isFinite(n) && n > 0))] as number[]
}

function hasPlantData(land: any): boolean {
  const plant = land?.plant
  return !!(plant && Array.isArray(plant.phases) && plant.phases.length > 0)
}

function getLinkedMasterLand(land: any, landsMap: Map<number, any>): any | null {
  const landId = toNum(land?.id)
  const masterLandId = toNum(land?.master_land_id)
  if (!masterLandId || masterLandId === landId)
    return null

  const masterLand = landsMap.get(masterLandId)
  if (!masterLand)
    return null

  const slaveIds = getSlaveLandIds(masterLand)
  if (slaveIds.length > 0 && !slaveIds.includes(landId))
    return null

  return masterLand
}

function getDisplayLandContext(land: any, landsMap: Map<number, any>): {
  sourceLand: any
  occupiedByMaster: boolean
  masterLandId: number
  occupiedLandIds: number[]
} {
  const masterLand = getLinkedMasterLand(land, landsMap)
  if (masterLand && hasPlantData(masterLand)) {
    const masterId = toNum(masterLand.id)
    const slaveIds = getSlaveLandIds(masterLand)
    const occupiedIds = [masterId, ...slaveIds].filter(Boolean)
    return {
      sourceLand: masterLand,
      occupiedByMaster: true,
      masterLandId: masterId,
      occupiedLandIds: occupiedIds.length > 0 ? occupiedIds : [masterId]
    }
  }

  const selfId = toNum(land?.id)
  const slaveIds = getSlaveLandIds(land)
  const occupiedIds = [selfId, ...slaveIds].filter(Boolean)
  return {
    sourceLand: land,
    occupiedByMaster: false,
    masterLandId: selfId,
    occupiedLandIds: occupiedIds.length > 0 ? occupiedIds : [selfId]
  }
}

function isOccupiedSlaveLand(land: any, landsMap: Map<number, any>): boolean {
  return getDisplayLandContext(land, landsMap).occupiedByMaster
}

export type LogCallback = (entry: { msg: string, tag?: string, meta?: Record<string, string>, isWarn?: boolean }) => void

export class FarmWorker {
  private logger: Logger
  private isChecking = false
  private isFirstCheck = true
  private loopRunning = false
  private externalScheduler = false
  private lastPushTime = 0
  private scheduler: Scheduler
  onOperationLimitsUpdate: ((limits: any) => void) | null = null
  onLog: LogCallback | null = null

  constructor(
    private accountId: string,
    private client: IGameTransport,
    private gameConfig: GameConfigService,
    private store: StoreService,
    private stats: StatsTracker,
    private analytics: AnalyticsWorker
  ) {
    this.logger = new Logger(`Farm:${accountId}`)
    this.scheduler = new Scheduler(`farm-${accountId}`, this.logger)
  }

  private log(msg: string, event?: string) {
    this.logger.log(msg)
    this.onLog?.({ msg, tag: '农场', meta: { module: 'farm', ...(event && { event }) }, isWarn: false })
  }

  private warn(msg: string, event?: string) {
    this.logger.warn(msg)
    this.onLog?.({ msg, tag: '农场', meta: { module: 'farm', ...(event && { event }) }, isWarn: true })
  }

  // ========== API（通过 link invoke，由 link 负责 proto 编解码）==========

  async getAllLands(): Promise<any> {
    const { data: reply } = await this.client.invoke<any>('gamepb.plantpb.PlantService', 'AllLands', {})
    if (reply?.operation_limits && this.onOperationLimitsUpdate)
      this.onOperationLimitsUpdate(reply.operation_limits)
    return reply
  }

  async harvest(landIds: any[]): Promise<any> {
    const { data } = await this.client.invoke<any>('gamepb.plantpb.PlantService', 'Harvest', {
      land_ids: landIds,
      host_gid: this.client.userState.gid,
      is_all: true
    })
    return data
  }

  private async sendPlantRequest(method: string, landIds: any[], hostGid: number): Promise<any> {
    const { data } = await this.client.invoke<any>('gamepb.plantpb.PlantService', method, {
      land_ids: landIds,
      host_gid: hostGid
    })
    return data
  }

  async waterLand(landIds: any[]) { return this.sendPlantRequest('WaterLand', landIds, this.client.userState.gid) }
  async weedOut(landIds: any[]) { return this.sendPlantRequest('WeedOut', landIds, this.client.userState.gid) }
  async insecticide(landIds: any[]) { return this.sendPlantRequest('Insecticide', landIds, this.client.userState.gid) }

  async fertilize(landIds: number[], fertilizerId = NORMAL_FERTILIZER_ID): Promise<number> {
    let success = 0
    for (const landId of landIds) {
      try {
        await this.client.invoke('gamepb.plantpb.PlantService', 'Fertilize', {
          land_ids: [landId],
          fertilizer_id: fertilizerId
        })
        success++
      } catch { break }
      if (landIds.length > 1)
        await sleep(50)
    }
    return success
  }

  async fertilizeOrganicLoop(landIds: number[]): Promise<number> {
    const ids = landIds.filter(Boolean)
    if (!ids.length)
      return 0
    let success = 0
    let idx = 0
    while (true) {
      try {
        await this.client.invoke('gamepb.plantpb.PlantService', 'Fertilize', {
          land_ids: [ids[idx]],
          fertilizer_id: ORGANIC_FERTILIZER_ID
        })
        success++
      } catch { break }
      idx = (idx + 1) % ids.length
      await sleep(100)
    }
    return success
  }

  async removePlant(landIds: number[]): Promise<any> {
    const { data } = await this.client.invoke<any>('gamepb.plantpb.PlantService', 'RemovePlant', { land_ids: landIds })
    return data
  }

  async upgradeLand(landId: number): Promise<any> {
    const { data } = await this.client.invoke<any>('gamepb.plantpb.PlantService', 'UpgradeLand', { land_id: landId })
    return data
  }

  async unlockLand(landId: number, doShared = false): Promise<any> {
    const { data } = await this.client.invoke<any>('gamepb.plantpb.PlantService', 'UnlockLand', { land_id: landId, do_shared: doShared })
    return data
  }

  async getShopInfo(shopId: number): Promise<any> {
    const { data } = await this.client.invoke<any>('gamepb.shoppb.ShopService', 'ShopInfo', { shop_id: shopId })
    return data
  }

  async buyGoods(goodsId: number, num: number, price: number): Promise<any> {
    const { data } = await this.client.invoke<any>('gamepb.shoppb.ShopService', 'BuyGoods', { goods_id: goodsId, num, price })
    return data
  }

  async plantSeeds(seedId: number, landIds: number[], options?: { maxPlantCount?: number }): Promise<{ planted: number, plantedLandIds: number[], occupiedLandIds: number[] }> {
    const ids = (Array.isArray(landIds) ? landIds : []).map(id => toNum(id)).filter(Boolean)
    const maxCount = Math.max(0, toNum(options?.maxPlantCount) || Number.POSITIVE_INFINITY)
    let success = 0
    const plantedLandIds: number[] = []
    const occupiedLandIds = new Set<number>()
    for (const rawId of ids) {
      const landId = toNum(rawId)
      if (!landId)
        continue
      if (success >= maxCount)
        break
      try {
        await this.client.invoke('gamepb.plantpb.PlantService', 'Plant', {
          items: [{ seed_id: seedId, land_ids: [landId] }]
        })
        success++
        plantedLandIds.push(landId)
        occupiedLandIds.add(landId)
      } catch (e: any) {
        this.warn(`土地#${landId} 种植失败: ${e?.message}`, 'plant_seed')
      }
      if (ids.length > 1)
        await sleep(50)
    }
    return { planted: success, plantedLandIds, occupiedLandIds: [...occupiedLandIds] }
  }

  // ========== Phase Analysis ==========

  getCurrentPhase(phases: any[]): any | null {
    if (!phases?.length)
      return null
    const nowSec = getServerTimeSec()
    for (let i = phases.length - 1; i >= 0; i--) {
      const beginTime = toTimeSec(phases[i].begin_time)
      if (beginTime > 0 && beginTime <= nowSec)
        return phases[i]
    }
    return phases[0]
  }

  analyzeLands(lands: any[]): any {
    const result: Record<string, number[]> = {
      harvestable: [],
      needWater: [],
      needWeed: [],
      needBug: [],
      growing: [],
      empty: [],
      dead: [],
      unlockable: [],
      upgradable: []
    }
    const harvestableInfo: any[] = []
    const nowSec = getServerTimeSec()
    const landsMap = buildLandMap(lands)

    for (const land of lands) {
      const id = toNum(land.id)
      if (isOccupiedSlaveLand(land, landsMap))
        continue
      if (!land.unlocked) {
        if (land.could_unlock)
          result.unlockable.push(id)
        continue
      }
      if (land.could_upgrade)
        result.upgradable.push(id)
      const plant = land.plant
      if (!plant?.phases?.length) {
        result.empty.push(id)
        continue
      }
      const phase = this.getCurrentPhase(plant.phases)
      if (!phase) {
        result.empty.push(id)
        continue
      }
      const phaseVal = phase.phase
      if (phaseVal === PlantPhase.DEAD) {
        result.dead.push(id)
        continue
      }
      if (phaseVal === PlantPhase.MATURE) {
        result.harvestable.push(id)
        harvestableInfo.push({ landId: id, plantId: toNum(plant.id), name: this.gameConfig.getPlantName(toNum(plant.id)), exp: this.gameConfig.getPlantExp(toNum(plant.id)) })
        continue
      }
      if (toNum(plant.dry_num) > 0 || (toTimeSec(phase.dry_time) > 0 && toTimeSec(phase.dry_time) <= nowSec))
        result.needWater.push(id)
      const hasWeeds = plant.weed_owners?.length > 0 || (toTimeSec(phase.weeds_time) > 0 && toTimeSec(phase.weeds_time) <= nowSec)
      if (hasWeeds)
        result.needWeed.push(id)
      const hasBugs = plant.insect_owners?.length > 0 || (toTimeSec(phase.insect_time) > 0 && toTimeSec(phase.insect_time) <= nowSec)
      if (hasBugs)
        result.needBug.push(id)
      result.growing.push(id)
    }
    return { ...result, harvestableInfo }
  }

  // ========== Farm Operations ==========

  async runFertilizerByConfig(plantedLands: number[] = [], options?: { reason?: 'multi_season' | 'normal' }): Promise<{ normal: number, organic: number }> {
    const cfg = this.store.getAccountConfig(this.accountId)
    const fertilizerConfig = cfg.fertilizer || 'both'
    const landTypes = (cfg.fertilizerLandTypes?.length ? cfg.fertilizerLandTypes : ['gold', 'black', 'red', 'normal']) as string[]
    const allowedTypes = new Set(landTypes)
    const eventTag = options?.reason === 'multi_season' ? 'fertilize_multi' : 'fertilize'
    let fertilizedNormal = 0
    let fertilizedOrganic = 0

    let candidateIds: number[] = plantedLands.filter(Boolean)
    try {
      const latest = await this.getAllLands()
      const lands = latest?.lands || []
      const idToLevel = new Map<number, number>()
      for (const land of lands)
        idToLevel.set(toNum(land.id), toNum(land.level))
      if (candidateIds.length === 0)
        candidateIds = lands.filter((l: any) => l?.unlocked && l?.plant?.phases?.length).map((l: any) => toNum(l.id))
      candidateIds = candidateIds.filter(id => allowedTypes.has(getLandTypeByLevel(idToLevel.get(id) ?? 0)))
    } catch {}

    if ((fertilizerConfig === 'normal' || fertilizerConfig === 'both') && candidateIds.length > 0) {
      fertilizedNormal = await this.fertilize(candidateIds, NORMAL_FERTILIZER_ID)
      if (fertilizedNormal > 0) {
        this.log(`已为 ${fertilizedNormal}/${candidateIds.length} 块地施无机化肥`, eventTag)
        this.stats.recordOperation('fertilize', fertilizedNormal)
      }
    }

    if (fertilizerConfig === 'organic' || fertilizerConfig === 'both') {
      let organicTargets: number[] = []
      try {
        const latest = await this.getAllLands()
        const lands = latest?.lands || []
        organicTargets = this.getOrganicTargets(lands)
        const idToLevel = new Map<number, number>()
        for (const land of lands)
          idToLevel.set(toNum(land.id), toNum(land.level))
        organicTargets = organicTargets.filter(id => allowedTypes.has(getLandTypeByLevel(idToLevel.get(id) ?? 0)))
      } catch {}
      fertilizedOrganic = await this.fertilizeOrganicLoop(organicTargets)
      if (fertilizedOrganic > 0) {
        this.log(`有机化肥循环施肥完成，共施 ${fertilizedOrganic} 次`, eventTag)
        this.stats.recordOperation('fertilize', fertilizedOrganic)
      }
    }
    return { normal: fertilizedNormal, organic: fertilizedOrganic }
  }

  private getOrganicTargets(lands: any[]): number[] {
    return (lands || []).filter((land: any) => {
      if (!land?.unlocked)
        return false
      const plant = land.plant
      if (!plant?.phases?.length)
        return false
      const phase = this.getCurrentPhase(plant.phases)
      if (!phase || phase.phase === PlantPhase.DEAD)
        return false
      if (Object.hasOwn(plant, 'left_inorc_fert_times') && toNum(plant.left_inorc_fert_times) <= 0)
        return false
      return true
    }).map((l: any) => toNum(l.id))
  }

  private getMultiSeasonGrowingLandIds(lands: any[]): number[] {
    const multiSeasonSeeds = new Set(this.gameConfig.getMultiSeasonSeedIds?.() || [])
    const result: number[] = []
    for (const land of lands || []) {
      if (!land?.unlocked)
        continue
      const plant = land.plant
      if (!plant?.phases?.length)
        continue
      const phase = this.getCurrentPhase(plant.phases)
      if (!phase || phase.phase === PlantPhase.MATURE || phase.phase === PlantPhase.DEAD)
        continue
      const plantId = toNum(plant.id)
      const plantCfg = this.gameConfig.getPlantById(plantId)
      const seedId = toNum(plantCfg?.seed_id)
      if (seedId > 0 && multiSeasonSeeds.has(seedId))
        result.push(toNum(land.id))
    }
    return result
  }

  async runFarmOperation(opType: string): Promise<{ hadWork: boolean, actions: string[] }> {
    const landsReply = await this.getAllLands()
    if (!landsReply.lands?.length)
      return { hadWork: false, actions: [] }

    const status = this.analyzeLands(landsReply.lands)
    const actions: string[] = []
    const batchOps: Promise<any>[] = []

    if (opType === 'all' || opType === 'clear') {
      if (status.needWeed.length) {
        batchOps.push(this.weedOut(status.needWeed).then(() => {
          actions.push(`除草${status.needWeed.length}`)
          this.stats.recordOperation('weed', status.needWeed.length)
        }).catch(() => {}))
      }
      if (status.needBug.length) {
        batchOps.push(this.insecticide(status.needBug).then(() => {
          actions.push(`除虫${status.needBug.length}`)
          this.stats.recordOperation('bug', status.needBug.length)
        }).catch(() => {}))
      }
      if (status.needWater.length) {
        batchOps.push(this.waterLand(status.needWater).then(() => {
          actions.push(`浇水${status.needWater.length}`)
          this.stats.recordOperation('water', status.needWater.length)
        }).catch(() => {}))
      }
      if (batchOps.length)
        await Promise.all(batchOps)
    }

    let harvestedIds: number[] = []
    let _harvestReply: any = null
    if (opType === 'all' || opType === 'harvest') {
      if (status.harvestable.length) {
        try {
          _harvestReply = await this.harvest(status.harvestable)
          actions.push(`收获${status.harvestable.length}`)
          this.stats.recordOperation('harvest', status.harvestable.length)
          harvestedIds = [...status.harvestable]
        } catch {}
      }
    }

    const cfg = this.store.getAccountConfig(this.accountId)
    if ((opType === 'all' || opType === 'harvest') && harvestedIds.length > 0 && cfg.fertilizerMultiSeason) {
      try {
        const afterLands = await this.getAllLands()
        const multiSeasonGrowing = this.getMultiSeasonGrowingLandIds(afterLands?.lands || [])
        if (multiSeasonGrowing.length > 0)
          await this.runFertilizerByConfig(multiSeasonGrowing, { reason: 'multi_season' })
      } catch {}
    }

    if (opType === 'all' || opType === 'plant') {
      const allEmpty: number[] = [...new Set<number>(status.empty)]
      let allDead: number[] = [...new Set<number>(status.dead)]
      if (opType === 'all' && harvestedIds.length)
        allDead = [...new Set([...allDead, ...harvestedIds])]

      if (allDead.length || allEmpty.length) {
        try {
          await this.autoPlantEmptyLands(allDead, allEmpty)
          actions.push(`种植${allDead.length + allEmpty.length}`)
          this.stats.recordOperation('plant', allDead.length + allEmpty.length)
        } catch {}
      }
    }

    const shouldAutoUpgrade = opType === 'all' && this.store.isAutomationOn('land_upgrade', this.accountId)
    if (shouldAutoUpgrade || opType === 'upgrade') {
      for (const landId of status.unlockable) {
        try {
          await this.unlockLand(landId)
          actions.push(`解锁1`)
        } catch {}
        await sleep(200)
      }
      for (const landId of status.upgradable) {
        try {
          await this.upgradeLand(landId)
          actions.push(`升级1`)
          this.stats.recordOperation('upgrade', 1)
        } catch {}
        await sleep(200)
      }
    }

    if (actions.length)
      this.log(`[${this.buildStatusStr(status)}] → ${actions.join('/')}`, 'farm_cycle')

    return { hadWork: actions.length > 0, actions }
  }

  private buildStatusStr(status: Record<string, any[]>): string {
    const parts: string[] = []
    if (status.harvestable.length)
      parts.push(`收:${status.harvestable.length}`)
    if (status.needWeed.length)
      parts.push(`草:${status.needWeed.length}`)
    if (status.needBug.length)
      parts.push(`虫:${status.needBug.length}`)
    if (status.needWater.length)
      parts.push(`水:${status.needWater.length}`)
    if (status.dead.length)
      parts.push(`枯:${status.dead.length}`)
    if (status.empty.length)
      parts.push(`空:${status.empty.length}`)
    parts.push(`长:${status.growing.length}`)
    return parts.join(' ')
  }

  private async autoPlantEmptyLands(deadLandIds: number[], emptyLandIds: number[]) {
    let landsToPlant = [...emptyLandIds]
    if (deadLandIds.length) {
      try {
        await this.removePlant(deadLandIds)
        landsToPlant.push(...deadLandIds)
      } catch {
        landsToPlant.push(...deadLandIds)
      }
    }
    if (!landsToPlant.length)
      return

    const bestSeed = await this.findBestSeed()
    if (!bestSeed)
      return

    const plantSize = this.gameConfig.getPlantSizeBySeedId(bestSeed.seedId)
    const landFootprint = plantSize * plantSize
    let needCount = landsToPlant.length
    if (landFootprint > 1)
      needCount = Math.floor(landsToPlant.length / landFootprint)
    if (needCount <= 0)
      return

    const totalCost = bestSeed.price * needCount
    if (totalCost > this.client.userState.gold) {
      const canBuy = Math.floor(this.client.userState.gold / bestSeed.price)
      if (canBuy <= 0)
        return
      needCount = canBuy
      landsToPlant = landsToPlant.slice(0, needCount)
    }

    let actualSeedId = bestSeed.seedId
    try {
      const buyReply = await this.buyGoods(bestSeed.goodsId, needCount, bestSeed.price)
      if (buyReply.get_items?.[0])
        actualSeedId = toNum(buyReply.get_items[0].id) || actualSeedId
    } catch { return }

    const { planted, plantedLandIds } = await this.plantSeeds(actualSeedId, landsToPlant, { maxPlantCount: needCount })
    if (planted > 0)
      await this.runFertilizerByConfig(plantedLandIds)
  }

  private async findBestSeed(): Promise<{ goodsId: number, seedId: number, price: number, requiredLevel: number } | null> {
    const shopReply = await this.getShopInfo(2)
    if (!shopReply.goods_list?.length)
      return null

    const state = this.client.userState
    const available: any[] = []
    for (const goods of shopReply.goods_list) {
      if (!goods.unlocked)
        continue
      let meetsConditions = true
      let requiredLevel = 0
      for (const cond of (goods.conds || [])) {
        if (toNum(cond.type) === 1) {
          requiredLevel = toNum(cond.param)
          if (state.level < requiredLevel) {
            meetsConditions = false
            break
          }
        }
      }
      if (!meetsConditions)
        continue
      const limitCount = toNum(goods.limit_count)
      if (limitCount > 0 && toNum(goods.bought_num) >= limitCount)
        continue
      available.push({ goods, goodsId: toNum(goods.id), seedId: toNum(goods.item_id), price: toNum(goods.price), requiredLevel })
    }
    if (!available.length)
      return null

    const strategy = this.store.getPlantingStrategy(this.accountId)
    const analyticsSortMap: Record<string, string> = { max_exp: 'exp', max_fert_exp: 'fert', max_profit: 'profit', max_fert_profit: 'fert_profit' }
    const sortBy = analyticsSortMap[strategy]
    if (sortBy) {
      try {
        const rankings = this.analytics.getPlantRankings(sortBy)
        const byId = new Map(available.map(a => [a.seedId, a]))
        for (const row of rankings) {
          const sid = Number(row?.seedId) || 0
          if (sid <= 0)
            continue
          if (Number.isFinite(row?.level) && row.level > state.level)
            continue
          const found = byId.get(sid)
          if (found)
            return found
        }
      } catch {}
    }

    if (strategy === 'preferred') {
      const preferred = this.store.getPreferredSeed(this.accountId)
      if (preferred > 0) {
        const found = available.find(a => a.seedId === preferred)
        if (found)
          return found
      }
    }

    available.sort((a, b) => b.requiredLevel - a.requiredLevel)
    return available[0]
  }

  async getAvailableSeeds() {
    try {
      const shopReply = await this.getShopInfo(2)
      if (!shopReply.goods_list?.length)
        return this.gameConfig.getAllSeeds()
      const state = this.client.userState
      return shopReply.goods_list.map((goods: any) => {
        let requiredLevel = 0
        for (const cond of (goods.conds || [])) {
          if (toNum(cond.type) === 1)
            requiredLevel = toNum(cond.param)
        }
        const limitCount = toNum(goods.limit_count)
        const seedId = toNum(goods.item_id)
        return {
          seedId,
          goodsId: toNum(goods.id),
          name: this.gameConfig.getPlantNameBySeedId(seedId),
          price: toNum(goods.price),
          requiredLevel,
          locked: !goods.unlocked || state.level < requiredLevel,
          soldOut: limitCount > 0 && toNum(goods.bought_num) >= limitCount,
          image: this.gameConfig.getSeedImageBySeedId(seedId)
        }
      }).sort((a: any, b: any) => (a.requiredLevel ?? 9999) - (b.requiredLevel ?? 9999))
    } catch { return this.gameConfig.getAllSeeds() }
  }

  async getLandsDetail() {
    try {
      const landsReply = await this.getAllLands()
      if (!landsReply.lands)
        return { lands: [], summary: {} }
      const status = this.analyzeLands(landsReply.lands)
      const nowSec = getServerTimeSec()
      const landsMap = buildLandMap(landsReply.lands)
      const lands = landsReply.lands.map((land: any) => {
        const id = toNum(land.id)
        if (!land.unlocked) {
          return {
            id,
            unlocked: false,
            status: 'locked',
            plantName: '',
            phaseName: '',
            level: toNum(land.level),
            maxLevel: toNum(land.max_level),
            couldUnlock: !!land.could_unlock,
            couldUpgrade: !!land.could_upgrade,
            occupiedByMaster: false,
            masterLandId: id,
            occupiedLandIds: [id],
            plantSize: 1
          }
        }

        const context = getDisplayLandContext(land, landsMap)
        const sourceLand = context.sourceLand
        const plant = sourceLand?.plant
        if (!plant?.phases?.length) {
          return {
            id,
            unlocked: true,
            status: 'empty',
            plantName: '',
            phaseName: '空地',
            level: toNum(land.level),
            occupiedByMaster: context.occupiedByMaster,
            masterLandId: context.masterLandId,
            occupiedLandIds: context.occupiedLandIds,
            plantSize: 1
          }
        }

        const phase = this.getCurrentPhase(plant.phases)
        if (!phase) {
          return {
            id,
            unlocked: true,
            status: 'empty',
            plantName: '',
            phaseName: '',
            level: toNum(land.level),
            occupiedByMaster: context.occupiedByMaster,
            masterLandId: context.masterLandId,
            occupiedLandIds: context.occupiedLandIds,
            plantSize: 1
          }
        }

        const plantId = toNum(plant.id)
        const plantCfg = this.gameConfig.getPlantById(plantId)
        const seedId = toNum(plantCfg?.seed_id)
        const totalSeasons = Number((plantCfg as any)?.seasons) || 1
        const currentSeason = Number((plant as any)?.cur_season) || 1
        const maturePhase = plant.phases.find((p: any) => toNum(p?.phase) === PlantPhase.MATURE)
        const matureBegin = maturePhase ? toTimeSec(maturePhase.begin_time) : 0
        const plantSize = Math.max(1, Number((plantCfg as any)?.size) || 1)

        let landStatus = 'growing'
        if (phase.phase === PlantPhase.MATURE)
          landStatus = 'harvestable'
        else if (phase.phase === PlantPhase.DEAD)
          landStatus = 'dead'

        return {
          id,
          unlocked: true,
          status: landStatus,
          plantName: this.gameConfig.getPlantName(plantId),
          seedId,
          seedImage: seedId > 0 ? this.gameConfig.getSeedImageBySeedId(seedId) : '',
          phaseName: PHASE_NAMES[phase.phase as number] || '',
          matureInSec: matureBegin > nowSec ? matureBegin - nowSec : 0,
          needWater: toNum(plant.dry_num) > 0,
          needWeed: plant.weed_owners?.length > 0,
          needBug: plant.insect_owners?.length > 0,
          stealable: !!plant.stealable,
          level: toNum(land.level),
          maxLevel: toNum(land.max_level),
          couldUnlock: !!land.could_unlock,
          couldUpgrade: !!land.could_upgrade,
          currentSeason,
          totalSeasons,
          occupiedByMaster: context.occupiedByMaster,
          masterLandId: context.masterLandId,
          occupiedLandIds: context.occupiedLandIds,
          plantSize
        }
      })
      return { lands, summary: { harvestable: status.harvestable.length, growing: status.growing.length, empty: status.empty.length, dead: status.dead.length, needWater: status.needWater.length, needWeed: status.needWeed.length, needBug: status.needBug.length } }
    } catch { return { lands: [], summary: {} } }
  }

  // ========== Farm Loop ==========

  async checkFarm(): Promise<boolean> {
    if (this.isChecking || !this.client.userState.gid || !this.store.isAutomationOn('farm', this.accountId))
      return false
    this.isChecking = true
    try {
      const result = await this.runFarmOperation('all')
      this.isFirstCheck = false
      return !!(result?.hadWork)
    } catch (e: any) {
      this.warn(`巡田失败: ${e?.message}`, 'farm_cycle')
      return false
    } finally {
      this.isChecking = false
    }
  }

  startFarmLoop(options: { externalScheduler?: boolean } = {}) {
    if (this.loopRunning)
      return
    this.externalScheduler = !!options.externalScheduler
    this.loopRunning = true
    this.client.on('landsChanged', this.onLandsChanged)
    if (!this.externalScheduler)
      this.scheduleNext(2000)
  }

  stopFarmLoop() {
    this.loopRunning = false
    this.externalScheduler = false
    this.scheduler.clearAll()
    this.client.removeListener('landsChanged', this.onLandsChanged)
  }

  refreshFarmLoop(delayMs = 200) {
    if (this.loopRunning && !this.externalScheduler)
      this.scheduleNext(delayMs)
  }

  private scheduleNext(delayMs: number) {
    if (this.externalScheduler || !this.loopRunning)
      return
    this.scheduler.setTimeoutTask('farm_check_loop', Math.max(0, delayMs), async () => {
      if (!this.loopRunning)
        return
      await this.checkFarm()
      if (this.loopRunning)
        this.scheduleNext(2000)
    })
  }

  private onLandsChanged = () => {
    if (!this.store.isAutomationOn('farm_push', this.accountId) || this.isChecking)
      return
    const now = Date.now()
    if (now - this.lastPushTime < 500)
      return
    this.lastPushTime = now
    this.scheduler.setTimeoutTask('farm_push_check', 100, async () => {
      if (!this.isChecking)
        await this.checkFarm()
    })
  }

  destroy() {
    this.stopFarmLoop()
  }
}
