module.exports = {
  name: "timeout",
  description: "timeout command",
  async execute(interaction) {
    await interaction.reply("timeout works!");
  }
};

// commands/timeout.js

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { modEmbed } = require('../helpers/embed');
const { isStaff, logModeration } = require('../helpers/staff');

module.exports = {
  name: 'timeout',

  description: 'Melakukan timeout (mute sementara) terhadap member (Staff Only)',

  slashBuilder: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout member dari server untuk durasi tertentu (Staff Only)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Member yang akan di-timeout')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('menit')
        .setDescription('Durasi timeout dalam menit (1 - 40320 menit = 28 hari)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption(option =>
      option
        .setName('alasan')
        .setDescription('Alasan melakukan timeout (opsional, tapi sangat disarankan)')
        .setRequired(false)
    ),

  /**
   * Handler untuk prefix (S-timeout) dan slash (/timeout)
   * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} ctx
   */
  async execute(ctx) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;

    // Ambil data target, durasi, dan alasan
    let targetUser, minutes, reason = 'Tidak disebutkan';

    if (isSlash) {
      targetUser = ctx.options.getUser('user');
      minutes = ctx.options.getInteger('menit');
      reason = ctx.options.getString('alasan')?.trim() || 'Tidak disebutkan';
    } else {
      // Prefix: S-timeout @user 60 Alasan: spam berulang
      const mentionedUsers = ctx.mentions.users;
      if (mentionedUsers.size === 0) {
        const errorEmbed = modEmbed({
          title: '❌ Format Salah',
          color: 0xFF0000,
          description: 'Gunakan: `S-timeout @user <menit> [alasan]`\nContoh: `S-timeout @user 30 Spam chat`',
        });
        return ctx.channel.send({ embeds: [errorEmbed] });
      }

      targetUser = mentionedUsers.first();
      const argsAfterMention = ctx.content.split(/<@!?\d+>/).slice(1).join(' ').trim().split(' ');
      minutes = parseInt(argsAfterMention[0]);
      reason = argsAfterMention.slice(1).join(' ').trim() || 'Tidak disebutkan';

      if (isNaN(minutes) || minutes < 1 || minutes > 40320) {
        const errorEmbed = modEmbed({
          title: '❌ Durasi Invalid',
          color: 0xFF0000,
          description: 'Durasi harus angka antara 1 sampai 40320 menit (maks 28 hari).',
        });
        return ctx.channel.send({ embeds: [errorEmbed] });
      }
    }

    // Cek apakah target ada di server
    let targetMember;
    try {
      targetMember = await ctx.guild.members.fetch(targetUser.id);
    } catch {
      const errorEmbed = modEmbed({
        title: '❌ Member Tidak Ditemukan',
        color: 0xFF0000,
        description: 'Member tersebut tidak ada di server atau sudah keluar.',
      });
      return isSlash 
        ? ctx.reply({ embeds: [errorEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [errorEmbed] });
    }

    // Proteksi: tidak bisa timeout bot atau staff (kecuali admin)
    if (targetMember.user.bot) {
      const botEmbed = modEmbed({
        title: '⚠️ Tidak Bisa Timeout Bot',
        color: 0xFFA500,
        description: 'Bot tidak bisa di-timeout menggunakan perintah ini.',
      });
      return isSlash 
        ? ctx.reply({ embeds: [botEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [botEmbed] });
    }

    if (isStaff(targetMember) && !ctx.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const staffProtectEmbed = modEmbed({
        title: '⚠️ Tidak Bisa Timeout Staff',
        color: 0xFF4500,
        description: 'Hanya **Administrator** yang boleh timeout member dengan role staff.',
      });
      return isSlash 
        ? ctx.reply({ embeds: [staffProtectEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [staffProtectEmbed] });
    }

    // Cek izin bot & user
    if (!ctx.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      const permEmbed = modEmbed({
        title: '❌ Bot Tidak Punya Izin',
        color: 0xFF0000,
        description: 'Bot tidak memiliki izin **Moderate Members** (Timeout).',
      });
      return isSlash 
        ? ctx.reply({ embeds: [permEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [permEmbed] });
    }

    if (!isStaff(ctx.member)) {
      const denyEmbed = modEmbed({
        title: '❌ AKSES DITOLAK',
        color: 0xFF0000,
        description: 'Hanya **Sabatora Staff** atau **Admin** yang dapat menggunakan perintah ini.',
      });
      return isSlash 
        ? ctx.reply({ embeds: [denyEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [denyEmbed] });
    }

    try {
      // Lakukan timeout
      await targetMember.timeout(minutes * 60 * 1000, `Timeout oleh ${ctx.member.user.tag} | Alasan: ${reason}`);

      const successEmbed = modEmbed({
        title: '⏳ Member Telah Di-Timeout',
        color: 0xFFD700, // kuning emas untuk timeout (warning)
        target: targetUser.tag,
        moderator: ctx.member.user.tag,
        duration: `${minutes} menit`,
        reason: reason,
        thumbnail: targetUser.displayAvatarURL({ dynamic: true, size: 512 }),
        footer: { text: 'Timeout sementara • Akan otomatis hilang setelah durasi selesai' },
        timestamp: true
      });

      // Kirim konfirmasi ke channel
      const reply = isSlash
        ? await ctx.reply({ embeds: [successEmbed] })
        : await ctx.channel.send({ embeds: [successEmbed] });

      // Log ke channel moderation
      await logModeration(ctx.guild, successEmbed);

    } catch (error) {
      console.error('Gagal melakukan timeout:', error);

      const failEmbed = modEmbed({
        title: '❌ Gagal Melakukan Timeout',
        color: 0xFF0000,
        description: 'Terjadi kesalahan saat melakukan timeout.\n' +
                     'Pastikan bot memiliki izin **Moderate Members** dan role bot lebih tinggi dari target.',
      });

      if (isSlash) {
        await ctx.reply({ embeds: [failEmbed], ephemeral: true });
      } else {
        await ctx.channel.send({ embeds: [failEmbed] });
      }
    }
  },

  staffOnly: true,
  category: 'moderation',
  usage_prefix: 'S-timeout @user <menit> [alasan]',
  usage_slash: '/timeout user:@user menit:<angka> [alasan]',
};