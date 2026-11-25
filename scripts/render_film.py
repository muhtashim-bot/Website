"""
Render cinematic films from the photos in /photos-src (or public/photos) with smooth sub-pixel
zoom, pan, slide and zoom-through transitions. Pipes raw frames straight into ffmpeg.

  python3 scripts/render_film.py hero      -> public/video/hero-1280.mp4 (+ poster), seamless loop, no text
  python3 scripts/render_film.py services  -> film/ifarmer-services-film.mp4, 1920x1080 with service titles

Requires: pip install pillow numpy ; ffmpeg on PATH.
"""
import os, subprocess, sys
from concurrent.futures import ProcessPoolExecutor
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PHOTOS = os.environ.get('PHOTO_DIR', os.path.join(ROOT, 'public', 'photos'))
FONT_DIR = os.environ.get('FONT_DIR', os.path.join(ROOT, 'scripts', 'fonts'))
FPS = 25
TRANS = 1.0  # seconds of overlap between shots

LEAF, LIME, TEAL = (136, 187, 65), (221, 255, 128), (2, 43, 54)

def S(photo, frm, to, enter='zoom', dur=4.0, focus=(0.5, 0.5), title=None, sub=None, apps=None):
    return dict(photo=photo, frm=frm, to=to, enter=enter, dur=dur, focus=focus, title=title, sub=sub, apps=apps or [])

HERO = [
    S('farmer-phone', (1.0, 0, 0), (1.14, -3, 1), 'fade', 4.2, (0.5, 0.45)),
    S('advisory-field', (1.22, 2, 2), (1.04, 0, 0), 'zoom', 4.0, (0.45, 0.5)),
    S('seed-farmer', (1.04, 0, 0), (1.2, 3, -2), 'slide', 4.0, (0.7, 0.4)),
    S('maize-harvest', (1.18, -3, 0), (1.03, 2, 1), 'zoom', 4.0),
    S('collection-center', (1.03, 0, 0), (1.18, -3, 2), 'slide', 4.0),
    S('harvest-market', (1.24, 0, 3), (1.04, 0, 0), 'rise', 4.0),
    S('farmer-card', (1.04, 0, 0), (1.18, 3, -1), 'zoom', 4.0),
]

APP = {'Folon': 'app', 'Sofol': 'app', 'iHarvst': 'app', 'KriShop': 'app', 'Supplier Connect': 'app', 'Folon-AI': 'app'}
SERVICES = [
    S('farmer-meeting', (1.0, 0, 0), (1.14, -3, 1), 'fade', 4.4, title='Every harvest starts with a farmer', sub='iFarmer'),
    S('farmer-phone', (1.3, -5, 3), (1.1, -2, 1), 'zoom', 4.4, (0.5, 0.45), 'A loan the farmer can actually get', 'Access to Finance', ['Folon', 'Sofol', 'iHarvst', 'Partner banks & NBFIs']),
    S('farmer-card', (1.06, 0, 0), (1.2, 3, -2), 'slide', 3.8, title='A loan the farmer can actually get', sub='Access to Finance', apps=['Folon', 'Sofol', 'iHarvst', 'Partner banks & NBFIs']),
    S('krishop-counter', (1.12, 4, 0), (1.3, -3, 2), 'zoom', 4.2, (0.6, 0.4), 'The right input, close to the farm', 'Agri Input & Machinery', ['KriShop', 'Farmer Card', 'Experience Centers']),
    S('krishop-retailer', (1.2, -3, 0), (1.06, 2, 0), 'slide', 3.6, title='The right input, close to the farm', sub='Agri Input & Machinery', apps=['KriShop', 'Farmer Card', 'Experience Centers']),
    S('experience-center', (1.04, 0, 0), (1.22, 4, 3), 'rise', 3.6, title='The right input, close to the farm', sub='Agri Input & Machinery', apps=['KriShop', 'Farmer Card', 'Experience Centers']),
    S('advisory-field', (1.02, 0, 0), (1.32, 2, 4), 'zoom', 4.2, (0.45, 0.5), 'Advice that knows the field', 'Advisory, Insurance & Climate', ['Folon-AI', 'Folon', 'Insurance partners']),
    S('seed-farmer', (1.24, -4, -2), (1.08, 0, 0), 'slide', 3.8, (0.7, 0.4), 'Advice that knows the field', 'Advisory, Insurance & Climate', ['Folon-AI', 'Folon', 'Insurance partners']),
    S('maize-harvest', (1.0, 0, 0), (1.18, -4, 2), 'zoom', 3.8, title='Buyers see the harvest before it happens', sub='Market Linkage & Export', apps=['Supplier Connect', 'iFarmer Center', 'iFarmer Fresh']),
    S('collection-center', (1.16, 3, 0), (1.04, -2, 1), 'slide', 3.6, title='Buyers see the harvest before it happens', sub='Market Linkage & Export', apps=['Supplier Connect', 'iFarmer Center', 'iFarmer Fresh']),
    S('harvest-crates', (1.06, 0, 0), (1.24, 5, 4), 'rise', 3.6, title='Buyers see the harvest before it happens', sub='Market Linkage & Export', apps=['Supplier Connect', 'iFarmer Center', 'iFarmer Fresh']),
    S('ifarmer-center-front', (1.32, 0, 6), (1.06, 0, 0), 'zoom', 4.0, (0.5, 0.35), 'Every service, one door in the village', 'iFarmer Center', ['iFarmer Center', 'Sofol', 'KriShop']),
    S('center-farmers', (1.06, 0, 0), (1.2, -4, 2), 'slide', 3.6, title='Every service, one door in the village', sub='iFarmer Center', apps=['iFarmer Center', 'Sofol', 'KriShop']),
    S('farmer-card-woman', (1.16, 0, -2), (1.04, 0, 0), 'zoom', 4.0, (0.6, 0.3), 'Farmer paid. Funders repaid.', 'Paid at harvest', ['iHarvst', 'Farmer Card', 'Folon']),
    S('harvest-market', (1.28, 0, 3), (1.02, 0, 0), 'slide', 5.2, title='One platform for the whole season', sub='iFarmer'),
]

_cache = {}
def load(photo, W):
    key = (photo, W)
    if key not in _cache:
        p = os.path.join(PHOTOS, f'{photo}-1920.jpg')
        _cache[key] = Image.open(p).convert('RGB')
    return _cache[key]

def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))

def ease(t):
    return t * t * (3 - 2 * t)

def ease_io(t):
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2

def lerp(a, b, t):
    return a + (b - a) * t

def camera(shot, W, H, s, x, y):
    """Render one photo through a camera: s = zoom over 'cover', x/y = pan in % of the frame."""
    im = load(shot['photo'], W)
    iw, ih = im.size
    cover = max(W / iw, H / ih)
    k = cover * s
    slack_x = max(0.0, (iw * k - W) / 2)
    slack_y = max(0.0, (ih * k - H) / 2)
    fx, fy = shot['focus']
    # focus point maps to frame centre, limited so no edge shows
    cx = clamp(fx * iw * k - W / 2, 0, iw * k - W) - (iw * k - W) / 2
    cy = clamp(fy * ih * k - H / 2, 0, ih * k - H) - (ih * k - H) / 2
    ox = clamp(cx - x / 100 * W, -slack_x, slack_x)
    oy = clamp(cy - y / 100 * H, -slack_y, slack_y)
    # output pixel (u,v) -> source pixel
    a = 1 / k
    c = (iw * k / 2 + ox - W / 2) / k
    f = (ih * k / 2 + oy - H / 2) / k
    return im.transform((W, H), Image.AFFINE, (a, 0, c, 0, a, f), resample=Image.BICUBIC)

def timeline(shots):
    starts, t = [], 0.0
    for i, sh in enumerate(shots):
        starts.append(t)
        t += sh['dur'] - (TRANS if i < len(shots) - 1 else 0)
    return starts, t

def shot_state(shots, starts, i, t):
    """Camera move for shot i at time t, including arrival/leaving adjustments."""
    sh = shots[i]
    st = starts[i]
    m = ease(clamp((t - st) / sh['dur']))
    s = lerp(sh['frm'][0], sh['to'][0], m)
    x = lerp(sh['frm'][1], sh['to'][1], m)
    y = lerp(sh['frm'][2], sh['to'][2], m)
    e = 1.0 if i == 0 and not sh.get('loop_in') else ease_io(clamp((t - st) / TRANS))
    nxt = ease_io(clamp((t - starts[i + 1]) / TRANS)) if i + 1 < len(shots) else 0.0
    opacity, clip, shade, blur = 1.0, None, 0.0, 0.0
    if e < 1:
        if sh['enter'] == 'zoom':
            opacity = e; s *= lerp(1.14, 1, e)
        elif sh['enter'] == 'slide':
            clip = ('x', 1 - e); x += (1 - e) * 14
        elif sh['enter'] == 'rise':
            clip = ('y', 1 - e); y += (1 - e) * 14
        else:
            opacity = e
    if nxt > 0:
        ne = shots[i + 1]['enter']
        if ne == 'zoom':
            s *= 1 + 0.42 * nxt; blur = nxt * 6
        elif ne == 'slide':
            x -= nxt * 18; shade = nxt * 0.45
        elif ne == 'rise':
            y -= nxt * 16; shade = nxt * 0.45
    return s, x, y, opacity, clip, shade, blur, e, nxt

_overlays = {}
def overlays(W, H, text):
    key = (W, H, text)
    if key in _overlays:
        return _overlays[key]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    vig = np.clip((d - 0.75) / 0.75, 0, 1) * 0.42
    grad = np.clip((yy / H - (0.5 if text else 0.62)) / (0.5 if text else 0.38), 0, 1) ** 1.4 * (0.82 if text else 0.55)
    a = 1 - (1 - vig) * (1 - grad)
    layer = np.zeros((H, W, 4), np.uint8)
    layer[..., 0], layer[..., 1], layer[..., 2] = TEAL
    layer[..., 3] = (a * 255).astype(np.uint8)
    _overlays[key] = Image.fromarray(layer, 'RGBA')
    return _overlays[key]

_titles = {}
def title_layer(W, H, shot):
    key = (W, shot['title'], shot['sub'], tuple(shot['apps']))
    if key in _titles:
        return _titles[key]
    u = W / 1920
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    f_sub = ImageFont.truetype(os.path.join(FONT_DIR, 'quicksand-700.ttf'), int(30 * u))
    f_title = ImageFont.truetype(os.path.join(FONT_DIR, 'quicksand-700.ttf'), int(76 * u))
    f_chip = ImageFont.truetype(os.path.join(FONT_DIR, 'quicksand-700.ttf'), int(26 * u))
    x0 = int(110 * u)
    y = H - int((300 if shot['apps'] else 210) * u)
    if shot['sub']:
        d.text((x0, y), shot['sub'], font=f_sub, fill=LIME + (255,))
        y += int(46 * u)
    d.text((x0, y), shot['title'], font=f_title, fill=(255, 255, 255, 255))
    y += int(108 * u)
    cx = x0
    for app in shot['apps']:
        tw = d.textlength(app, font=f_chip)
        pad = int(20 * u)
        h = int(46 * u)
        is_app = APP.get(app) == 'app'
        d.rounded_rectangle((cx, y, cx + tw + 2 * pad, y + h), radius=h // 2, fill=(LEAF + (255,)) if is_app else (255, 255, 255, 46), outline=None if is_app else (255, 255, 255, 110), width=max(1, int(2 * u)))
        d.text((cx + pad, y + h / 2), app, font=f_chip, fill=(255, 255, 255, 255) if not is_app else TEAL + (255,), anchor='lm')
        cx += tw + 2 * pad + int(12 * u)
    _titles[key] = layer
    return layer

def titles_at(shots, starts, t):
    """Consecutive shots that share a title form one group; each group's title fades in and out once."""
    groups, i = [], 0
    while i < len(shots):
        j = i
        while j + 1 < len(shots) and shots[j + 1]['title'] == shots[i]['title']:
            j += 1
        if shots[i]['title']:
            gs = starts[i] + (0.35 if i == 0 else TRANS * 0.6)
            ge = starts[j] + shots[j]['dur'] - (0.0 if j == len(shots) - 1 else TRANS * 0.45)
            groups.append((shots[i], gs, ge))
        i = j + 1
    out = []
    for sh, gs, ge in groups:
        fin = ease(clamp((t - gs) / 0.55))
        fout = 1.0 if ge >= starts[-1] + shots[-1]['dur'] - 1e-6 else ease(clamp((ge - t) / 0.4))
        alpha = fin * fout
        if alpha > 0.003:
            out.append((sh, alpha, (1 - fin) * 22))
    return out

def render_frame(args):
    shots, starts, t, W, H, text = args
    frame = None
    for i in range(len(shots)):
        st = starts[i]
        end = st + shots[i]['dur']
        if t < st or t > end + 1e-6:
            continue
        s, x, y, opacity, clip, shade, blur, e, nxt = shot_state(shots, starts, i, t)
        if nxt >= 1:
            continue
        img = camera(shots[i], W, H, s, x, y)
        if blur > 0.3:
            img = img.filter(ImageFilter.GaussianBlur(blur * W / 1600))
        if shade > 0.01:
            img = Image.eval(img, lambda v, k=1 - shade: int(v * k))
        if frame is None:
            frame = img
            continue
        if clip:
            mask = Image.new('L', (W, H), 0)
            md = ImageDraw.Draw(mask)
            if clip[0] == 'x':
                md.rectangle((int(clip[1] * W), 0, W, H), fill=255)
            else:
                md.rectangle((0, int(clip[1] * H), W, H), fill=255)
            frame = Image.composite(img, frame, mask)
        elif opacity < 1:
            frame = Image.blend(frame, img, opacity)
        else:
            frame = img
    frame = frame.convert('RGBA')
    frame.alpha_composite(overlays(W, H, text))
    if text:
        for sh, alpha, off in titles_at(shots, starts, t):
            a = np.array(title_layer(W, H, sh))
            a[..., 3] = (a[..., 3] * alpha).astype(np.uint8)
            frame.alpha_composite(Image.fromarray(a, 'RGBA'), (0, int(off * W / 1920)))
    return frame.convert('RGB').tobytes()

def render(shots, W, H, out, text, loop=False, crf=24, preset='veryfast'):
    if loop:
        first = dict(shots[0]); first['enter'] = 'zoom'; first['loop_in'] = True
        shots = shots + [first]
    starts, total = timeline(shots)
    if loop:
        total = starts[-1] + TRANS  # stop the moment the first shot has fully returned
    n = int(round(total * FPS))
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-an', '-c:v', 'libx264', '-preset', preset, '-crf', str(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    jobs = [(shots, starts, k / FPS, W, H, text) for k in range(n)]
    with ProcessPoolExecutor(max_workers=os.cpu_count() or 2) as ex:
        for i, buf in enumerate(ex.map(render_frame, jobs, chunksize=4)):
            ff.stdin.write(buf)
            if i == 0 and out.endswith('.mp4') and loop:
                Image.frombytes('RGB', (W, H), buf).save(out.replace('.mp4', '-poster.jpg'), quality=82, optimize=True, progressive=True)
            if i % 100 == 0:
                print(f'{os.path.basename(out)}: frame {i}/{n}', flush=True)
    ff.stdin.close()
    ff.wait()
    print('wrote', out, f'{n / FPS:.1f}s')

if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'hero'
    if which == 'hero':
        os.makedirs(os.path.join(ROOT, 'public', 'video'), exist_ok=True)
        render(HERO, 1280, 720, os.path.join(ROOT, 'public', 'video', 'hero-1280.mp4'), text=False, loop=True, crf=27, preset='slow')
    elif which == 'services':
        out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'ifarmer-services-film.mp4')
        render(SERVICES, 1920, 1080, out, text=True, crf=21)
    elif which == 'still':
        # quick check: python3 render_film.py still services 12.5
        shots = SERVICES if sys.argv[2] == 'services' else HERO
        starts, _ = timeline(shots)
        W, H = (1920, 1080) if shots is SERVICES else (1280, 720)
        buf = render_frame((shots, starts, float(sys.argv[3]), W, H, shots is SERVICES))
        Image.frombytes('RGB', (W, H), buf).save(sys.argv[4])
