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
      <SnSimpleTooltip content="Search (Ctrl + F)">
        <button type="button" className="hover:opacity-80" onClick={() => editorRef.current?.openSearch()}>
          <SearchCode size={18} />
        </button>
      </SnSimpleTooltip>
      {readonly ? (
        <SnSimpleTooltip content="Readonly field">
          <Lock size={18} />
        </SnSimpleTooltip>
      ) : (
        <>
          <SnSimpleTooltip content="Comment (Ctrl + /)">
            <button type="button" className="hover:opacity-80" onClick={() => editorRef.current?.toggleComment()}>
              <MessageSquareCode size={18} />
            </button>
          </SnSimpleTooltip>
          <SnSimpleTooltip content="Format (Shift + Alt + F)">
            <button type="button" className="hover:opacity-80" onClick={() => editorRef.current?.format()}>
              <Wand2 size={18} />
            </button>
          </SnSimpleTooltip>
        </>
      )}
      {toggleMax && (
        <SnSimpleTooltip content="Full screen (Ctrl + M)">
          <button type="button" className="hover:opacity-80" onClick={toggleMax}>
            <Maximize2 size={18} />
          </button>
        </SnSimpleTooltip>
      )}
    </div>
  )
}
