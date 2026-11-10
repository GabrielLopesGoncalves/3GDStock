export const emailValido = (email) => /^[^\s@]+@[^\s@]+\.com$/i.test(email);

export const senhaValida = (senha) =>
  senha.length > 6 && /[A-Z]/.test(senha) && /\d/.test(senha) && /[\p{P}\p{S}]/u.test(senha);
