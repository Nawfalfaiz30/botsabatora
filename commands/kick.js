module.exports = {
  name: "kick",
  description: "kick command",
  async execute(interaction) {
    await interaction.reply("kick works!");
  }
};

// commands/kick.js

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { modEmbed } = require('../helpers/embed');
const { isStaff, logModeration } = require('../helpers/staff');

module.exports = {
  name: 'kick',

  description: 'Mengeluarkan (kick) seorang member dari server (Staff Only)',

  slashBuilder: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick member dari server (Staff Only)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Member yang akan di-kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('alasan')
        .setDescription('Alasan melakukan kick (opsional, tapi sangat disarankan)')
        .setRequired(false)
    ),

  /**
   * Handler untuk prefix (S-kick) dan slash (/kick)
   * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} ctx
   */
  async execute(ctx) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;

    // Ambil data target dan alasan
    let targetUser, reason = 'Tidak disebutkan';

    if (isSlash) {
      targetUser = ctx.options.getUser('user');
      reason = ctx.options.getString('alasan')?.trim() || 'Tidak disebutkan';
    } else {
      // Prefix: S-kick @user [alasan]
      const mentionedUsers = ctx.mentions.users;
      if (mentionedUsers.size === 0) {
        const errorEmbed = modEmbed({
          title: '❌ Format Salah',
          color: 0xFF0000,
          description: 'Gunakan: `S-kick @user [alasan]`',
        });
        return ctx.channel.send({ embeds: [errorEmbed] });
      }

      targetUser = mentionedUsers.first();
      // Ambil teks setelah mention sebagai alasan
      const mentionStr = `<@${targetUser.id}>`;
      reason = ctx.content.split(mentionStr).slice(1).join(' ').trim() || 'Tidak disebutkan';
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

    // Proteksi: tidak bisa kick bot atau staff (kecuali admin)
    if (targetMember.user.bot) {
      const botEmbed = modEmbed({
        title: '⚠️ Tidak Bisa Kick Bot',
        color: 0xFFA500,
        description: 'Bot tidak bisa di-kick menggunakan perintah ini.',
      });
      return isSlash 
        ? ctx.reply({ embeds: [botEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [botEmbed] });
    }

    if (isStaff(targetMember) && !ctx.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const staffProtectEmbed = modEmbed({
        title: '⚠️ Tidak Bisa Kick Staff',
        color: 0xFF4500,
        description: 'Hanya **Administrator** yang boleh kick member dengan role staff.',
      });
      return isSlash 
        ? ctx.reply({ embeds: [staffProtectEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [staffProtectEmbed] });
    }

    // Cek izin bot & user
    if (!ctx.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      const permEmbed = modEmbed({
        title: '❌ Bot Tidak Punya Izin',
        color: 0xFF0000,
        description: 'Bot tidak memiliki izin **Kick Members**.',
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
      // Lakukan kick
      await targetMember.kick(`Dikick oleh ${ctx.member.user.tag} | Alasan: ${reason}`);

      const successEmbed = modEmbed({
        title: '👢 Member Telah Di-Kick',
        color: 0xFFA500, // oranye untuk kick (lebih ringan daripada ban)
        target: targetUser.tag,
        moderator: ctx.member.user.tag,
        reason: reason,
        thumbnail: targetUser.displayAvatarURL({ dynamic: true, size: 512 }),
        footer: { text: 'Kick sementara • Bisa kembali dengan invite link' },
        timestamp: true
      });

      // Kirim konfirmasi ke channel
      const reply = isSlash
        ? await ctx.reply({ embeds: [successEmbed] })
        : await ctx.channel.send({ embeds: [successEmbed] });

      // Log ke channel moderation
      await logModeration(ctx.guild, successEmbed);

    } catch (error) {
      console.error('Gagal melakukan kick:', error);

      const failEmbed = modEmbed({
        title: '❌ Gagal Melakukan Kick',
        color: 0xFF0000,
        description: 'Terjadi kesalahan saat melakukan kick.\n' +
                     'Pastikan bot memiliki izin **Kick Members** dan role bot lebih tinggi dari target.',
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
  usage_prefix: 'S-kick @user [alasan]',
  usage_slash: '/kick user:@user [alasan]',
};