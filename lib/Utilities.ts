import * as os from 'os';

export class Utilities {

  resolveHome(filepath: string) {
    return filepath.replace("~", os.homedir);
  }

  removeTrailingSlash(str: string): string {
    if (str.endsWith('/'))
      return str.slice(0, -1)
    else
      return str;
  }

  sanitizeFileName(name: string): string {

    if (!name)
      return name;
    return name.replace(/[\/\<\>\:\*\t]/g, '');
  }

  sanitizeMultiline(text: string): string {

    if (!text)
      return text;
    return text.replace(/\r/g, '');
  }

  getCounterPrefix(itemCounter: number): string {
    return itemCounter.toString().padStart(2, '0') + '00 ';
  }
}
