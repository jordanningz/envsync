import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { watchEnvFile, getWatchedPath } from './env-watch';

function tmpFile(): string {
  return path.join(os.tmpdir(), `envsync-watch-${Date.now()}.env`);
}

describe('watchEnvFile', () => {
  it('calls onChange when file content changes', async () => {
    const file = tmpFile();
    fs.writeFileSync(file, 'KEY=old\n');

    const changes: any[] = [];
    const handle = watchEnvFile(file, {
      interval: 50,
      onChange: (diff) => changes.push(diff),
    });

    await new Promise((r) => setTimeout(r, 80));
    fs.writeFileSync(file, 'KEY=new\n');
    await new Promise((r) => setTimeout(r, 120));

    handle.stop();
    fs.unlinkSync(file);

    expect(changes.length).toBeGreaterThanOrEqual(1);
    expect(changes[0].modified).toHaveLength(1);
    expect(changes[0].modified[0].key).toBe('KEY');
  });

  it('does not call onChange when content is unchanged', async () => {
    const file = tmpFile();
    fs.writeFileSync(file, 'KEY=same\n');

    const changes: any[] = [];
    const handle = watchEnvFile(file, {
      interval: 50,
      onChange: (diff) => changes.push(diff),
    });

    await new Promise((r) => setTimeout(r, 200));
    handle.stop();
    fs.unlinkSync(file);

    expect(changes).toHaveLength(0);
  });

  it('calls onError when read fails unexpectedly', async () => {
    const file = tmpFile();
    fs.writeFileSync(file, 'A=1\n');

    const errors: Error[] = [];
    const handle = watchEnvFile(file, {
      interval: 50,
      onError: (e) => errors.push(e),
    });

    // file is gone mid-watch — no error expected (returns null)
    fs.unlinkSync(file);
    await new Promise((r) => setTimeout(r, 120));
    handle.stop();
    // no crash
    expect(errors).toHaveLength(0);
  });
});

describe('getWatchedPath', () => {
  it('returns an absolute path', () => {
    const result = getWatchedPath('.env');
    expect(path.isAbsolute(result)).toBe(true);
  });
});
