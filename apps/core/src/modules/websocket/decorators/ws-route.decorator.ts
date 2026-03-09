import { SetMetadata } from '@nestjs/common'

export const WS_ROUTE_KEY = Symbol('WS_ROUTE')

export function WsRoute(route: string): MethodDecorator {
  return SetMetadata(WS_ROUTE_KEY, route)
}
