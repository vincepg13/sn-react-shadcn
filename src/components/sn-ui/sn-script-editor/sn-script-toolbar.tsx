import { RefObject } from 'react'
import { SnSimpleTooltip } from '../sn-tooltip'
import { Lock, SearchCode, MessageSquareCode, Wand2, Maximize2 } from 'lucide-react'
import { SnCodeMirrorHandle } from './sn-code-mirror'

interface SnScriptToolbarProps {
  readonly?: boolean
  editorRef: RefObject<SnCodeMirrorHandle | null>
  toggleMax?: () => void
}

export function SnScriptToolbar({ readonly, toggleMax, editorRef }: SnScriptToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" className="hover:opacity-80" onClick={() => editorRef.current?.openSearch()}>
        <SnSimpleTooltip trigger={<SearchCode size={18} />} content="Search (Ctrl + F)" />
      </button>
      {readonly ? (
        <SnSimpleTooltip trigger={<Lock size={18} />} content="Readonly field" />
      ) : (
        <>
          <button type="button" className="hover:opacity-80" onClick={() => editorRef.current?.toggleComment()}>
            <SnSimpleTooltip trigger={<MessageSquareCode size={18} />} content="Comment (Ctrl + /)" />
          </button>
          <button type="button" className="hover:opacity-80" onClick={() => editorRef.current?.format()}>
            <SnSimpleTooltip trigger={<Wand2 size={18} />} content="Format (Shift + Alt + F)" />
          </button>
        </>
      )}
      {toggleMax && (
        <button type="button" className="hover:opacity-80" onClick={toggleMax}>
          <SnSimpleTooltip trigger={<Maximize2 size={18} />} content="Full screen (Ctrl + M)" />
        </button>
      )}
    </div>
  )
}
