const { execSync } = require('child_process');

function main() {
  const token = process.env.SNA_GH_TOKEN;

  if (!token) {
    console.warn('SNA_GH_TOKEN não encontrado. Pulando configuração do Git.');
    return;
  }

  try {
    console.log('Configurando Git com token do GitHub para github.com...');

    const gitUrl = `https://x-access-token:${token}@github.com/`;

    const cmds = [
      'git config --global --unset-all url.https://github.com/.insteadOf || true',
      'git config --global --unset-all url.git@github.com:.insteadOf || true',
      'git config --global --unset-all url.ssh://git@github.com/.insteadOf || true',
      'git config --global --unset-all url.git://github.com/.insteadOf || true',
      `git config --global url."${gitUrl}".insteadOf "https://github.com/"`,
      `git config --global url."${gitUrl}".insteadOf "ssh://git@github.com/"`,
      `git config --global url."${gitUrl}".insteadOf "git@github.com:"`,
      `git config --global url."${gitUrl}Sphere-Nexon/".insteadOf "ssh://git@github.com/Sphere-Nexon/"`,
      `git config --global url."${gitUrl}Sphere-Nexon/".insteadOf "git@github.com:Sphere-Nexon/"`,
      `git config --global url."${gitUrl}Sphere-Nexon/sna-456.git".insteadOf "ssh://git@github.com/Sphere-Nexon/sna-456.git"`,
      `git config --global url."${gitUrl}Sphere-Nexon/sna-456.git".insteadOf "git@github.com:Sphere-Nexon/sna-456.git"`,
      `git config --global url."${gitUrl}".insteadOf "git://github.com/"`,
    ];

    for (const cmd of cmds) {
      try {
        execSync(cmd, { stdio: 'ignore', shell: true });
      } catch {
        // ignora erros individuais de configuração
      }
    }

    console.log('Git configurado com sucesso para github.com.');
  } catch (error) {
    console.error(
      'Erro ao configurar Git para github.com:',
      error && error.message ? error.message : error
    );
  }
}

main();
