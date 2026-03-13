import { Buffer } from 'node:buffer'
import path from 'node:path'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as protobuf from 'protobufjs'

/** (service, method) -> [requestTypeName, replyTypeName]；Reply 多为 MethodReply，少数为 MethodResponse */
const INVOKE_TYPE_MAP: Record<string, Record<string, [string, string]>> = {
  'gamepb.plantpb.PlantService': {
    AllLands: ['AllLandsRequest', 'AllLandsReply'],
    Harvest: ['HarvestRequest', 'HarvestReply'],
    WaterLand: ['WaterLandRequest', 'WaterLandReply'],
    WeedOut: ['WeedOutRequest', 'WeedOutReply'],
    Insecticide: ['InsecticideRequest', 'InsecticideReply'],
    RemovePlant: ['RemovePlantRequest', 'RemovePlantReply'],
    UpgradeLand: ['UpgradeLandRequest', 'UpgradeLandReply'],
    UnlockLand: ['UnlockLandRequest', 'UnlockLandReply'],
    Fertilize: ['FertilizeRequest', 'FertilizeReply'],
    Plant: ['PlantRequest', 'PlantReply'],
    CheckCanOperate: ['CheckCanOperateRequest', 'CheckCanOperateReply'],
    PutInsects: ['PutInsectsRequest', 'PutInsectsReply'],
    PutWeeds: ['PutWeedsRequest', 'PutWeedsReply']
  },
  'gamepb.interactpb.InteractService': {
    InteractRecords: ['InteractRecordsRequest', 'InteractRecordsReply'],
    GetInteractRecords: ['InteractRecordsRequest', 'InteractRecordsReply']
  },
  'gamepb.interactpb.VisitorService': {
    InteractRecords: ['InteractRecordsRequest', 'InteractRecordsReply'],
    GetInteractRecords: ['InteractRecordsRequest', 'InteractRecordsReply']
  },
  'gamepb.shoppb.ShopService': {
    ShopInfo: ['ShopInfoRequest', 'ShopInfoReply'],
    BuyGoods: ['BuyGoodsRequest', 'BuyGoodsReply']
  },
  'gamepb.friendpb.FriendService': {
    SyncAll: ['SyncAllRequest', 'SyncAllReply'],
    GetAll: ['GetAllRequest', 'GetAllReply'],
    GetApplications: ['GetApplicationsRequest', 'GetApplicationsReply'],
    AcceptFriends: ['AcceptFriendsRequest', 'AcceptFriendsReply']
  },
  'gamepb.visitpb.VisitService': {
    Enter: ['EnterRequest', 'EnterReply'],
    Leave: ['LeaveRequest', 'LeaveReply']
  },
  'gamepb.taskpb.TaskService': {
    TaskInfo: ['TaskInfoRequest', 'TaskInfoReply'],
    ClaimTaskReward: ['ClaimTaskRewardRequest', 'ClaimTaskRewardReply'],
    ClaimDailyReward: ['ClaimDailyRewardRequest', 'ClaimDailyRewardReply']
  },
  'gamepb.itempb.ItemService': {
    Bag: ['BagRequest', 'BagReply'],
    Sell: ['SellRequest', 'SellReply'],
    Use: ['UseRequest', 'UseReply'],
    BatchUse: ['BatchUseRequest', 'BatchUseReply']
  },
  'gamepb.userpb.UserService': {
    ReportArkClick: ['ReportArkClickRequest', 'ReportArkClickReply']
  },
  'gamepb.emailpb.EmailService': {
    GetEmailList: ['GetEmailListRequest', 'GetEmailListReply'],
    BatchClaimEmail: ['BatchClaimEmailRequest', 'BatchClaimEmailReply'],
    ClaimEmail: ['ClaimEmailRequest', 'ClaimEmailReply']
  },
  'gamepb.mallpb.MallService': {
    GetMonthCardInfos: ['GetMonthCardInfosRequest', 'GetMonthCardInfosReply'],
    ClaimMonthCardReward: ['ClaimMonthCardRewardRequest', 'ClaimMonthCardRewardReply'],
    GetMallListBySlotType: ['GetMallListBySlotTypeRequest', 'GetMallListBySlotTypeResponse'],
    Purchase: ['PurchaseRequest', 'PurchaseResponse']
  },
  'gamepb.redpacketpb.RedPacketService': {
    GetTodayClaimStatus: ['GetTodayClaimStatusRequest', 'GetTodayClaimStatusReply'],
    ClaimRedPacket: ['ClaimRedPacketRequest', 'ClaimRedPacketReply']
  },
  'gamepb.qqvippb.QQVipService': {
    GetDailyGiftStatus: ['GetDailyGiftStatusRequest', 'GetDailyGiftStatusReply'],
    ClaimDailyGift: ['ClaimDailyGiftRequest', 'ClaimDailyGiftReply']
  },
  'gamepb.sharepb.ShareService': {
    CheckCanShare: ['CheckCanShareRequest', 'CheckCanShareReply'],
    ReportShare: ['ReportShareRequest', 'ReportShareReply'],
    ClaimShareReward: ['ClaimShareRewardRequest', 'ClaimShareRewardReply']
  },
  'gamepb.illustratedpb.IllustratedService': {
    ClaimAllRewardsV2: ['ClaimAllRewardsV2Request', 'ClaimAllRewardsV2Reply']
  }
}

/**
 * 从 INVOKE_TYPE_MAP 自动推导 (typeName -> proto 全限定名) 映射。
 * 规则：service 全名 = "gamepb.xxxpb.XxxService"，prefix = "gamepb.xxxpb"。
 */
function buildPrefixMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const [service, methods] of Object.entries(INVOKE_TYPE_MAP)) {
    // "gamepb.plantpb.PlantService" → prefix = "gamepb.plantpb"
    const lastDot = service.lastIndexOf('.')
    if (lastDot < 0)
      continue
    const prefix = service.substring(0, lastDot)
    for (const [reqName, replyName] of Object.values(methods)) {
      map.set(reqName, prefix)
      map.set(replyName, prefix)
    }
  }
  return map
}

@Injectable()
export class GameInvokeService implements OnModuleInit {
  private readonly logger = new Logger(GameInvokeService.name)
  private fullTypes: Record<string, protobuf.Type> = {}
  private ready = false

  async onModuleInit() {
    await this.loadFullProto()
  }

  private async loadFullProto(): Promise<void> {
    const protoDir = path.join(__dirname, '..', 'assets', 'proto')
    const root = new protobuf.Root()
    const protoFiles = [
      'game.proto',
      'userpb.proto',
      'plantpb.proto',
      'corepb.proto',
      'shoppb.proto',
      'friendpb.proto',
      'visitpb.proto',
      'interactpb.proto',
      'notifypb.proto',
      'taskpb.proto',
      'itempb.proto',
      'emailpb.proto',
      'mallpb.proto',
      'redpacketpb.proto',
      'qqvippb.proto',
      'sharepb.proto',
      'illustratedpb.proto'
    ].map(f => path.join(protoDir, f))

    try {
      await root.load(protoFiles, { keepCase: true })
    } catch (e) {
      this.logger.warn(`未加载完整 proto（请确保 apps/link/assets/proto 存在）: ${(e as Error).message}`)
      this.ready = false
      return
    }

    const prefixMap = buildPrefixMap()
    const types: Record<string, protobuf.Type> = {}

    for (const [name, prefix] of prefixMap) {
      try {
        types[name] = root.lookupType(`${prefix}.${name}`)
      } catch {
        this.logger.warn(`Proto 类型未找到: ${prefix}.${name}`)
      }
    }

    this.fullTypes = types
    this.ready = true
    this.logger.log('完整 proto（invoke）加载完成')
  }

  isReady(): boolean {
    return this.ready
  }

  /** 根据 (service, method) 获取请求/响应类型 */
  getTypes(service: string, method: string): { RequestType: protobuf.Type, ReplyType: protobuf.Type } | null {
    const methods = INVOKE_TYPE_MAP[service]
    if (!methods)
      return null
    const pair = methods[method]
    if (!pair)
      return null
    const [reqName, replyName] = pair
    const RequestType = this.fullTypes[reqName]
    const ReplyType = this.fullTypes[replyName]
    if (!RequestType || !ReplyType)
      return null
    return { RequestType, ReplyType }
  }

  /** 将 JSON 参数编码为 proto 请求体；fromObject 递归处理嵌套消息与 int64 转换 */
  encodeRequest(service: string, method: string, params: Record<string, unknown>): Buffer | null {
    const types = this.getTypes(service, method)
    if (!types)
      return null
    try {
      const msg = types.RequestType.fromObject(params)
      return Buffer.from(types.RequestType.encode(msg).finish())
    } catch {
      return null
    }
  }

  /** 将响应 body 解码为普通对象 */
  decodeReply(service: string, method: string, body: Buffer): unknown {
    const types = this.getTypes(service, method)
    if (!types)
      return null
    try {
      const decoded = types.ReplyType.decode(body)
      return types.ReplyType.toObject(decoded, { longs: String, enums: String })
    } catch {
      return null
    }
  }
}
