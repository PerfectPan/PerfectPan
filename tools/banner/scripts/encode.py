"""Encode captured frames into the repository's GIF and reduced-motion PNG."""
import json
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / 'banner.config.json').read_text())
capture, output = config['capture'], config['output']
count, overlap, fps = capture['frameCount'], output['crossfadeFrames'], capture['fps']
if not 0 < overlap < count / 2 or 100 % fps:
    raise ValueError('Crossfade must be under half the capture; fps must divide 100 for GIF timing.')
paths = sorted((ROOT / '.frames').glob('*.png'))
if len(paths) != count:
    raise ValueError(f'Expected {count} frames, found {len(paths)}')
source = []
for path in paths:
    with Image.open(path) as image:
        if image.size != (capture['width'], capture['height']):
            raise ValueError(f'Unexpected frame dimensions: {path}')
        source.append(image.convert('L'))
frames = source[overlap:]
for i in range(overlap):
    alpha = (i + 1) / overlap
    alpha = alpha * alpha * (3 - 2 * alpha)
    frames[-overlap + i] = Image.blend(source[-overlap + i], source[i], alpha)
frames = [frame.resize((output['width'], output['height']), Image.Resampling.LANCZOS) for frame in frames]
# Reserve a fixed neutral palette; every encoded pixel differs by at most 1/255.
palette = [channel for level in range(256) for channel in (min(255, level * 2),) * 3]
indexed = []
for frame in frames:
    image = Image.frombytes('P', frame.size, frame.point(lambda value: value // 2).tobytes())
    image.putpalette(palette)
    indexed.append(image)
staging = ROOT / '.build' / 'export'
staging.mkdir(parents=True, exist_ok=True)
gif, png = staging / 'profile-stars.gif', staging / 'profile-stars.png'
frames[0].convert('RGB').save(png)
indexed[0].save(gif, save_all=True, append_images=indexed[1:], duration=1000 // fps,
                loop=0, optimize=True, disposal=1)
with Image.open(gif) as check:
    if check.n_frames != count - overlap or check.info.get('loop') != 0:
        raise ValueError('Incorrect output frame count or loop metadata')
    for index, expected in enumerate(frames):
        check.seek(index)
        if check.info.get('duration') != 1000 // fps:
            raise ValueError(f'Incorrect frame duration: {index}')
        if ImageChops.difference(check.convert('L'), expected).getextrema()[1] > 1:
            raise ValueError(f'Palette error exceeds one grayscale level: {index}')
assets = ROOT.parents[1] / 'assets'
assets.mkdir(exist_ok=True)
for artifact in (gif, png):
    artifact.replace(assets / artifact.name)
print(f'Wrote {assets / gif.name}: {len(frames)} frames, {len(frames) / fps:g}s, '
      f'{(assets / gif.name).stat().st_size:,} bytes')
