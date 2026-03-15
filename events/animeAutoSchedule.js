const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const { getAiringAnime } = require('../helpers/malService');

/* ======================================================
  CONFIG
====================================================== */

const ANIME_CHANNEL_ID =
  process.env.ANIME_CHANNEL_ID || '1160586075186675852';

const TEST_MODE = false;
const WIB = 'Asia/Jakarta';

/* ======================================================
  DAY MAP (MAL FORMAT)
====================================================== */

const DAY_INDEX = {
  Sundays: 0,
  Mondays: 1,
  Tuesdays: 2,
  Wednesdays: 3,
  Thursdays: 4,
  Fridays: 5,
  Saturdays: 6,
};

/* ======================================================
  INTERNAL STATE
====================================================== */

const scheduledReminders = new Set();

/* ======================================================
  MAIN EXPORT
====================================================== */

module.exports = client => {

  /* =====================
    STARTUP SCAN
  ====================== */

  setTimeout(() => {
    runScan(client, {
      sendList: false,
      label: 'Startup',
    });
  }, TEST_MODE ? 3000 : 5000);

  /* =====================
    HOURLY SCAN (xx:07)
  ====================== */

  cron.schedule(
    '7 * * * *',
    () => runScan(client, {
      sendList: false,
      label: 'Hourly',
    }),
    { timezone: WIB }
  );

  /* =====================
    DAILY SCAN (08:00 WIB)
  ====================== */

  cron.schedule(
    '0 8 * * *',
    () => {
      cleanupExpiredReminders();
      runScan(client, {
        sendList: true,
        label: 'Daily 08:00',
      });
    },
    { timezone: WIB }
  );
};

/* ======================================================
  CORE SCAN
====================================================== */

async function runScan(client, { sendList = false, label = 'Scan' } = {}) {
  console.log(`[ANIME] ${label} scan started`);

  const channel = await client.channels.fetch(ANIME_CHANNEL_ID).catch(() => null);
  if (!channel) return;

  const animeList = await getAiringAnime();
  if (!animeList?.length) return;

  const now = Date.now();
  const next24h = now + 24 * 60 * 60 * 1000;
  const upcoming = [];

  for (const anime of animeList) {
    if (!anime.broadcast?.day || !anime.broadcast?.time) continue;

    const airingUTC = buildAiringUTC(anime.broadcast);
    if (!airingUTC || airingUTC < now || airingUTC > next24h) continue;

    const key = `${anime.mal_id}-${airingUTC}`;

    if (!scheduledReminders.has(key)) {
      scheduledReminders.add(key);
      scheduleReminder(client, anime, airingUTC);
    }

    upcoming.push({ anime, airingUTC });
  }

  if (sendList && upcoming.length) {
    await sendScheduleEmbed(channel, upcoming);
  }
}

/* ======================================================
  MENTION UTIL (FIXED @EVERYONE)
====================================================== */

function getMentionPayload() {
  return {
    content: '@everyone',
    allowedMentions: { parse: ['everyone'] },
  };
}

/* ======================================================
  DAILY LIST EMBED
====================================================== */

async function sendScheduleEmbed(channel, upcoming) {
  const client = channel.client;

  upcoming.sort((a, b) => a.airingUTC - b.airingUTC);

  const embed = new EmbedBuilder()
    .setColor(0x22c55e)
    .setAuthor({
      name: 'Sabatora • ANIME SCHEDULE',
      iconURL: client.user.displayAvatarURL(),
    })
    .setTitle('📅 Today’s Airing Lineup')
    .setDescription(
      '🎎 **Anime yang akan tayang dalam 24 jam ke depan**\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
    )
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setFooter({
      text: 'Sabatora • Anime Timeline',
      iconURL: client.user.displayAvatarURL(),
    })
    .setTimestamp();

  for (const { anime, airingUTC } of upcoming) {
    const unix = Math.floor(airingUTC / 1000);

    embed.addFields({
      name: `🎬 ${anime.title}`,
      value:
        `🕒 **${fmtWIB(airingUTC)} WIB** ⏳ <t:${unix}:R>\n` +
        `⭐ ${anime.score ?? 'N/A'}\n` +
        `🏢 ${anime.studios?.[0]?.name || 'Unknown'}\n` +
        `🎭 ${anime.genres?.slice(0, 3).map(g => g.name).join(', ') || '—'}`,
    });
  }

  await channel.send({
    ...getMentionPayload(),
    embeds: [embed],
  });
}

/* ======================================================
  REMINDER HANDLER
====================================================== */

function scheduleReminder(client, anime, airingUTC) {
  const delay = TEST_MODE ? 5000 : airingUTC - Date.now();
  if (!TEST_MODE && delay <= 0) return;

  console.log(
    `[ANIME] Reminder scheduled: ${anime.title} (${fmtWIB(airingUTC)} WIB)`
  );

  setTimeout(async () => {
    try {
      const channel = await client.channels.fetch(ANIME_CHANNEL_ID);
      if (!channel) return;

      const score = Number(anime.score) || 0;

      const color =
        score >= 9 ? 0x1abc9c :
        score >= 8 ? 0x2ecc71 :
        score >= 7 ? 0xf1c40f :
        score >= 6 ? 0xe67e22 :
        score >= 5 ? 0xe74c3c :
        0x2c3e50;

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('🎉 Episode Terbaru Sudah Tayang!')
        .setDescription(
          `🎬 **${anime.title}**\n\n` +
          `📢 Episode terbaru **resmi tayang hari ini**.\n` +
          `Selamat menonton dan silakan diskusi dengan bijak!`
        )
        .setThumbnail(anime.images?.jpg?.image_url)
        .setURL(anime.url)
        .addFields(
          {
            name: '🕒 Waktu Tayang',
            value: `**${fmtWIB(airingUTC)} WIB**`,
            inline: true,
          },
          {
            name: '⭐ Rating MAL',
            value: anime.score ? `${anime.score} / 10` : 'Belum ada',
            inline: true,
          },
          {
            name: '📚 Source',
            value: formatSource(anime.source),
            inline: true,
          },
          {
            name: '🏢 Studio',
            value: anime.studios?.[0]?.name || 'Unknown',
            inline: true,
          },
          {
            name: '🏷️ Genre',
            value: anime.genres?.map(g => g.name).join(', ') || 'Unknown',
          }
        )
        .setFooter({ text: '📡 JLS • Anime Airing Reminder' })
        .setTimestamp();

      await channel.send({
        ...getMentionPayload(),
        embeds: [embed],
      });

    } catch (err) {
      console.error('[ANIME] Reminder error:', err);
    }
  }, delay);
}

/* ======================================================
  CLEANUP
====================================================== */

function cleanupExpiredReminders() {
  const now = Date.now();
  for (const key of scheduledReminders) {
    if (Number(key.split('-')[1]) < now) {
      scheduledReminders.delete(key);
    }
  }
}

/* ======================================================
  TIME UTILS
====================================================== */

function buildAiringUTC(broadcast) {
  const now = new Date();
  const diff =
    (DAY_INDEX[broadcast.day] - now.getUTCDay() + 7) % 7;

  const [hour, minute] = broadcast.time.split(':').map(Number);

  return Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + diff,
    hour - 9,
    minute
  );
}

function fmtWIB(ts) {
  return new Date(ts).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: WIB,
  });
}

function formatSource(source) {
  if (!source || typeof source !== 'string') return 'Unknown';

  const map = {
    original: 'Original',
    manga: 'Manga',
    novel: 'Novel',
    light_novel: 'Light Novel',
    web_manga: 'Web Manga',
    web_novel: 'Web Novel',
    visual_novel: 'Visual Novel',
    game: 'Game',
    other: 'Other',
  };

  const key = source.toLowerCase().replace(/\s+/g, '_');
  return map[key] || source;
}
