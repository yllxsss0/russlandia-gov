import { verifyToken } from '../../lib/discord';
import { isBlacklisted, addToBlacklist } from '../../lib/blacklist';
import { containsBadWords, findBadWord, findAllBadWords } from '../../lib/badwords';
import { checkSpam } from '../../lib/antispam';
import { kv } from '@vercel/kv';

const WHITELIST = ['200102286473691139'];

const DEPARTMENTS = {
  'af': { name: 'AF', emoji: '✈️', roleId: '1514695692520525834', roleId2: '1541128485089837136', webhook: process.env.WEBHOOK_REPORT_AF },
  'iad': { name: 'IAD', emoji: '⚖️', roleId: '1514608894700159139', roleId2: '1541128640140550194', webhook: process.env.WEBHOOK_REPORT_IAD },
  'swat': { name: 'SWAT', emoji: '🛡️', roleId: '1514608894679191601', roleId2: '1535279144102006784', webhook: process.env.WEBHOOK_REPORT_SWAT },
  'pai': { name: 'PAI', emoji: '🎓', roleId: '1514608894679191598', roleId2: '1541129110623879249', webhook: process.env.WEBHOOK_REPORT_PAI },
  'dvd': { name: 'DVD', emoji: '🚗', roleId: '1514608894679191600', roleId2: '1541104206184845372', webhook: process.env.WEBHOOK_REPORT_DVD },
  'db': { name: 'DB', emoji: '🕵️', roleId: '1514608894679191599', roleId2: '1541129158095020074', webhook: process.env.WEBHOOK_REPORT_DB },
  'k9': { name: 'K9', emoji: '🐕', roleId: '1514695474362450093', roleId2: '1541105887408820224', webhook: process.env.WEBHOOK_REPORT_K9 },
  'pa': { name: 'PA', emoji: '🎓', roleId: '1514608894679191598', roleId2: '1541129110623879249', webhook: process.env.WEBHOOK_REPORT_PA },
  'cpd': { name: 'CPD', emoji: '🚔', roleId: '1514695305633992706', roleId2: '1541104610935177406', webhook: process.env.WEBHOOK_REPORT_CPD },
  'halt': { name: 'HALT', emoji: '🚁', roleId: '1514695733146554558', roleId2: '1541129314257346630', webhook: process.env.WEBHOOK_REPORT_HALT },
  'ted': { name: 'TED', emoji: '🔫', roleId: '1541117825169752175', roleId2: '1541166789822648354', webhook: process.env.WEBHOOK_REPORT_TED },
  'srt': { name: 'SRT', emoji: '🛡️', roleId: '1541638981865705502', roleId2: '1541638846242881606', webhook: process.env.WEBHOOK_REPORT_SRT },
  'nred': { name: 'NRED', emoji: '🚨', roleId: '1541135772864880730', roleId2: '1541137871379898451', webhook: process.env.WEBHOOK_REPORT_NRED },
  'med': { name: 'MED', emoji: '🏥', roleId: '1541133627772117032', roleId2: '1541110783885443092', webhook: process.env.WEBHOOK_REPORT_MED }
};

const TRANSFER_WEBHOOKS = {
  'af': process.env.WEBHOOK_TRANSFER_AF, 'iad': process.env.WEBHOOK_TRANSFER_IAD,
  'swat': process.env.WEBHOOK_TRANSFER_SWAT, 'pai': process.env.WEBHOOK_TRANSFER_PAI,
  'dvd': process.env.WEBHOOK_TRANSFER_DVD, 'db': process.env.WEBHOOK_TRANSFER_DB,
  'k9': process.env.WEBHOOK_TRANSFER_K9, 'cpd': process.env.WEBHOOK_TRANSFER_CPD,
  'halt': process.env.WEBHOOK_TRANSFER_HALT, 'ted': process.env.WEBHOOK_TRANSFER_TED,
  'srt': process.env.WEBHOOK_TRANSFER_SRT, 'nred': process.env.WEBHOOK_TRANSFER_NRED,
  'med': process.env.WEBHOOK_TRANSFER_MED
};

const webhooks = {};


async function sendToDiscord(webhookUrl, data, retries = 3) {
  let lastError = null;
  const url = data.thread_id ? `${webhookUrl}?thread_id=${data.thread_id}` : webhookUrl;
  const { thread_id, ...payload } = data;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) return { success: true };
      if (res.status === 429) { await new Promise(r => setTimeout(r, (parseInt(res.headers.get('Retry-After')) || 5) * 1000)); continue; }
      return { success: false, error: await res.text() };
    } catch (e) { lastError = e; if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1))); }
  }
  return { success: false, error: lastError?.message };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = verifyToken(req.cookies.token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const ip = req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const isWhitelisted = WHITELIST.includes(user.id);

      const fieldNames = {
      fullName: 'Имя Фамилия + Статик', age: 'Возраст', experience: 'Опыт работы',
      lawKnowledge: 'Знание законов', passport: 'Скриншот паспорта', militaryId: 'Военный билет',
      medical: 'Мед. справки', reason: 'Причина', rank: 'Ранг', weapon: 'Оружие',
      currentDepartment: 'Текущий отдел', targetDepartment: 'Желаемый отдел',
      startDate: 'Дата начала', endDate: 'Дата окончания', rankRange: 'Диапазон рангов',
      reportLink: 'Ссылка на отчет', workLink: 'Ссылка на работу', workLinks: 'Ссылки на работу',
      screenshot: 'Скриншот', rankProof: 'Доказательство ранга', approvalProof: 'Одобрение',
      stateFractionsProof: 'Скрин одобрения', rankAtDismissal: 'Ранг при увольнении',
      dbWhatIs: 'Что такое DB', dbExperience: 'Опыт в DB', dbExamples: 'Примеры работ',
      dbServers: 'Серверы с DB', dbKnowledge: 'Знания DB', dbLawKnowledge: 'Знания законки'
    };

    let fieldName = 'заявке';
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string' && value.toLowerCase().includes(foundWord.toLowerCase())) {
        fieldName = fieldNames[key] || key;
        break;
      }
    }

    await sendBanWordAlert(user, foundWord, allText, type, req);
    return res.status(400).json({ 
      error: `❌ В поле "${fieldName}" найдено запрещённое слово: "${foundWord}". Форма не отправлена.` 
    });
  }

  let webhookUrl, roleMentions = '', threadId = null;

  if (type === 'report') {
    const dept = DEPARTMENTS[department];
    if (!dept) return res.status(400).json({ error: 'Выберите отдел' });
    webhookUrl = dept.webhook; if (!webhookUrl) return res.status(500).json({ error: 'Вебхук не настроен' });
    if (dept.roleId) roleMentions += `<@&${dept.roleId}> `;
    if (dept.roleId2) roleMentions += `<@&${dept.roleId2}> `;
  } else if (type === 'transfer') {
    webhookUrl = TRANSFER_WEBHOOKS[targetDepartment]; if (!webhookUrl) return res.status(500).json({ error: 'Вебхук не настроен' });
    const di = DEPARTMENTS[targetDepartment];
    if (di?.roleId) roleMentions += `<@&${di.roleId}> `;
    if (di?.roleId2) roleMentions += `<@&${di.roleId2}> `;
  } else if (type === 'highrank') { webhookUrl = webhooks.highrank; roleMentions = '<@&1514608894700159142> <@&1514690313233371226>'; }
  else if (type === 'resignation') { webhookUrl = webhooks.resignation; roleMentions = '<@&1514608894679191597>'; }
  else if (type === 'reinstatement') { webhookUrl = webhooks.reinstatement; roleMentions = '<@&1514690313233371226> <@&1514608894679191598>'; }
  else if (type === 'transfer-to-lspd') { webhookUrl = webhooks['transfer-to-lspd']; roleMentions = '<@&1514690313233371226> <@&1514608894700159142>'; }
  else if (type === 'hiring') { webhookUrl = webhooks.hiring; roleMentions = '<@&1514608894666735724> <@&1514608894679191598> <@&1541129110623879249>'; }
  else if (type === 'weapon-request') { webhookUrl = webhooks['weapon-request']; roleMentions = '<@&1514690313233371226> <@&1514608894700159142>'; }
  else if (type === 'leave') {
    webhookUrl = webhooks.leave;
    const di = DEPARTMENTS[department];
    if (di?.roleId) roleMentions += `<@&${di.roleId}> `;
    if (di?.roleId2) roleMentions += `<@&${di.roleId2}> `;
    threadId = leaveType === 'ooc' ? '1541113530743390288' : '1541113565505781891';
  } else { webhookUrl = webhooks.promotion; roleMentions = '<@&1514608894679191597>'; }
  if (!webhookUrl) return res.status(500).json({ error: 'Вебхук не настроен' });

  if (!isWhitelisted) {
    const ipCount = await kv.get(`lspd:spam:ip:${ip}`);
    if (ipCount && parseInt(ipCount) >= 6) return res.status(429).json({ error: '🚫 Слишком много с IP.' });
  }

  const embed = {
    title: getFormTitle(type, department, targetDepartment, leaveType),
    color: getFormColor(type),
    author: { name: user.username, icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` },
    fields: buildFields(type, department, targetDepartment, formData, leaveType, user.id),
    footer: { text: 'LSPD Forms • ' + new Date().toLocaleDateString('ru-RU') },
    timestamp: new Date().toISOString()
  };

  const result = await sendToDiscord(webhookUrl, { 
    content: roleMentions.trim() || undefined, 
    embeds: [embed], 
    username: 'LSPD Forms', 
    avatar_url: 'https://i.imgur.com/AfFp7pu.png',
    ...(threadId ? { thread_id: threadId } : {})
  });

  if (result.success) {
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ error: `Не удалось отправить: ${result.error}` });
  }
}

function getFormTitle(type, department, targetDepartment, leaveType) {
  if (type === 'report') { const d = DEPARTMENTS[department]; return `📋 Отчёт о повышении • ${d ? d.emoji + ' ' + d.name : 'Отдел'}`; }
  if (type === 'transfer') { const n = { af:'AF',iad:'IAD',swat:'SWAT',pai:'PAI',dvd:'DVD',db:'DB',k9:'K9',cpd:'CPD',halt:'HALT',ted:'TED',srt:'SRT',nred:'NRED',med:'MED' }; return `🔄 Запрос на перевод в ${n[targetDepartment]||'Отдел'}`; }
  if (type === 'highrank') return '🌟 Отчёт на повышение (Хай Ранги)';
  if (type === 'resignation') return '🚪 Заявление на увольнение';
  if (type === 'reinstatement') return '🔄 Восстановление в LSPD';
  if (type === 'transfer-to-lspd') return '🏛️ Перевод в LSPD';
  if (type === 'hiring') return '📝 Трудоустройство в LSPD';
  if (type === 'weapon-request') return '🔫 Запрос на спец вооружение';
  if (type === 'leave') return `🏖️ ${leaveType === 'ooc' ? 'OOC' : 'IC'} Отпуск`;
  return '📈 Запрос на повышение';
}

function getFormColor(type) {
  const c = { promotion:0x4CAF50, transfer:0x2196F3, report:0xFF9800, highrank:0xFF69B4, resignation:0xDC3545, reinstatement:0x9C27B0, 'transfer-to-lspd':0x00BCD4, hiring:0x4CAF50, 'weapon-request':0xFF5722, leave:0x00BCD4 };
  return c[type] || 0x5865F2;
}

function buildFields(type, department, targetDepartment, data, leaveType, userId) {
  const base = [
    { name: '👤 Отправитель', value: `<@${userId}>`, inline: true },
    { name: '🆔 Discord ID', value: userId, inline: true }
  ];

  if (type === 'leave') {
    const d = DEPARTMENTS[department];
    return [
      { name: '📋 Тип отпуска', value: leaveType === 'ooc' ? '🌍 OOC' : '🎮 IC', inline: false },
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '🏢 Отдел', value: d ? d.emoji + ' ' + d.name : (department || 'Не указан'), inline: false },
      { name: '📝 Причина отпуска', value: data.reason || 'Не указано', inline: false },
      { name: '📅 Дата начала', value: data.startDate || 'Не указано', inline: true },
      { name: '📅 Дата окончания', value: data.endDate || 'Не указано', inline: true },
      ...base
    ];
  }

  if (type === 'report') {
    const d = DEPARTMENTS[department];
    return [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '🏢 Отдел', value: d ? d.emoji + ' ' + d.name : 'Не указан', inline: false },
      { name: '📌 Текущий ранг', value: data.currentRank || 'Не указан', inline: false },
      { name: '🎯 Целевой ранг', value: data.targetRank || 'Не указан', inline: false },
      { name: '👨‍🏫 Инструктор', value: data.isInstructor === 'yes' ? '✅ Да' : '❌ Нет', inline: false },
      { name: '🔗 Ссылки на работу', value: data.workLinks || 'Не указаны', inline: false },
      ...base
    ];
  }

  if (type === 'promotion') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '📊 Диапазон рангов', value: data.rankRange || 'Не указано', inline: false },
    { name: '🔗 Ссылка на отчет', value: data.reportLink || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'highrank') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '📊 Диапазон рангов', value: data.rankRange || 'Не указано', inline: false },
    { name: '🔗 Ссылка на работу', value: data.workLink || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'resignation') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '📸 Скриншот планшета', value: data.screenshot || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'reinstatement') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '📌 Ранг на момент увольнения', value: data.rankAtDismissal || 'Не указан', inline: false },
    { name: '📸 Доказательство ранга', value: data.rankProof || 'Не указано', inline: false },
    { name: '⚠️ Уволен после Ban/Warn', value: data.wasWarned === 'yes' ? '✅ Да' : '❌ Нет', inline: false },
    ...(data.wasWarned === 'yes' ? [{ name: '📄 Скрин одобрения State Fractions', value: data.stateFractionsProof || 'Не указано', inline: false }] : []),
    ...base
  ];

  if (type === 'transfer-to-lspd') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '✅ Одобрение перевода от начальства', value: data.approvalProof || 'Не указано', inline: false },
    { name: '📸 Доказательство ранга', value: data.rankProof || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'hiring') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '🎂 Возраст (RP)', value: data.age || 'Не указан', inline: false },
    { name: '💼 Опыт работы в гос. структурах', value: data.experience || 'Не указан', inline: false },
    { name: '📚 Знание законов RP', value: (data.lawKnowledge||'?') + '/10', inline: false },
    { name: '🪪 Скриншот паспорта', value: data.passport || 'Не указано', inline: false },
    { name: '🎖️ Скриншот военного билета', value: data.militaryId || 'Не указано', inline: false },
    { name: '🏥 Скриншот мед. справок', value: data.medical || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'weapon-request') return [
    { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
    { name: '🏢 Отдел', value: data.department || 'Не указан', inline: false },
    { name: '📌 Ранг', value: data.rank || 'Не указан', inline: false },
    { name: '🔫 Запрашиваемое оружие', value: data.weapon || 'Не указано', inline: false },
    ...base
  ];

  if (type === 'transfer') {
    const f = [
      { name: '👤 Имя Фамилия + Статик', value: data.fullName || 'Не указано', inline: false },
      { name: '📌 Ваш ранг', value: data.rank || 'Не указан', inline: false },
      { name: '🏢 Текущий отдел', value: data.currentDepartment || 'Не указано', inline: false },
      { name: '🎯 Желаемый отдел', value: targetDepartment || 'Не указано', inline: false },
      { name: '📝 Причина перевода', value: data.reason || 'Не указано', inline: false }
    ];
    if (targetDepartment === 'db') f.push(
      { name: '📋 Чем занимается DB?', value: data.dbWhatIs || 'Не указано', inline: false },
      { name: '📋 Опыт работы в DB?', value: data.dbExperience || 'Не указано', inline: false },
      { name: '📋 Примеры работ', value: data.dbExamples || 'Не указано', inline: false },
      { name: '📋 Серверы с DB', value: data.dbServers || 'Не указано', inline: false },
      { name: '📋 Знания по работе DB (1-10)', value: (data.dbKnowledge||'?') + '/10', inline: false },
      { name: '📋 Знания по законке (1-10)', value: (data.dbLawKnowledge||'?') + '/10', inline: false }
    );
    f.push(...base); return f;
  }

  return [...base, ...Object.entries(data).map(([k,v]) => ({ name: k, value: String(v) || 'Не указано', inline: false }))];
}
