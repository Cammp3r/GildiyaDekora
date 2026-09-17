const TELEGRAM_API_BASE = 'https://api.telegram.org'

export async function sendTelegramMessage(config, text) {
  if (!config.telegramBotToken || !config.telegramChatId) {
    throw new Error('Telegram is not configured.')
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${config.telegramBotToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text,
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Telegram API error ${response.status}: ${body}`)
  }
}
