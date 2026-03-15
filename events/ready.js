const { Events, ActivityType } = require('discord.js');
const animeAutoSchedule = require('../events/animeAutoSchedule');

module.exports = {
  name: Events.ClientReady,
  once: true,

  /**
   * @param {import('discord.js').Client} client
   */
  execute(client) {
    console.log(`╔════════════════════════════════════════════════════╗`);
    console.log(`║             BOT SABATORA TELAH ONLINE              ║`);
    console.log(`╠════════════════════════════════════════════════════╣`);
    console.log(`║ Logged in as: ${client.user.tag}           ║`);
    console.log(`║ Client ID   : ${client.user.id}            ║`);
    console.log(`║ Server count: ${client.guilds.cache.size} server     ║`);
    console.log(`║ Member count: ${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0).toLocaleString('id-ID')} member     ║`);
    console.log(`╚════════════════════════════════════════════════════╝`);

    console.log('Bot siap melayani komunitas Sabatora! 🌸🎌');

    /* =====================
       AKTIFKAN AUTO ANIME
    ===================== */
    animeAutoSchedule(client);

    /* =====================
       STATUS ROTATION
    ===================== */
    const activities = [
      { name: 'S-help untuk bantuan', type: ActivityType.Listening },
      { name: `di ${client.guilds.cache.size} server wibu`, type: ActivityType.Playing },
      { name: 'anime rekomendasi hari ini', type: ActivityType.Watching },
      { name: 'waifu roll ~ 💖', type: ActivityType.Playing },
      { name: 'S-waifu untuk waifu hari ini', type: ActivityType.Listening },
      { name: 'trivia anime seru!', type: ActivityType.Competing },
    ];

    let activityIndex = 0;
    setInterval(() => {
      const activity = activities[activityIndex];
      client.user.setActivity(activity.name, { type: activity.type });
      activityIndex = (activityIndex + 1) % activities.length;
    }, 30000);
  },
};
