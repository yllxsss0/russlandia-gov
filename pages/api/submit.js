export default async function handler(req, res) {
  // Разрешаем только POST запросы для отправки форм
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  try {

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Не авторизован' });
    const user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    const { type, department, ...formData } = req.body;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      return res.status(500).json({ error: 'Вебхук DISCORD_WEBHOOK_URL не настроен в Vercel!' });
    }

        // Собираем все заполненные поля формы в читаемый текст для Discord
    const fields = Object.entries(formData)
      .filter(([_, value]) => value) // убираем пустые поля
      .map(([key, value]) => ({
        name: `📌 ${key}`,
        value: String(value).slice(0, 1024),
        inline: false // основные поля идут друг под другом
      }));

    // Добавляем в самый конец две inline-колонки, как в оригинале LSPD
    fields.push({
      name: '👤 Отправитель',
      value: `<@${user.id}>`,
      inline: true
    });

    fields.push({
      name: '🆔 Discord ID',
      value: `\`${user.id}\``,
      inline: true
    });

    // Формируем красивую карточку для Дискорда
    const embed = {
      title: `🚀 Новая заявка (Тип: ${type || 'Форма'})`,
      color: 0x5865F2, // Фиолетовый цвет Дискорда
      fields: fields, // сюда уже вшиты наши колонки!
      timestamp: new Date().toISOString(),
      footer: { text: 'Russlandia Portal • Заявка' }
    };


    // Отправляем данные на твой вебхук
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed]
      })
    });

    if (discordResponse.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorText = await discordResponse.text();
      return res.status(500).json({ error: `Дискорд вернул ошибку: ${errorText}` });
    }

  } catch (error) {
    return res.status(500).json({ error: `Внутренняя ошибка сервера: ${error.message}` });
  }
}
