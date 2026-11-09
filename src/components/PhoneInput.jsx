import { formatPhone } from '../utils/phone.js'

// Uncontrolled so native form.reset() also restores the country prefix.
export default function PhoneInput(props) {
  function formatInput(event) {
    const input = event.currentTarget
    const beforeCaret = input.value.slice(0, input.selectionStart)
    const digitCount = beforeCaret.replace(/\D/g, '').length
    const hadPrefix = input.value.replace(/\D/g, '').startsWith('380')
    input.value = formatPhone(input.value)
    const targetDigits = hadPrefix ? Math.max(3, digitCount) : digitCount + 3
    let caret = 0
    let count = 0
    while (caret < input.value.length && count < targetDigits) {
      if (/\d/.test(input.value[caret])) count++
      caret++
    }
    while (input.value[caret] === ' ') caret++
    input.setSelectionRange(caret, caret)
  }

  function handleKeyDown(event) {
    const input = event.currentTarget
    const start = input.selectionStart
    const end = input.selectionEnd
    if (start !== end) return
    if (event.key === 'Backspace' && start <= 5) {
      event.preventDefault()
    } else if (event.key === 'Backspace' && input.value[start - 1] === ' ') {
      event.preventDefault()
      input.setRangeText('', start - 2, start, 'end')
      formatInput(event)
    } else if (event.key === 'Delete' && input.value[start] === ' ') {
      event.preventDefault()
      input.setRangeText('', start, start + 2, 'end')
      formatInput(event)
    } else if (event.key === 'Delete' && start < 5) {
      event.preventDefault()
    }
  }

  return <input {...props} type="tel" name="phone" autoComplete="tel" inputMode="tel"
    defaultValue="+380 " onChange={formatInput} onKeyDown={handleKeyDown}
    onPaste={(event) => {
      const pasted = event.clipboardData.getData('text')
      if (pasted.replace(/\D/g, '').length >= 9) {
        event.preventDefault()
        event.currentTarget.value = formatPhone(pasted)
        const end = event.currentTarget.value.length
        event.currentTarget.setSelectionRange(end, end)
      }
    }}
    onFocus={(event) => {
      if (event.currentTarget.value.trim() === '+380') {
        event.currentTarget.setSelectionRange(5, 5)
      }
    }} />
}
