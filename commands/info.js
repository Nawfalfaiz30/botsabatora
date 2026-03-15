module.exports = {
  name: "info",
  description: "info command",
  async execute(interaction) {
    await interaction.reply("info works!");
  }
};

// commands/info.js

const { SlashCommandBuilder } = require('discord.js');
const { modEmbed } = require('../helpers/embed');

module.exports = {
  name: 'info',

  description: 'Menampilkan informasi lengkap tentang server Sabatora',

  slashBuilder: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Informasi server Sabatora - Anime & Manga Community'),

  /**
   * Handler untuk prefix (S-info) dan slash (/info)
   * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} ctx
   */
  async execute(ctx) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;
    const guild = ctx.guild;

    if (!guild) {
      const errorEmbed = modEmbed({
        title: '❌ Tidak Dapat Mengambil Info',
        color: 0xFF0000,
        description: 'Perintah ini hanya bisa digunakan di dalam server.',
      });
      return isSlash 
        ? ctx.reply({ embeds: [errorEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [errorEmbed] });
    }

    // Hitung jumlah channel (text + voice, exclude category)
    const textChannels = guild.channels.cache.filter(ch => ch.isTextBased() && !ch.isVoiceBased()).size;
    const voiceChannels = guild.channels.cache.filter(ch => ch.isVoiceBased()).size;
    const totalChannels = textChannels + voiceChannels;

    // Owner server
    const owner = await guild.fetchOwner().catch(() => null);
    const ownerTag = owner ? owner.user.tag : 'Tidak diketahui';

    // Buat embed info server yang rapi dan aesthetic
    const infoEmbed = modEmbed({
      title: `🌸 ${guild.name} - Anime & Manga Community 🎌`,
      color: 0xFF69B4,
      description: 'Selamat datang di **Sabatora**!\n' +
                   'Tempat berkumpulnya para pecinta anime, manga, light novel, dan segala hal wibu.\n' +
                   'Share rekomendasi, diskusi seru, nonton bareng, dan nikmati komunitas bersama! 💜',
      thumbnail: guild.iconURL({ dynamic: true, size: 512 }) || 'https://i.imgur.com/sabatora-default-icon.png',
      footer: { text: `Server ID: ${guild.id} • Dibuat dengan cinta oleh Staff Sabatora` },
      timestamp: true
    });

    // Tambahkan field informasi utama
    infoEmbed.addFields(
      {
        name: '👑 Owner Server',
        value: ownerTag,
        inline: true
      },
      {
        name: '👥 Total Member',
        value: `\`${guild.memberCount.toLocaleString('id-ID')}\``,
        inline: true
      },
      {
        name: '🚀 Total Boost',
        value: `\`${guild.premiumSubscriptionCount || 0}\``,
        inline: true
      },
      {
        name: '📅 Server Dibuat',
        value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`,
        inline: false
      },
      {
        name: '📊 Channel',
        value: `Text: **${textChannels}**\nVoice: **${voiceChannels}**\nTotal: **${totalChannels}**`,
        inline: true
      },
      {
        name: '🏷️ Role',
        value: `\`${guild.roles.cache.size - 1}\` (tidak termasuk @everyone)`,
        inline: true
      },
      {
        name: '🔗 Prefix Bot',
        value: '`S-` atau gunakan slash command `/`',
        inline: true
      }
    );

    // Tambahkan field tambahan jika server punya fitur premium
    if (guild.premiumSubscriptionCount > 0) {
      infoEmbed.addFields({
        name: '✨ Server Premium',
        value: `Server ini sudah di-boost sebanyak **${guild.premiumSubscriptionCount} kali**!\nTerima kasih kepada semua booster! 💖`,
        inline: false
      });
    }

    // Tambahkan link invite jika bot punya permission create invite
    if (guild.members.me.permissions.has('CreateInstantInvite')) {
      try {
        const invite = await guild.invites.create(guild.systemChannelId || guild.channels.cache.find(ch => ch.isTextBased())?.id, {
          maxAge: 0,
          maxUses: 0,
          unique: true
        }).catch(() => null);

        if (invite) {
          infoEmbed.addFields({
            name: '🔗 Invite Temanmu!',
            value: `[Klik untuk invite ke Sabatora](${invite.url})`,
            inline: false
          });
        }
      } catch {
        // Jika gagal create invite, skip saja
      }
    }

    // Kirim embed
    if (isSlash) {
      await ctx.reply({ embeds: [infoEmbed] });
    } else {
      await ctx.channel.send({ embeds: [infoEmbed] });
    }
  },

  // Metadata
  staffOnly: false,
  category: 'utility',
  cooldown: 30,         // biar tidak spam info server
  usage_prefix: 'S-info',
  usage_slash: '/info',
};