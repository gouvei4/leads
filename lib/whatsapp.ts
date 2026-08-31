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

export function waLink(telefone: string, mensagem: string): string | null {
  const numero = normalizarTelefoneBr(telefone);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
