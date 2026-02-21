const { execSync } = require('child_process');

function main() {
  const token = process.env.SNA_GH_TOKEN;
  if (!token) {
    return;
  }

  const url = `https://x-access-token:${token}@github.com/`;
  const cmds = [
    `git config --global url."${url}".insteadOf "https://github.com/"`,
    `git config --global url."${url}".insteadOf "ssh://git@github.com/"`,
    `git config --global url."${url}".insteadOf "git@github.com:"`,
  ];

  try {
    for (const cmd of cmds) {
      execSync(cmd, { stdio: 'ignore' });
    }
  } catch {
    // não falha a instalação se o config der erro
  }
}

main();
