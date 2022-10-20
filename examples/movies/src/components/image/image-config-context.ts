import { createContext } from 'solid-js';
import { ImageConfigComplete, imageConfigDefault } from './image-config'

export const ImageConfigContext =
  createContext<ImageConfigComplete>(imageConfigDefault)

if (import.meta.env.MODE !== 'production') {
  ImageConfigContext.displayName = 'ImageConfigContext'
}
