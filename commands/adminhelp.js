module.exports = {
  name: "adminhelp",
  description: "adminhelp command",
  async execute(interaction) {
    await interaction.reply("adminhelp works!");
  }
};

// commands/adminhelp.js

const { SlashCommandBuilder } = require('discord.js');
const { modEmbed } = require('../helpers/embed');
const { isStaff } = require('../helpers/staff');

module.exports = {
  name: 'adminhelp',

  description: 'Menampilkan daftar perintah khusus staff dan cara penggunaannya',

  slashBuilder: new SlashCommandBuilder()
    .setName('adminhelp')
    .setDescription('Panduan lengkap perintah untuk Sabatora Staff'),

  /**
   * Handler untuk prefix (S-adminhelp) dan slash (/adminhelp)
   * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} ctx
   */
  async execute(ctx) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;
    const member = isSlash ? ctx.member : ctx.member;

    // Hanya staff yang boleh melihat panduan ini
    if (!isStaff(member)) {
      const denyEmbed = modEmbed({
        title: '❌ AKSES DITOLAK',
        color: 0xFF0000,
        description: 'Perintah ini hanya tersedia untuk **Sabatora Staff** atau **Admin**.',
        keterangan: 'Jika kamu staff baru, hubungi owner/admin untuk setup role.'
      });

      if (isSlash) {
        return ctx.reply({ embeds: [denyEmbed], ephemeral: true });
      }
      return ctx.channel.send({ embeds: [denyEmbed] });
    }

    // Embed panduan staff yang rapi dan informatif
    const helpEmbed = modEmbed({
      title: '🛡️ SABATORA STAFF COMMAND GUIDE 🌸',
      color: 0xFF69B4,
      description: 'Berikut adalah daftar perintah khusus staff beserta contoh penggunaannya.\nGunakan dengan bijak dan sesuai aturan server ya! 🎌',
      thumbnail: ctx.guild.iconURL({ dynamic: true, size: 512 }) || 'https://i.imgur.com/sakura-staff-icon.png', // ganti jika punya icon khusus
      footer: { text: 'Semua perintah ini hanya bisa digunakan oleh staff • Sabatora Community' },
      timestamp: true
    });

    // Field-field perintah (dibagi kategori agar tidak terlalu panjang)
    helpEmbed.addFields(
      {
        name: '📜 Pengumuman & Aturan',
        value: '`/pengumuman` atau `S-pengumuman`\n→ Tampilkan pengumuman resmi\n\n' +
               '`/rules` atau `S-rules`\n→ Tampilkan aturan server',
        inline: false
      },
      {
        name: '🧹 Pembersihan & Polling',
        value: '`/purge jumlah:<angka>` atau `S-purge <jumlah>`\n→ Hapus pesan (max 100)\n\n' +
               '`/poll pertanyaan:<teks> opsi:<opsi1,opsi2,...>` atau `S-poll <pertanyaan> <opsi1,opsi2,...>`\n→ Buat polling interaktif',
        inline: false
      },
      {
        name: '👮 Moderasi Member',
        value: '`/kick user:@user [alasan]` atau `S-kick @user [alasan]`\n→ Keluarkan member\n\n' +
               '`/ban user:@user [alasan]` atau `S-ban @user [alasan]`\n→ Ban permanen\n\n' +
               '`/timeout user:@user menit:<angka> [alasan]` atau `S-timeout @user <menit> [alasan]`\n→ Timeout sementara\n\n' +
               '`/untimeout user:@user` atau `S-untimeout @user`\n→ Cabut timeout',
        inline: false
      },
      {
        name: '🎭 Role Management',
        value: '`/addrole user:@user role:@role [alasan]` atau `S-addrole @user @role [alasan]`\n→ Tambah role\n\n' +
               '`/removerole user:@user role:@role [alasan]` atau `S-removerole @user @role [alasan]`\n→ Hapus role',
        inline: false
      },
      {
        name: '🎉 Event & Lainnya',
        value: '`/event deskripsi:<teks> [waktu] [ping_role]` atau `S-event <deskripsi> [waktu]`\n→ Umumkan event (otomatis ping @everyone atau role tertentu)',
        inline: false
      }
    );

    // Tambahan catatan penting di field terpisah
    helpEmbed.addFields({
      name: 'ℹ️ Catatan Penting',
      value: '• Semua aksi moderasi akan dilog otomatis ke channel log (jika sudah diset)\n' +
             '• Gunakan alasan yang jelas setiap kali moderasi\n' +
             '• Jangan gunakan perintah ini untuk bercanda atau abuse power\n' +
             '• Jika ada bug atau saran, laporkan ke owner via DM',
      inline: false
    });

    // Kirim embed
    if (isSlash) {
      await ctx.reply({ embeds: [helpEmbed], ephemeral: true }); // ephemeral agar tidak mengganggu channel
    } else {
      await ctx.channel.send({ embeds: [helpEmbed] });
    }
  },

  staffOnly: true,
  category: 'staff',
  usage_prefix: 'S-adminhelp',
  usage_slash: '/adminhelp',
};