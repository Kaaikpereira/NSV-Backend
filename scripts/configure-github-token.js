const { execSync } = require('child_process');

function main() {
  const token = process.env.SNA_GH_TOKEN;
  if (!token) {
    return;
  }

  const url = `https://x-access-token:${token}@github.com/`;
  const cmd = `git config --global url."${url}".insteadOf "https://github.com/"`;

  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch {
    // não falha a instalação se o config der erro
  }
}

main();

