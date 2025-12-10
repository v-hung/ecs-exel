import { MenuProps } from 'antd'

export const getSelectedKeys = (path: string) => {
  const parts = path
    .split('/')
    .filter((_, index) => index !== 0)
    .map((_, index, array) => `/${array.slice(0, index + 1).join('/')}`)

  return parts
}

export const getOpenKeys = (path: string, menu: MenuProps['items']): string[] => {
  for (const parent of menu!) {
    if (!parent?.key) {
      continue
    }

    if ('children' in parent) {
      const child = parent.children?.find((c) => c?.key === path.split('/').slice(0, 2).join('/'))

      if (child) {
        return [parent.key as string]
      }
    }
  }
  return ['']
}
