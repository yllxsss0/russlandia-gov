// submit.js

// Словарь: тип формы -> { техническое_имя_поля: "Человекочитаемое название" }
const FIELD_LABELS = {
  hiring: {
    fullName: 'ФИО',
    age: 'Возраст',
    experience: 'Готовы ли подчиняться богам (основателям)',
    lawKnowledge: 'Сексуальная ориентация',
    passport: 'Почему хочет стать гражданином',
    militaryId: 'Почему считает себя достойным',
    medical: 'Дополнительно'
  },
  // сюда потом добавишь остальные формы, например:
  // promotion: { ... },
  // vacation: { ... },
};

export default async function handler(req, res) {
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

    // Берём словарь лейблов для этого типа формы (если есть)
    const labels = FIELD_LABELS[type] || {};

    const fields = Object.entries(formData)
      .filter(([_, value]) => value)
      .map(([key, value]) => ({
        name: `📌 ${labels[key] || key}`, // <-- вот тут подмена
        value: String(value).slice(0, 1024),
        inline: false
      }));

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

    const embed = {
      title: `🚀 Новая заявка (Тип: ${type || 'Форма'})`,
      color: 0x5865F2,
      fields: fields,
      timestamp: new Date().toISOString(),
      footer: { text: 'Russlandia Portal • Заявка' }
    };

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
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
