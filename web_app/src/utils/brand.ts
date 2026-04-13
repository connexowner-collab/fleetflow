/**
 * Aplica as cores da marca dinamicamente nas CSS variables do documento.
 * Chamado ao carregar o dashboard e ao salvar nas Configurações.
 */
export function applyBrandColor(hex: string) {
  if (typeof document === 'undefined') return
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return

  const hover = darken(hex, 0.12)

  document.documentElement.style.setProperty('--brand-primary', hex)
  document.documentElement.style.setProperty('--brand-primary-hover', hover)
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const dr = Math.max(0, Math.floor(r * (1 - amount)))
  const dg = Math.max(0, Math.floor(g * (1 - amount)))
  const db = Math.max(0, Math.floor(b * (1 - amount)))
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`
}
