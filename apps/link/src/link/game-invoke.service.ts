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

    const lookup = (fullName: string) => root.lookupType(fullName)
    const types: Record<string, protobuf.Type> = {}

    /** 类型名 -> proto 全限定名前缀 */
    const prefixMap: Record<string, string> = {
      AllLandsRequest: 'gamepb.plantpb',
      AllLandsReply: 'gamepb.plantpb',
      HarvestRequest: 'gamepb.plantpb',
      HarvestReply: 'gamepb.plantpb',
      WaterLandRequest: 'gamepb.plantpb',
      WaterLandReply: 'gamepb.plantpb',
      WeedOutRequest: 'gamepb.plantpb',
      WeedOutReply: 'gamepb.plantpb',
      InsecticideRequest: 'gamepb.plantpb',
      InsecticideReply: 'gamepb.plantpb',
      RemovePlantRequest: 'gamepb.plantpb',
      RemovePlantReply: 'gamepb.plantpb',
      UpgradeLandRequest: 'gamepb.plantpb',
      UpgradeLandReply: 'gamepb.plantpb',
      UnlockLandRequest: 'gamepb.plantpb',
      UnlockLandReply: 'gamepb.plantpb',
      FertilizeRequest: 'gamepb.plantpb',
      FertilizeReply: 'gamepb.plantpb',
      PlantRequest: 'gamepb.plantpb',
      PlantReply: 'gamepb.plantpb',
      CheckCanOperateRequest: 'gamepb.plantpb',
      CheckCanOperateReply: 'gamepb.plantpb',
      PutInsectsRequest: 'gamepb.plantpb',
      PutInsectsReply: 'gamepb.plantpb',
      PutWeedsRequest: 'gamepb.plantpb',
      PutWeedsReply: 'gamepb.plantpb',
      ShopInfoRequest: 'gamepb.shoppb',
      ShopInfoReply: 'gamepb.shoppb',
      BuyGoodsRequest: 'gamepb.shoppb',
      BuyGoodsReply: 'gamepb.shoppb',
      SyncAllRequest: 'gamepb.friendpb',
      SyncAllReply: 'gamepb.friendpb',
      GetAllRequest: 'gamepb.friendpb',
      GetAllReply: 'gamepb.friendpb',
      GetApplicationsRequest: 'gamepb.friendpb',
      GetApplicationsReply: 'gamepb.friendpb',
      AcceptFriendsRequest: 'gamepb.friendpb',
      AcceptFriendsReply: 'gamepb.friendpb',
      EnterRequest: 'gamepb.visitpb',
      EnterReply: 'gamepb.visitpb',
      LeaveRequest: 'gamepb.visitpb',
      LeaveReply: 'gamepb.visitpb',
      TaskInfoRequest: 'gamepb.taskpb',
      TaskInfoReply: 'gamepb.taskpb',
      ClaimTaskRewardRequest: 'gamepb.taskpb',
      ClaimTaskRewardReply: 'gamepb.taskpb',
      ClaimDailyRewardRequest: 'gamepb.taskpb',
      ClaimDailyRewardReply: 'gamepb.taskpb',
      BagRequest: 'gamepb.itempb',
      BagReply: 'gamepb.itempb',
      SellRequest: 'gamepb.itempb',
      SellReply: 'gamepb.itempb',
      UseRequest: 'gamepb.itempb',
      UseReply: 'gamepb.itempb',
      BatchUseRequest: 'gamepb.itempb',
      BatchUseReply: 'gamepb.itempb',
      ReportArkClickRequest: 'gamepb.userpb',
      ReportArkClickReply: 'gamepb.userpb',
      GetEmailListRequest: 'gamepb.emailpb',
      GetEmailListReply: 'gamepb.emailpb',
      BatchClaimEmailRequest: 'gamepb.emailpb',
      BatchClaimEmailReply: 'gamepb.emailpb',
      ClaimEmailRequest: 'gamepb.emailpb',
      ClaimEmailReply: 'gamepb.emailpb',
      GetMonthCardInfosRequest: 'gamepb.mallpb',
      GetMonthCardInfosReply: 'gamepb.mallpb',
      ClaimMonthCardRewardRequest: 'gamepb.mallpb',
      ClaimMonthCardRewardReply: 'gamepb.mallpb',
      GetMallListBySlotTypeRequest: 'gamepb.mallpb',
      GetMallListBySlotTypeResponse: 'gamepb.mallpb',
      PurchaseRequest: 'gamepb.mallpb',
      PurchaseResponse: 'gamepb.mallpb',
      GetTodayClaimStatusRequest: 'gamepb.redpacketpb',
      GetTodayClaimStatusReply: 'gamepb.redpacketpb',
      ClaimRedPacketRequest: 'gamepb.redpacketpb',
      ClaimRedPacketReply: 'gamepb.redpacketpb',
      GetDailyGiftStatusRequest: 'gamepb.qqvippb',
      GetDailyGiftStatusReply: 'gamepb.qqvippb',
      ClaimDailyGiftRequest: 'gamepb.qqvippb',
      ClaimDailyGiftReply: 'gamepb.qqvippb',
      CheckCanShareRequest: 'gamepb.sharepb',
      CheckCanShareReply: 'gamepb.sharepb',
      ReportShareRequest: 'gamepb.sharepb',
      ReportShareReply: 'gamepb.sharepb',
      ClaimShareRewardRequest: 'gamepb.sharepb',
      ClaimShareRewardReply: 'gamepb.sharepb',
      ClaimAllRewardsV2Request: 'gamepb.illustratedpb',
      ClaimAllRewardsV2Reply: 'gamepb.illustratedpb',
      InteractRecordsRequest: 'gamepb.interactpb',
      InteractRecordsReply: 'gamepb.interactpb'
    }

    for (const name of Object.keys(prefixMap)) {
      const prefix = prefixMap[name]
      types[name] = lookup(`${prefix}.${name}`)
    }

    this.fullTypes = types
    this.ready = true
    this.logger.log('完整 proto（invoke）加载完成')
  }

  isReady(): boolean {
    return this.ready
  }

  /** 根据 (service, method) 获取请求/响应类型并执行编码-发送-解码 */
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
