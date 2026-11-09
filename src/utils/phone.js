export function phoneDigits(value) {
  let digits = String(value).replace(/\D/g, '')
  if (digits.startsWith('380')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return digits.slice(0, 9)
}

export function formatPhone(value) {
  const digits = phoneDigits(value)
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)]
  return '+380' + (digits ? ' ' + groups.filter(Boolean).join(' ') : ' ')
}

export function isValidPhone(value) {
  return /^380\d{9}$/.test(String(value).replace(/\D/g, ''))
}
