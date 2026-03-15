module.exports = {
  name: "waifu",
  description: "waifu command",
  async execute(interaction) {
    await interaction.reply("waifu works!");
  }
};

// commands/waifu.js

const { SlashCommandBuilder } = require('discord.js');
const { modEmbed } = require('../helpers/embed');
const WAIFU_NAMES = require('../data/waifus'); // daftar waifu di data/waifus.js

module.exports = {
  name: 'waifu',

  description: 'Roll waifu random! Dapatkan waifu impianmu hari ini~ 💖',

  slashBuilder: new SlashCommandBuilder()
    .setName('waifu')
    .setDescription('Roll waifu anime random dengan keberuntungan hari ini'),

  /**
   * Handler untuk prefix (S-waifu) dan slash (/waifu)
   * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} ctx
   */
  async execute(ctx) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;

    // Cek apakah daftar waifu ada
    if (!WAIFU_NAMES || WAIFU_NAMES.length === 0) {
      const errorEmbed = modEmbed({
        title: '❌ Daftar Waifu Kosong',
        color: 0xFF0000,
        description: 'Maaf, daftar waifu sedang kosong atau gagal dimuat.\nHubungi staff untuk menambah koleksi!',
      });
      return isSlash 
        ? ctx.reply({ embeds: [errorEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [errorEmbed] });
    }

    // Roll waifu random
    const randomIndex = Math.floor(Math.random() * WAIFU_NAMES.length);
    const waifu = WAIFU_NAMES[randomIndex];

    // Buat embed waifu roll yang super cute
    const waifuEmbed = modEmbed({
      title: '💖 Waifu Roll Hari Ini! 🌸',
      color: 0xFF69B4, // pink pastel tema waifu
      description: `Selamat! Kamu berhasil mendapatkan...\n\n` +
                   `**${waifu}** sebagai waifu-mu hari ini! 🎉\n\n` +
                   `Apakah ini soulmate-mu? Atau cuma gacha sesaat? 😏`,
      thumbnail: 'https://i.imgur.com/waifu-roll-heart.gif', // ganti dengan GIF hati atau waifu aesthetic
      image: 'https://i.imgur.com/waifu-placeholder.jpg', // optional: bisa diganti dengan gambar waifu random jika punya mapping
      footer: { 
        text: `Roll oleh ${ctx.member?.displayName || ctx.user?.username} • Ketik S-waifu lagi untuk roll ulang! 💜` 
      },
      timestamp: true
    });

    // Tambahkan field fun
    waifuEmbed.addFields(
      {
        name: '❤️ Status Waifu',
        value: 'Claimed! (tapi ingat, waifu terbaik adalah yang setia di hati~)',
        inline: false
      },
      {
        name: '🔄 Mau coba lagi?',
        value: 'Ketik `S-waifu` atau `/waifu` untuk roll waifu baru!\nSiapa tahu dapat SSR waifu favoritmu.',
        inline: false
      }
    );

    // Kirim embed
    if (isSlash) {
      await ctx.reply({ embeds: [waifuEmbed] });
    } else {
      await ctx.channel.send({ embeds: [waifuEmbed] });
    }
  },

  // Metadata
  staffOnly: false,
  category: 'anime',
  cooldown: 10,         // biar tidak spam roll terlalu cepat
  usage_prefix: 'S-waifu',
  usage_slash: '/waifu',
};