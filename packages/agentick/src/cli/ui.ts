import pc from "picocolors";

export const ui = {
  title(text: string) {
    console.log(`\n${pc.bold(pc.green(text))}`);
  },
  success(text: string) {
    console.log(`${pc.green("✓")} ${text}`);
  },
  info(text: string) {
    console.log(`${pc.cyan("•")} ${text}`);
  },
  error(text: string) {
    console.error(`${pc.red("✗")} ${text}`);
  },
};

export async function promptSecret(label: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    process.stdout.write(`${label}: `);
    let value = "";
    for await (const chunk of process.stdin) value += String(chunk);
    return value.trim();
  }

  return new Promise<string>((resolve, reject) => {
    let value = "";
    const stdin = process.stdin;
    process.stdout.write(`${label}: `);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const finish = (error?: Error) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value.trim());
    };

    const onData = (key: string) => {
      if (key === "\u0003") return finish(new Error("Login cancelled"));
      if (key === "\r" || key === "\n") return finish();
      if (key === "\u007f" || key === "\b") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }
      if (/^[\x20-\x7E]+$/.test(key)) {
        value += key;
        process.stdout.write("•".repeat(key.length));
      }
    };

    stdin.on("data", onData);
  });
}
