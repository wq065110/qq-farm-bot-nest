/**
 * TCP 协议定义：从 @qq-farm/shared/node 重导出。
 * Link 侧仍通过此文件引用，保持导入路径稳定。
 */
export {
  type ClientConfig,
  type ConnectRequest,
  type DisconnectRequest,
  encodeFrame,
  FrameDecoder,
  type InvokeRequest,
  type ListRequest,
  type RebindRequest,
  type StatusRequest,
  type TcpEvent,
  type TcpOutbound,
  type TcpRequest,
  type TcpResponse
} from '@qq-farm/shared/node'
