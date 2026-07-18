import pc from 'picocolors';
export const ui = {
  title(text: string) { console.log(`
${pc.bold(pc.cyan(text))}`); },
  success(text: string) { console.log(`${pc.green('✓')} ${text}`); },
  info(text: string) { console.log(`${pc.cyan('•')} ${text}`); },
  error(text: string) { console.error(`${pc.red('✗')} ${text}`); },
};
