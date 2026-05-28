/**
 * Oculta parcialmente un correo electrónico para proteger la privacidad del cliente.
 * Ejemplo: juan.perez@gmail.com -> ju***ez@gmail.com
 * Ejemplo: ana@example.com -> a*a@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '—';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [username, domain] = parts;
  if (username.length <= 2) {
    return `${username[0]}*@${domain}`;
  }
  if (username.length <= 4) {
    return `${username[0]}**${username[username.length - 1]}@${domain}`;
  }
  return `${username.substring(0, 2)}***${username.substring(username.length - 2)}@${domain}`;
}

/**
 * Oculta parcialmente un número de teléfono para proteger la privacidad del cliente.
 * Ejemplo: +51 987654321 -> +51 98***321
 * Ejemplo: 987654321 -> 98***321
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 5) return phone;
  
  if (clean.startsWith('+')) {
    const prefix = clean.substring(0, 5); // ej: +5198
    const remaining = clean.substring(5);
    if (remaining.length <= 3) {
      return `${prefix}***`;
    }
    return `${prefix}***${remaining.substring(remaining.length - 3)}`;
  }
  
  // Formato sin código internacional
  return `${clean.substring(0, 3)}***${clean.substring(clean.length - 3)}`;
}

/**
 * Identifica si el contacto es un email o un teléfono y aplica el enmascaramiento correcto.
 */
export function maskContact(contact: string | null | undefined): string {
  if (!contact) return '—';
  if (contact.includes('@')) {
    return maskEmail(contact);
  }
  return maskPhone(contact);
}
