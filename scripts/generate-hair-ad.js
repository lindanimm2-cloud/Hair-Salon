'use strict';

/**
 * Builds a vertical editorial promo video for Auburn Atelier (site in repo root).
 * Uses ffmpeg-static + Windows fonts copied into a temp dir (no ":" in filter paths).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ffmpegPath = require('ffmpeg-static');
if (!ffmpegPath) {
  throw new Error('ffmpeg-static did not resolve a binary.');
}

const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'video-output');
const TMP = path.join(os.tmpdir(), `aa-hair-ad-${process.pid}-${Date.now()}`);

const W = 1080;
const H = 1920;
const FPS = 30;

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function pickFonts() {
  const windir = process.env.WINDIR || 'C:\\Windows';
  const fontsDir = path.join(windir, 'Fonts');
  const serifBold = ['georgiab.ttf', 'timesbd.ttf', 'arialbd.ttf'].map((f) =>
    path.join(fontsDir, f),
  ).find(exists);
  const serifReg = ['georgia.ttf', 'times.ttf', 'arial.ttf'].map((f) =>
    path.join(fontsDir, f),
  ).find(exists);
  const sansBold = ['segoeuib.ttf', 'arialbd.ttf'].map((f) =>
    path.join(fontsDir, f),
  ).find(exists);
  const sansReg = ['segoeui.ttf', 'arial.ttf'].map((f) =>
    path.join(fontsDir, f),
  ).find(exists);
  return { serifBold, serifReg, sansBold, sansReg };
}

function copyIntoTmp(src, destName) {
  const dest = path.join(TMP, destName);
  fs.copyFileSync(src, dest);
  return destName;
}

function writeTextFile(name, text) {
  const fn = path.join(TMP, `${name}.txt`);
  fs.writeFileSync(fn, text.replace(/\r?\n/g, ' '), 'utf8');
  return `${name}.txt`;
}

function run(args, opts = {}) {
  const res = spawnSync(ffmpegPath, args, {
    cwd: TMP,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    ...opts,
  });
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout || String(res.error));
    throw new Error(`ffmpeg exited ${res.status}`);
  }
}

function buildScene(index, dur, filtersAfterFade) {
  const fadeOutStart = Math.max(dur - 0.45, 0.2);
  const vf = [
    `fade=in:st=0:d=0.4,fade=out:st=${fadeOutStart}:d=0.4`,
    ...filtersAfterFade,
  ].join(',');
  const outName = `scene-${String(index).padStart(2, '0')}.mp4`;
  run([
    '-y',
    '-f',
    'lavfi',
    '-i',
    `color=c=0xfaf7f5:s=${W}x${H}:d=${dur}:r=${FPS}`,
    '-vf',
    vf,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(FPS),
    '-movflags',
    '+faststart',
    outName,
  ]);
  return path.join(TMP, outName);
}

function concatScenes(paths, outFile) {
  const listPath = path.join(TMP, 'concat.txt');
  const body = paths
    .map((p) => `file '${p.replace(/\\/g, '/')}'`)
    .join('\n');
  fs.writeFileSync(listPath, body, 'utf8');
  run([
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listPath,
    '-c',
    'copy',
    outFile,
  ]);
}

function main() {
  fs.mkdirSync(TMP, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const fonts = pickFonts();
  if (!fonts.serifBold || !fonts.sansReg) {
    throw new Error('Could not find common Windows fonts (Georgia or Arial).');
  }
  copyIntoTmp(fonts.serifBold, 'SerifB.ttf');
  if (fonts.serifReg) copyIntoTmp(fonts.serifReg, 'SerifR.ttf');
  copyIntoTmp(fonts.sansBold || fonts.serifBold, 'SansB.ttf');
  copyIntoTmp(fonts.sansReg, 'SansR.ttf');

  const serifB = 'SerifB.ttf';
  const serifR = exists(path.join(TMP, 'SerifR.ttf')) ? 'SerifR.ttf' : serifB;
  const sansB = 'SansB.ttf';
  const sansR = 'SansR.ttf';

  const t1 = writeTextFile('t1', 'AUBURN ATELIER');
  const t2 = writeTextFile('t2', 'Hair & Styling');
  const t3 = writeTextFile('t3', 'INDEPENDENT HAIR — EDITORIAL & EVERYDAY');
  const t4 = writeTextFile('t4', 'Hair that reads intentional');
  const t5 = writeTextFile('t5', 'on camera — and in real life.');
  const t6 = writeTextFile('t6', 'COLOR');
  const t7 = writeTextFile('t7', 'CUT');
  const t8 = writeTextFile('t8', 'SESSION STYLING');
  const t9 = writeTextFile('t9', 'NEW GUEST · COLOR & SHAPE DAY');
  const t10 = writeTextFile('t10', 'Consult, placement map, gloss refresh');
  const t11 = writeTextFile('t11', '15% OFF FIRST SESSION STYLING ADD-ON');
  const t12 = writeTextFile('t12', 'REQUEST A DATE');
  const t13 = writeTextFile('t13', 'AUBURN ATELIER');
  const t14 = writeTextFile('t14', '120 Pearl Lane · Studio 4');

  const ink = '0x1a1410';
  const muted = '0x6b615a';
  const tan = '0xc9a575';

  const scenes = [];

  scenes.push(
    buildScene(0, 3.8, [
      `drawbox=x=(iw-720)/2:y=ih*0.465:w=720:h=3:color=${tan}:t=fill`,
      `drawtext=fontfile=${serifB}:textfile=${t1}:fontsize=86:fontcolor=${ink}:x=(w-text_w)/2:y=h*0.40`,
      `drawtext=fontfile=${sansR}:textfile=${t2}:fontsize=38:fontcolor=${muted}:x=(w-text_w)/2:y=h*0.52`,
    ]),
  );

  scenes.push(
    buildScene(1, 4.2, [
      `drawtext=fontfile=${sansB}:textfile=${t3}:fontsize=28:fontcolor=${muted}:x=(w-text_w)/2:y=h*0.36`,
      `drawtext=fontfile=${serifB}:textfile=${t4}:fontsize=58:fontcolor=${ink}:x=(w-text_w)/2:y=h*0.44:line_spacing=8`,
      `drawtext=fontfile=${serifR}:textfile=${t5}:fontsize=44:fontcolor=${ink}:x=(w-text_w)/2:y=h*0.58:line_spacing=8`,
    ]),
  );

  scenes.push(
    buildScene(2, 4.0, [
      `drawtext=fontfile=${sansB}:textfile=${t6}:fontsize=56:fontcolor=${ink}:x=(w-text_w)/2:y=h*0.40`,
      `drawtext=fontfile=${sansB}:textfile=${t7}:fontsize=56:fontcolor=${ink}:x=(w-text_w)/2:y=h*0.50`,
      `drawtext=fontfile=${sansB}:textfile=${t8}:fontsize=52:fontcolor=${ink}:x=(w-text_w)/2:y=h*0.60`,
    ]),
  );

  scenes.push(
    buildScene(3, 4.4, [
      `drawtext=fontfile=${serifB}:textfile=${t9}:fontsize=48:fontcolor=${ink}:x=(w-text_w)/2:y=h*0.38`,
      `drawtext=fontfile=${sansR}:textfile=${t10}:fontsize=36:fontcolor=${muted}:x=(w-text_w)/2:y=h*0.48:line_spacing=10`,
      `drawtext=fontfile=${sansB}:textfile=${t11}:fontsize=40:fontcolor=${tan}:x=(w-text_w)/2:y=h*0.60`,
      `drawtext=fontfile=${sansB}:textfile=${t12}:fontsize=44:fontcolor=${ink}:x=(w-text_w)/2:y=h*0.72`,
    ]),
  );

  scenes.push(
    buildScene(4, 3.5, [
      `drawtext=fontfile=${serifB}:textfile=${t13}:fontsize=80:fontcolor=${ink}:x=(w-text_w)/2:y=h*0.44`,
      `drawtext=fontfile=${sansR}:textfile=${t14}:fontsize=34:fontcolor=${muted}:x=(w-text_w)/2:y=h*0.56`,
    ]),
  );

  const outMp4 = path.join(OUTPUT_DIR, 'auburn-atelier-hair-ad.mp4');
  concatScenes(scenes, outMp4);

  try {
    fs.rmSync(TMP, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }

  console.log(`Wrote ${outMp4}`);
}

main();
