export function timeOf(date: string) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function dateTimeOf(date: string) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export function avatarInitial(name: string) {
  return (name || '?')[0].toUpperCase();
}

export function conversationName(conv: { customerName?: string; customerPhone?: string }) {
  return conv.customerName || conv.customerPhone || 'Sin nombre';
}
