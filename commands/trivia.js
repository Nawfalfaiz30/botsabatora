module.exports = {
  name: "trivia",
  description: "trivia command",
  async execute(interaction) {
    await interaction.reply("trivia works!");
  }
};

// commands/trivia.js

const { SlashCommandBuilder } = require('discord.js');
const { modEmbed } = require('../helpers/embed');
const TRIVIA_QUESTIONS = require('../data/trivia'); // daftar trivia di data/trivia.js

module.exports = {
  name: 'trivia',

  description: 'Dapatkan trivia anime random beserta jawabannya',

  slashBuilder: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Trivia anime seru dengan jawaban')
    .addBooleanOption(option =>
      option
        .setName('show_answer')
        .setDescription('Langsung tampilkan jawaban? (default: disembunyikan)')
        .setRequired(false)
    ),

  /**
   * Handler untuk prefix (S-trivia) dan slash (/trivia)
   * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} ctx
   */
  async execute(ctx) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;

    // Ambil opsi show_answer (untuk slash)
    let showAnswer = false;

    if (isSlash) {
      showAnswer = ctx.options.getBoolean('show_answer') ?? false;
    } else {
      // Prefix: S-trivia true   atau   S-trivia
      const args = ctx.content.slice('s-trivia'.length).trim().toLowerCase();
      showAnswer = args === 'true' || args === 'ya' || args === 'jawab' || args === 'answer';
    }

    // Cek apakah ada data trivia
    if (!TRIVIA_QUESTIONS || TRIVIA_QUESTIONS.length === 0) {
      const errorEmbed = modEmbed({
        title: '❌ Data Trivia Kosong',
        color: 0xFF0000,
        description: 'Maaf, daftar trivia anime sedang kosong atau gagal dimuat.',
      });
      return isSlash 
        ? ctx.reply({ embeds: [errorEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [errorEmbed] });
    }

    // Ambil trivia random
    const randomIndex = Math.floor(Math.random() * TRIVIA_QUESTIONS.length);
    const { question, answer } = TRIVIA_QUESTIONS[randomIndex];

    // Buat embed trivia yang menarik
    const triviaEmbed = modEmbed({
      title: '❓ Trivia Anime Seru! 🎌',
      color: 0xFF69B4,
      description: `**Pertanyaan:**\n${question}\n\n` +
                   (showAnswer 
                     ? `**Jawaban:** ||${answer}||` 
                     : '||Balas dengan jawabanmu di bawah atau ketik `S-trivia true` untuk langsung lihat jawaban!||'),
      thumbnail: 'https://i.imgur.com/trivia-anime-icon.png', // ganti dengan ikon tanda tanya anime atau hapus
      footer: { 
        text: showAnswer 
          ? 'Jawaban sudah ditampilkan • Ketik S-trivia untuk yang baru!' 
          : 'Jawaban disembunyikan • Coba tebak dulu! 🌸' 
      },
      timestamp: true
    });

    // Tambahkan field interaksi
    triviaEmbed.addFields({
      name: 'Cara Main',
      value: showAnswer 
        ? 'Sudah tahu jawabannya? Share pendapatmu di bawah!' 
        : 'Tebak jawabannya di kolom chat!\n' +
          'Mau langsung lihat jawaban? Ketik `S-trivia true` atau `/trivia show_answer:true`',
      inline: false
    });

    // Kirim embed
    if (isSlash) {
      await ctx.reply({ embeds: [triviaEmbed] });
    } else {
      await ctx.channel.send({ embeds: [triviaEmbed] });
    }
  },

  // Metadata
  staffOnly: false,
  category: 'anime',
  cooldown: 15,         // biar tidak spam trivia terlalu cepat
  usage_prefix: 'S-trivia [true/ya/jawab]   (kosong = jawaban disembunyikan)',
  usage_slash: '/trivia [show_answer:true/false]',
};