module.exports = {
  name: "say",
  description: "say command",
  async execute(interaction) {
    await interaction.reply("say works!");
  }
};

// commands/say.js

const { SlashCommandBuilder } = require('discord.js');
const { modEmbed } = require('../helpers/embed');

module.exports = {
  name: 'say',

  description: 'Minta bot mengatakan sesuatu (pesan akan dikirim dalam embed)',

  slashBuilder: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Bot akan mengatakan pesan yang kamu inginkan')
    .addStringOption(option =>
      option
        .setName('pesan')
        .setDescription('Pesan yang ingin disampaikan oleh bot')
        .setRequired(true)
    ),

  /**
   * Handler untuk prefix (S-say) dan slash (/say)
   * @param {import('discord.js').Message | import('discord.js').ChatInputCommandInteraction} ctx
   */
  async execute(ctx) {
    const isSlash = ctx.isChatInputCommand?.() ?? false;

    let pesan;

    if (isSlash) {
      pesan = ctx.options.getString('pesan')?.trim();
    } else {
      // Prefix: S-say Halo semuanya, selamat malam!
      const args = ctx.content.slice('s-say'.length).trim();
      if (!args) {
        const errorEmbed = modEmbed({
          title: '❌ Pesan Dibutuhkan',
          color: 0xFF0000,
          description: 'Contoh penggunaan:\n' +
                       '• `S-say Halo teman-teman, selamat malam!`\n' +
                       '• `/say pesan:Halo semuanya, jangan lupa event besok!`',
        });
        return isSlash 
          ? ctx.reply({ embeds: [errorEmbed], ephemeral: true }) 
          : ctx.channel.send({ embeds: [errorEmbed] });
      }
      pesan = args;
    }

    if (!pesan) {
      const errorEmbed = modEmbed({
        title: '❌ Pesan Kosong',
        color: 0xFF0000,
        description: 'Kamu harus menyertakan pesan yang ingin bot katakan.',
      });
      return isSlash 
        ? ctx.reply({ embeds: [errorEmbed], ephemeral: true }) 
        : ctx.channel.send({ embeds: [errorEmbed] });
    }

    // Buat embed yang terlihat seperti pesan dari bot tapi tetap ada konteks pengirim
    const sayEmbed = modEmbed({
      title: '💬 Pesan dari Bot',
      color: 0xFF69B4,
      description: pesan,
      footer: { 
        text: `Dikirim atas permintaan ${ctx.member?.displayName || ctx.user?.username || 'seseorang'} • Sabatora 🌸` 
      },
      timestamp: true
    });

    // Optional: tambahkan field jika ingin lebih jelas siapa yang minta
    sayEmbed.addFields({
      name: 'Dari',
      value: ctx.member?.toString() || ctx.user?.toString() || 'Anonim',
      inline: true
    });

    // Kirim pesan say
    if (isSlash) {
      await ctx.reply({ embeds: [sayEmbed] });
    } else {
      await ctx.channel.send({ embeds: [sayEmbed] });
    }

    // Optional: hapus pesan command asli agar channel tetap bersih (jika bukan slash)
    if (!isSlash) {
      try {
        await ctx.delete().catch(() => {});
      } catch {
        // abaikan jika gagal hapus (misal permission kurang)
      }
    }
  },

  // Metadata
  staffOnly: false,
  category: 'fun',
  cooldown: 10,         // biar tidak spam pesan bot terlalu cepat
  usage_prefix: 'S-say <pesan yang ingin dikatakan>',
  usage_slash: '/say pesan:<teks>',
};