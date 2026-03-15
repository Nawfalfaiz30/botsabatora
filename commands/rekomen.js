// commands/rekomen.js

const { SlashCommandBuilder } = require('discord.js');
const { modEmbed } = require('../helpers/embed');

module.exports = {
  name: 'rekomen',
  description: 'Rekomendasi anime, manga, atau light novel',

  slashBuilder: new SlashCommandBuilder()
    .setName('rekomen')
    .setDescription('Kirim rekomendasi ke komunitas')
    .addStringOption(o =>
      o.setName('tipe')
        .setDescription('Jenis rekomendasi')
        .setRequired(true)
        .addChoices(
          { name: 'Anime', value: 'Anime' },
          { name: 'Manga', value: 'Manga' },
          { name: 'Light Novel', value: 'Light Novel' }
        )
    )
    .addStringOption(o =>
      o.setName('judul')
        .setDescription('Judul karya')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('genre')
        .setDescription('Genre / tag (opsional)')
    )
    .addStringOption(o =>
      o.setName('catatan')
        .setDescription('Catatan singkat (opsional)')
    ),

  /**
   * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} ctx
   */
  async execute(ctx) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;

    let tipe;
    let judul;
    let genre = '—';
    let catatan = '—';

    // ===== SLASH =====
    if (isSlash) {
      tipe = ctx.options.getString('tipe');
      judul = ctx.options.getString('judul')?.trim();
      genre = ctx.options.getString('genre')?.trim() || genre;
      catatan = ctx.options.getString('catatan')?.trim() || catatan;
    }
    // ===== PREFIX =====
    else {
      // Format:
      // S-rekomen | Anime | Judul | Genre | Catatan
      const content = ctx.content.slice('s-rekomen'.length).trim();
      const parts = content.split('|').map(p => p.trim()).filter(Boolean);

      if (parts.length < 2) {
        const err = modEmbed({
          color: 0xE53935,
          title: 'Format Salah',
          description:
            '**Gunakan format:**\n' +
            '`S-rekomen | Anime/Manga/LN | Judul | Genre | Catatan`\n\n' +
            '**Contoh:**\n' +
            '`S-rekomen | Manga | Berserk | Dark Fantasy | Cerita dewasa & brutal`'
        });
        return ctx.channel.send({ embeds: [err] });
      }

      tipe = parts[0];
      judul = parts[1];
      genre = parts[2] || genre;
      catatan = parts[3] || catatan;
    }

    if (!judul || !tipe) {
      const err = modEmbed({
        color: 0xE53935,
        title: 'Data Tidak Lengkap',
        description: 'Tipe dan judul wajib diisi.'
      });

      return isSlash
        ? ctx.reply({ embeds: [err], ephemeral: true })
        : ctx.channel.send({ embeds: [err] });
    }

    // ===== EMBED DESAIN BARU =====
    const embed = modEmbed({
      color: 0x2F3136, // dark, modern
      title: judul,
      description: `**${tipe} Recommendation**`,
      fields: [
        {
          name: '📚 Type',
          value: tipe,
          inline: true
        },
        {
          name: '🏷 Genre',
          value: genre,
          inline: true
        },
        {
          name: '📝 Catatan',
          value: catatan,
          inline: false
        },
        {
          name: '👤 Rekomender',
          value: ctx.member.toString(),
          inline: false
        }
      ],
      footer: {
        text: 'Sabatora • Recommendation System'
      },
      timestamp: true
    });

    if (isSlash) {
      await ctx.reply({ embeds: [embed] });
    } else {
      await ctx.channel.send({ embeds: [embed] });
    }
  },

  category: 'anime',
  cooldown: 30,
  staffOnly: false,
  usage_prefix: 'S-rekomen | Anime/Manga/LN | Judul | Genre | Catatan',
  usage_slash: '/rekomen tipe:<Anime|Manga|LN> judul:<judul>'
};
