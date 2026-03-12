import { Buffer } from 'node:buffer'

/** 运行时连接参数（由 core 面板设置传入，可选） */
export interface ClientConfig {
  serverUrl?: string
  clientVersion?: string
  os?: string
  deviceInfo?: {
    sysSoftware?: string
    network?: string
    memory?: string
    deviceId?: string
  }
}

/** Core -> Link requests */
export interface ConnectRequest {
  type: 'connect'
  rid: string
  accountId: string
  code: string
  platform: string
  clientConfig?: ClientConfig
}

export interface RebindRequest {
  type: 'rebind'
  rid: string
  fromAccountId: string
  toAccountId: string
}

export interface DisconnectRequest {
  type: 'disconnect'
  rid: string
  accountId: string
}

export interface StatusRequest {
  type: 'status'
  rid: string
  accountId: string
}

export interface ListRequest {
  type: 'list'
  rid: string
}

/** 语义调用：core 传 service/method/params，link 负责编解码 */
export interface InvokeRequest {
  type: 'invoke'
  rid: string
  accountId: string
  service: string
  method: string
  /** 请求体（可序列化对象，link 侧用 proto 编码） */
  params: Record<string, unknown>
}

export type Request = ConnectRequest | RebindRequest | DisconnectRequest | StatusRequest | ListRequest | InvokeRequest

/** Link -> Core responses */
export interface ResponseMessage {
  type: 'response'
  rid: string
  ok: boolean
  error?: string
  /** 语义调用解码后的结果（for type 'invoke'） */
  data?: unknown
  meta?: any
  userState?: any
}

/** Link -> Core push events */
export interface EventMessage {
  type: 'event'
  accountId: string
  event: string
  data: any
}

export type OutboundMessage = ResponseMessage | EventMessage

/** Frame encoding/decoding: 4-byte length prefix + JSON */
export function encodeFrame(msg: OutboundMessage): Buffer {
  const json = JSON.stringify(msg)
  const payload = Buffer.from(json, 'utf-8')
  const frame = Buffer.alloc(4 + payload.length)
  frame.writeUInt32BE(payload.length, 0)
  payload.copy(frame, 4)
  return frame
}

export class FrameDecoder {
  private buffer = Buffer.alloc(0)

  feed(chunk: Buffer): Request[] {
    this.buffer = Buffer.concat([this.buffer, chunk])
    const messages: Request[] = []

    while (this.buffer.length >= 4) {
      const len = this.buffer.readUInt32BE(0)
      if (this.buffer.length < 4 + len)
        break
      const payload = this.buffer.subarray(4, 4 + len)
      this.buffer = this.buffer.subarray(4 + len)
      try {
        messages.push(JSON.parse(payload.toString('utf-8')))
      } catch {}
    }

    return messages
  }

  reset() {
    this.buffer = Buffer.alloc(0)
  }
}
