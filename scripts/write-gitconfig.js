const fs = require('fs');
const path = require('path');

function main() {
  const token = process.env.SNA_GH_TOKEN;
  if (!token) {
    console.warn('SNA_GH_TOKEN não encontrado. Pulando criação de .gitconfig local.');
    process.exit(0);
  }

  const gitUrl = `https://x-access-token:${token}@github.com/`;
  const lines = [
    '[url "' + gitUrl + '"]',
    '  insteadOf = https://github.com/',
    '  insteadOf = ssh://git@github.com/',
    '  insteadOf = git@github.com:',
    '  insteadOf = git://github.com/',
    '  insteadOf = ssh://git@github.com/Sphere-Nexon/',
    '  insteadOf = git@github.com:Sphere-Nexon/',
    '  insteadOf = ssh://git@github.com/Sphere-Nexon/sna-456.git',
    '  insteadOf = git@github.com:Sphere-Nexon/sna-456.git',
    '',
  ];

  const dest = path.join(process.cwd(), '.gitconfig');
  try {
    fs.writeFileSync(dest, lines.join('\n'), { encoding: 'utf8' });
    console.log(`Arquivo .gitconfig criado em: ${dest}`);
  } catch (e) {
    console.error('Falha ao escrever .gitconfig:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();

