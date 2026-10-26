import { createContext, useContext } from 'react'

export type GalleryRole = 'writer' | 'reader'

export const GalleryRoleContext = createContext<{ role: GalleryRole; setRole: (role: GalleryRole) => void }>({
  role: 'writer',
  setRole: () => {},
})

export const useGalleryRole = () => useContext(GalleryRoleContext)
