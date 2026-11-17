import type { CSSProperties, RefObject } from 'react'
import type { Card } from './model'
import { backgroundCSS, palettes } from './model'
import { CodeView } from './CodeView'
export function CardPreview({ card: c, exportRef, scale, change }: { card: Card; exportRef: RefObject<HTMLDivElement | null>; scale: number; change: (c: Card) => void }) {
  const p = palettes[c.theme] || palettes.Midnight
  return <div className="card-scaled" style={{ width: c.width * scale, height: c.height * scale }}><div className="card-art" ref={exportRef} style={{ width:c.width,height:c.height,transform:`scale(${scale})`,padding:c.padding }}>
    <div className="card-background" style={{ background:backgroundCSS(c),filter:`blur(${c.bgBlur}px)`,opacity:c.bgOpacity / 100 }} />
    {c.grain > 0 && <svg className="grain" style={{ opacity:c.grain / 100 }} width="100%" height="100%"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#grain)" opacity=".5" /></svg>}
    <div className="code-stack" style={{ transform:`perspective(1200px) rotateY(${c.perspective}deg) rotate(${c.rotation}deg)`,filter:`blur(${c.blur}px)`,WebkitBoxReflect:c.reflection ? `below 14px linear-gradient(transparent,rgba(255,255,255,${c.reflection/100}))` : undefined } as CSSProperties}>
      {c.blocks.map(b => <div key={b.id} className={`code-window window-${c.window.toLowerCase()}`} style={{ background:c.gradientBorder ? `linear-gradient(${p.bg},${p.bg}) padding-box,linear-gradient(135deg,${c.color},${c.color2}) border-box` : `${p.bg}${Math.round((1 - c.glass/100)*255).toString(16).padStart(2,'0')}`,color:p.fg,borderRadius:c.radius,border:`${c.border}px solid ${c.gradientBorder ? 'transparent' : '#ffffff26'}`,boxShadow:`0 ${c.shadow/2}px ${c.shadow}px #0005,0 0 ${c.glow}px ${c.color}88,${c.depth}px ${c.depth}px 0 #0005`,backdropFilter:'blur(16px)' }}>
        {(c.fileName || c.controls) && <div className="code-window-bar">{c.controls && <span className="window-buttons">{c.window === 'Windows' ? '−  □  ×' : c.window === 'Terminal' ? '❯_' : c.window === 'Minimal' ? '•••' : <><i /><i /><i /></>}</span>}{c.fileName && <span className="code-filename">{b.name}</span>}<span className="language-badge">{b.label}</span></div>}
        <CodeView card={c} block={b} />
      </div>)}
    </div>
    {c.annotations.map(a => <div key={a.id} className={`annotation annotation-${a.kind}`} style={{ left:`${a.x}%`,top:`${a.y}%`,color:a.color,fontSize:a.size,touchAction:'none' }} onPointerDown={e => { const el = e.currentTarget; el.setPointerCapture(e.pointerId); const start = { x:e.clientX,y:e.clientY }; const move = (ev: PointerEvent) => { el.style.left = `${a.x + (ev.clientX-start.x)/(c.width*scale)*100}%`; el.style.top = `${a.y + (ev.clientY-start.y)/(c.height*scale)*100}%` }; const end = (ev: PointerEvent) => { el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',end); change({ ...c,annotations:c.annotations.map(x => x.id === a.id ? { ...x,x:Math.max(0,Math.min(95,a.x+(ev.clientX-start.x)/(c.width*scale)*100)),y:Math.max(0,Math.min(95,a.y+(ev.clientY-start.y)/(c.height*scale)*100)) } : x) }) };el.addEventListener('pointermove',move);el.addEventListener('pointerup',end) }}>{a.kind === 'arrow' ? '⟶' : a.kind === 'circle' ? '◯' : a.kind === 'rectangle' ? '▭' : a.kind === 'underline' ? '______' : a.text}</div>)}
  </div></div>
}
