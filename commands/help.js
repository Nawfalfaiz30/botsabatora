// commands/help.js

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const { modEmbed } = require('../helpers/embed');
const { isStaff } = require('../helpers/staff');

/* ======== UTIL ======== */
function chunkValues(items, maxLength = 1024) {
  const chunks = [];
  let buffer = '';

  for (const item of items) {
    if ((buffer + '\n\n' + item).length > maxLength) {
      chunks.push(buffer);
      buffer = item;
    } else {
      buffer += (buffer ? '\n\n' : '') + item;
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}

module.exports = {
  name: 'help',
  description: 'Tampilkan daftar perintah bot Anime/Manga/LN',

  slashBuilder: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Buka menu bantuan bot Anime/Manga/LN'),

  async execute(ctx, client) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;
    const member = ctx.member;

    if (isSlash && !ctx.replied && !ctx.deferred) await ctx.deferReply();

    const commands = client.commands;

    /* ======== COMMAND LIST ======== */
    const generalCmd = [];
    const animeCmd = [];
    const adminModerationCmd = [];
    const adminOtherCmd = [];

    commands.forEach(cmd => {
      const desc = cmd.description || 'Tidak ada deskripsi';
      const line = `**/${cmd.name}** | \`s-${cmd.name}\`\n${desc}`;

      if (cmd.staffOnly) {
        if (cmd.category === 'moderation') adminModerationCmd.push(line);
        else adminOtherCmd.push(line);
      } else {
        if (['anime', 'manga', 'ln', 'waifu'].includes(cmd.category)) animeCmd.push(line);
        else generalCmd.push(line);
      }
    });

    /* ======== DASHBOARD ======== */
    const dashboardEmbed = modEmbed({
      title: `🌸 ${client.user.username} — Anime/Manga/LN Bot`,
      color: 0xF27CBB,
      description:
        'Selamat datang di **Anime/Manga/LN Bot Dashboard**!\n\n' +
        'Klik tombol di bawah untuk menjelajahi perintah:\n' +
        '• **GENERAL** — Perintah umum dan berkaitan Anime/Manga/LN\n' +
        '• **ADMIN** — Perintah khusus staff/admin server',
      thumbnail: client.user.displayAvatarURL({ dynamic: true, size: 512 }),
      footer: { text: '✨ Klik tombol untuk membuka menu' },
      timestamp: true,
    });

    /* ======== GENERAL PAGE ======== */
    const generalPage = modEmbed({
      title: `🌟 GENERAL COMMANDS`,
      color: 0xFFB347,
      description: 'Daftar perintah yang bisa digunakan semua member:',
      thumbnail: client.user.displayAvatarURL({ dynamic: true, size: 512 }),
      footer: { text: 'Anime/Manga/LN Bot — General' },
      timestamp: true,
    });

    // Tambahkan field: Umum
    if (generalCmd.length > 0) {
      chunkValues(generalCmd).forEach(chunk => {
        generalPage.addFields({
          name: '📌 Umum',
          value: chunk,
          inline: false,
        });
      });
    }

    // Tambahkan field: Anime/Manga/LN
    if (animeCmd.length > 0) {
      chunkValues(animeCmd).forEach(chunk => {
        generalPage.addFields({
          name: '🎴 Anime / Manga / LN',
          value: chunk,
          inline: false,
        });
      });
    }

    /* ======== ADMIN PAGE ======== */
    const adminPage = modEmbed({
      title: `🛡️ ADMIN COMMANDS`,
      color: 0x2C3E50,
      description: 'Perintah khusus staff/admin server:',
      thumbnail: client.user.displayAvatarURL({ dynamic: true, size: 512 }),
      footer: { text: 'Anime/Manga/LN Bot — Staff' },
      timestamp: true,
    });

    if (isStaff(member)) {
      // Moderation commands
      if (adminModerationCmd.length > 0) {
        chunkValues(adminModerationCmd).forEach(chunk => {
          adminPage.addFields({
            name: '🛠️ MODERATION COMMANDS',
            value: chunk,
            inline: false,
          });
        });
      }

      // Other admin commands
      if (adminOtherCmd.length > 0) {
        chunkValues(adminOtherCmd).forEach(chunk => {
          adminPage.addFields({
            name: '⚙️ OTHER ADMIN COMMANDS',
            value: chunk,
            inline: false,
          });
        });
      }
    } else {
      adminPage.addFields({
        name: '🔒 Restricted Access',
        value: 'Kamu tidak memiliki izin untuk melihat halaman admin.\nHubungi staff jika perlu.',
        inline: false,
      });
    }

    /* ======== BUTTONS ======== */
    const mainButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('menu_general')
        .setLabel('GENERAL')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('menu_admin')
        .setLabel('ADMIN')
        .setStyle(ButtonStyle.Danger)
    );

    const backButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('menu_home')
        .setLabel('◀ DASHBOARD')
        .setStyle(ButtonStyle.Secondary)
    );

    const message = isSlash
      ? await ctx.editReply({ embeds: [dashboardEmbed], components: [mainButtons] })
      : await ctx.channel.send({ embeds: [dashboardEmbed], components: [mainButtons] });

    /* ======== COLLECTOR ======== */
    const collector = message.createMessageComponentCollector({ time: 120000 });

    collector.on('collect', async i => {
      if (i.user.id !== ctx.author?.id && i.user.id !== ctx.user?.id)
        return i.reply({ content: '❌ Kamu tidak bisa menggunakan tombol ini.', ephemeral: true });

      switch (i.customId) {
        case 'menu_general':
          await i.update({ embeds: [generalPage], components: [backButton] });
          break;
        case 'menu_admin':
          await i.update({ embeds: [adminPage], components: [backButton] });
          break;
        case 'menu_home':
          await i.update({ embeds: [dashboardEmbed], components: [mainButtons] });
          break;
      }
    });

    collector.on('end', async () => {
      try { await message.edit({ components: [] }); } catch {}
    });
  },

  /* ======== META ======== */
  staffOnly: false,
  category: 'utility',
  usage_prefix: 's-help',
  usage_slash: '/help',
};
