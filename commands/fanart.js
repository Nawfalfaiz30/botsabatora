module.exports = {
  name: "fanart",
  description: "fanart command",
  async execute(interaction) {
    await interaction.reply("fanart works!");
  }
};

// commands/fanart.js

const { SlashCommandBuilder } = require('discord.js');
const { modEmbed } = require('../helpers/embed');

module.exports = {
  name: 'fanart',

  description: 'Dapatkan ide fanart anime keren untuk karakter tertentu',

  slashBuilder: new SlashCommandBuilder()
    .setName('fanart')
    .setDescription('Generate ide fanart anime random atau berdasarkan karakter')
    .addStringOption(option =>
      option
        .setName('karakter')
        .setDescription('Nama karakter anime yang ingin dibuat ide fanart-nya (opsional)')
        .setRequired(false)
    ),

  /**
   * Handler untuk prefix (S-fanart) dan slash (/fanart)
   * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} ctx
   */
  async execute(ctx) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;

    // Ambil nama karakter (jika ada)
    let karakter = 'Karakter Anime Random';

    if (isSlash) {
      karakter = ctx.options.getString('karakter')?.trim() || 'Karakter Anime Random';
    } else {
      // Prefix: S-fanart Gojo Satoru
      karakter = ctx.content.slice('s-fanart'.length).trim() || 'Karakter Anime Random';
    }

    // Daftar ide fanart yang variatif (bisa ditambah sendiri)
    const fanartIdeas = [
      'Pose heroik sambil memegang senjata ikonik, latar belakang kota malam dengan neon lights Jepang, gaya cyberpunk.',
      'Scene romantis di bawah pohon sakura saat musim semi, efek kelopak bunga beterbangan, pencahayaan soft pastel.',
      'Versi chibi lucu sedang makan ramen besar, ekspresi super girang, background kafe Jepang aesthetic.',
      'Aura gelap dengan mata glowing, tangan memegang bola energi, latar belakang langit merah darah dan petir.',
      'Fashion modern streetwear, hoodie oversized + aksesoris karakter, pose santai di depan mural graffiti Tokyo.',
      'Versi fantasy epik: memakai armor mewah, sayap malaikat/hantu, pedang raksasa, latar kastil kuno berawan.',
      'Beach day summer vibe: baju renang cute, kacamata hitam, es krim meleleh, ombak dan sunset oranye.',
      'Lo-fi chill: duduk di kamar dengan lampu neon, headset, laptop, hujan di luar jendela, suasana malam cozy.',
      'Crossover lucu dengan karakter lain (misal Gojo pakai topi Luffy), gaya meme wholesome.',
      'Dark academia: seragam sekolah klasik, buku tua, lilin, perpustakaan misterius, nuansa gothic.'
    ];

    // Pilih ide secara random
    const randomIdea = fanartIdeas[Math.floor(Math.random() * fanartIdeas.length)];

    // Buat embed yang visually appealing
    const fanartEmbed = modEmbed({
      title: `🎨 Ide Fanart untuk ${karakter} 🌸`,
      color: 0xFF69B4,
      description: `**Konsep:** ${randomIdea}\n\n` +
                   `Coba gambar ini di:\n` +
                   '• **Midjourney** atau **Stable Diffusion** (prompt: "anime style, detailed, vibrant")\n' +
                   '• **Pinterest** untuk referensi pose & warna\n' +
                   '• **Clip Studio Paint** atau **Procreate** kalau manual drawing\n\n' +
                   'Tag @Sabatora kalau kamu jadi bikin fanart-nya ya! 💜',
      thumbnail: 'https://i.imgur.com/fanart-icon.gif', // ganti dengan GIF pensil/magic brush atau ilustrasi anime
      footer: { text: 'Ide random • Bisa request lagi dengan karakter lain!' },
      timestamp: true
    });

    // Tambahkan field inspirasi tambahan
    fanartEmbed.addFields(
      {
        name: '🔥 Tips Prompt Bagus',
        value: 'Tambahkan kata kunci seperti:\n- highly detailed, 4k, cinematic lighting\n- vibrant colors, dynamic pose\n- anime style, Studio Ghibli / ufotable inspired',
        inline: false
      },
      {
        name: '🖼️ Mau Lihat Contoh?',
        value: 'Cari di Pinterest / Twitter dengan keyword:\n"fanart [nama karakter] [konsep di atas]"',
        inline: false
      }
    );

    // Kirim embed
    if (isSlash) {
      await ctx.reply({ embeds: [fanartEmbed] });
    } else {
      await ctx.channel.send({ embeds: [fanartEmbed] });
    }
  },

  // Metadata
  staffOnly: false,
  category: 'anime',
  cooldown: 20,         // biar tidak spam request ide
  usage_prefix: 'S-fanart [nama karakter]',
  usage_slash: '/fanart [karakter]',
};