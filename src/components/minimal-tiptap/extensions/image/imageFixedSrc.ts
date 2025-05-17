import { Image as BaseImage } from './image'

export const ImagedFixedSrc = BaseImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML({ src }) {
          if (!src) return {}

          // Avoid rewriting absolute URLs
          if (/^(https?:)?\/\//.test(src)) return { src }

          const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
          const fullSrc = `${baseUrl}/${src.replace(/^\/+/, '')}`
          console.log("IMAGE ATTRIBUTE MODIFIED", src, fullSrc)
          return { src: fullSrc }
        },
      },
    }
  },
})
