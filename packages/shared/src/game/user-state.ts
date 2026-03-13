/** 游戏用户状态（Core 与 Link 共用） */
export interface UserState {
  gid: number
  name: string
  level: number
  gold: number
  exp: number
  coupon: number
  avatarUrl: string
  openId: string
}

export function createEmptyUserState(): UserState {
  return { gid: 0, name: '', level: 0, gold: 0, exp: 0, coupon: 0, avatarUrl: '', openId: '' }
}
