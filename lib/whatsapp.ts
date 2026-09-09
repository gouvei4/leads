/**
 * Normaliza um telefone brasileiro (formatos variados vindos do Google Places,
 * ex: "(11) 91234-5678", "+55 11 91234-5678") para o padrão que o wa.me aceita:
 * código do país + DDD + número, só dígitos.
 */
export function normalizarTelefoneBr(telefone: string): string | null {
  let digitos = telefone.replace(/\D/g, "");
  if (!digitos) return null;

  if (digitos.startsWith("0")) digitos = digitos.replace(/^0+/, "");

  if (digitos.startsWith("55") && digitos.length >= 12 && digitos.length <= 13) {
    return digitos;
  }
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return null;
}

/**
 * Celular BR tem o 9 na frente do número: DDI(55) + DDD(2) + 9 + 8 dígitos = 13.
 * Número de 12 dígitos (55 + DDD + 8) é fixo — não tem WhatsApp.
 */
export function ehCelularBr(numeroNormalizado: string): boolean {
  return numeroNormalizado.length === 13;
}

export function waLink(telefone: string, mensagem: string): string | null {
  const numero = normalizarTelefoneBr(telefone);
  if (!numero || !ehCelularBr(numero)) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
