// events/messageCreate.js

const { Events } = require('discord.js');
const { modEmbed, formatDuration } = require('../helpers/embed');
const { isStaff } = require('../helpers/staff');

module.exports = {
  name: Events.MessageCreate,

  /**
   * @param {import('discord.js').Message} message
   * @param {import('discord.js').Client} client
   */
  async execute(message, client) {
    // Abaikan bot
    if (message.author.bot) return;

    const lowerContent = message.content.toLowerCase();

    // ==================================================
    //                AFK - AUTO UNAFK
    // ==================================================
    if (client.afkStatus?.has(message.author.id)) {
      const afkData = client.afkStatus.get(message.author.id);

      const durationMs = Date.now() - afkData.timestamp;
      const durationText = formatDuration(durationMs);

      client.afkStatus.delete(message.author.id);

      const welcomeBackEmbed = modEmbed({
        title: '👋 Welcome Back!',
        color: 0x00ff7f,
        description:
          `**${message.member?.displayName || message.author.username}** telah kembali dari AFK.\n\n` +
          `⏱️ **Durasi AFK**\n` +
          `└ ${durationText}\n\n` +
          `📣 **Mention Selama AFK**\n` +
          `└ ${afkData.mentions.length} kali`,
        thumbnail: message.author.displayAvatarURL({ dynamic: true }),
        footer: { text: 'Status AFK otomatis dinonaktifkan' },
      });

      if (afkData.mentions.length > 0) {
        const mentionText = afkData.mentions.join('\n');

        welcomeBackEmbed.addFields({
          name: '📜 Riwayat Mention',
          value:
            mentionText.length > 1024
              ? mentionText.slice(0, 1000) + '\n…dan lainnya'
              : mentionText,
          inline: false,
        });
      }

      await message.channel.send({ embeds: [welcomeBackEmbed] }).catch(() => {});
    }

    // ==================================================
    //              AFK - MENTION HANDLING
    // ==================================================
    if (message.mentions.users.size > 0 && client.afkStatus) {
      for (const mentionedUser of message.mentions.users.values()) {
        if (!client.afkStatus.has(mentionedUser.id)) continue;

        const afkData = client.afkStatus.get(mentionedUser.id);

        afkData.mentions.push(
          `• <@${message.author.id}> di <#${message.channel.id}>`
        );

        const afkNoticeEmbed = modEmbed({
          title: '🌙 Pengguna Sedang AFK',
          color: 0x9b59b6,
          description:
            `**${mentionedUser.tag}** sedang AFK.\n\n` +
            `📝 Alasan: **${afkData.reason || 'Tidak ada alasan'}**\n` +
            `⏱️ Sejak: <t:${Math.floor(afkData.timestamp / 1000)}:R>`,
          thumbnail: mentionedUser.displayAvatarURL({ dynamic: true }),
        });

        await message.channel.send({ embeds: [afkNoticeEmbed] }).catch(() => {});
      }
    }

    // ==================================================
    //              PREFIX COMMAND HANDLING
    // ==================================================
    const PREFIX = 'S-';
    if (!lowerContent.startsWith(PREFIX.toLowerCase())) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = client.commands.get(commandName);

    if (!command) {
      const notFoundEmbed = modEmbed({
        title: '❌ Command Tidak Ditemukan',
        color: 0xff0000,
        description:
          `Perintah \`${PREFIX}${commandName}\` tidak ada.\n` +
          `Gunakan \`${PREFIX}help\` untuk melihat daftar command.`,
      });
      return message.channel.send({ embeds: [notFoundEmbed] });
    }

    const staffCommands = [
      'rules', 'pengumuman', 'event', 'purge', 'poll',
      'kick', 'ban', 'timeout', 'untimeout',
      'addrole', 'removerole', 'adminhelp'
    ];

    if (staffCommands.includes(commandName) && !isStaff(message.member)) {
      const denyEmbed = modEmbed({
        title: '❌ AKSES DITOLAK',
        color: 0xff0000,
        description:
          'Perintah ini hanya dapat digunakan oleh **Staff** atau **Admin**.',
      });
      return message.channel.send({ embeds: [denyEmbed] });
    }

    try {
      await command.execute(message, client);
    } catch (error) {
      console.error(`Error command ${commandName}:`, error);

      const errorEmbed = modEmbed({
        title: '❌ Terjadi Kesalahan',
        color: 0xff0000,
        description:
          'Terjadi kesalahan saat menjalankan perintah.\n' +
          'Silakan coba lagi atau hubungi staff.',
      });

      await message.channel.send({ embeds: [errorEmbed] }).catch(() => {});
    }
  },
};
