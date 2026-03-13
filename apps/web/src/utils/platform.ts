export function getPlatformIcon(p?: string): string {
  if (p === 'qq')
    return 'i-streamline-logos-qq-logo-block'
  if (p === 'wx')
    return 'i-streamline-logos-wechat-logo-block'
  return ''
}
