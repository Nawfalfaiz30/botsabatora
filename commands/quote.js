module.exports = {
  name: "quote",
  description: "quote command",
  async execute(interaction) {
    await interaction.reply("quote works!");
  }
};

// commands/quote.js

const { SlashCommandBuilder } = require('discord.js');
const { modEmbed } = require('../helpers/embed');
const ANIME_QUOTES = require('../data/quotes'); // daftar quote di data/quotes.js

module.exports = {
  name: 'quote',

  description: 'Dapatkan kutipan anime random yang inspiratif atau lucu',

  slashBuilder: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Random anime quote dengan author dan judul anime'),

  /**
   * Handler untuk prefix (S-quote) dan slash (/quote)
   * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} ctx
   */
  async execute(ctx) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;

    // Ambil quote random
    if (!ANIME_QUOTES || ANIME_QUOTES.length === 0) {
      const errorEmbed = modEmbed({
        title: '❌ Data Quote Kosong',
        color: 0xFF0000,
        description: 'Maaf, daftar quote anime sedang kosong atau gagal dimuat.',
      });
      return isSlash 
        ? ctx.reply({ embeds: [errorEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [errorEmbed] });
    }

    const randomIndex = Math.floor(Math.random() * ANIME_QUOTES.length);
    const { quote, author, anime } = ANIME_QUOTES[randomIndex];

    // Buat embed quote yang aesthetic
    const quoteEmbed = modEmbed({
      title: '🗣️ Anime Quote of the Moment 🌸',
      color: 0xFF69B4,
      description: `"${quote}"\n\n` +
                   `— **${author}**  \n` +
                   `*${anime}*`,
      thumbnail: 'https://i.imgur.com/anime-quote-icon.png', // ganti dengan gambar ikon buku/quote anime atau hapus baris ini
      footer: { text: 'Semoga menginspirasi harimu! 💜 • Ketik S-quote lagi untuk quote lain' },
      timestamp: true
    });

    // Tambahkan field opsional untuk interaksi
    quoteEmbed.addFields({
      name: '❤️ Favorite Quote?',
      value: 'Ketik `S-quote` lagi untuk dapatkan kutipan lain!\nAtau share quote favoritmu',
      inline: false
    });

    // Kirim embed
    if (isSlash) {
      await ctx.reply({ embeds: [quoteEmbed] });
    } else {
      await ctx.channel.send({ embeds: [quoteEmbed] });
    }
  },

  // Metadata
  staffOnly: false,
  category: 'anime',
  cooldown: 10,         // biar tidak spam quote terlalu cepat
  usage_prefix: 'S-quote',
  usage_slash: '/quote',
};