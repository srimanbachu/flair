import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import type { Card, CodeBlock } from './model'
import { inRanges, palettes } from './model'
import type { CSSProperties } from 'react'
function tokenNodes(tokens: (string | Prism.Token)[], words: string[], key = ''): React.ReactNode[] {
  return tokens.map((token, i) => { const id = `${key}-${i}`; if (typeof token === 'string') { if (!words.length) return token; const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); return token.split(new RegExp(`(${escaped.join('|')})`, 'g')).map((part, j) => words.includes(part) ? <mark key={`${id}-${j}`}>{part}</mark> : part) } return <span className={`token ${token.type}`} key={id}>{tokenNodes(Array.isArray(token.content) ? token.content : [token.content], words, id)}</span> })
}
export function CodeView({ card, block }: { card: Card; block: CodeBlock }) {
  const p = palettes[card.theme] || palettes.Midnight
  const style = { '--syntax-keyword': p.keyword, '--syntax-string': p.string, '--syntax-number': p.number, '--syntax-comment': p.comment, color: p.fg, fontFamily: card.font, fontSize: card.fontSize, lineHeight: card.lineHeight, letterSpacing: card.letterSpacing } as CSSProperties
  return <div className="syntax" style={style}>{block.code.split('\n').map((line, i) => <div key={i} className={`code-line ${inRanges(block.highlights, i + 1) ? 'line-highlight' : ''} ${inRanges(block.glow, i + 1) ? 'line-glow' : ''}`}><span className="line-number" style={{ display: card.lineNumbers ? undefined : 'none' }}>{i + 1}</span><span className="line-text" style={{ filter: inRanges(block.blur, i + 1) ? 'blur(6px)' : undefined }}>{tokenNodes(Prism.tokenize(line || ' ', Prism.languages[block.language] || {}), block.words.split(',').map(w => w.trim()).filter(Boolean))}</span>{inRanges(block.comment, i + 1) && <span className="comment-indicator" title="Comment indicator">●</span>}</div>)}</div>
}
