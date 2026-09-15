# Чернила против коробки: где внутри закрашенной пилюли лежат буквы.
# Используется audit-ink.mjs; отдельно: python3 scripts/ink.py <png> <scale>
import struct, zlib, sys

def load(path):
    data = open(path, 'rb').read(); pos = 8; idat = b''; w = h = 0; ct = 6
    while pos < len(data):
        ln = struct.unpack('>I', data[pos:pos+4])[0]; typ = data[pos+4:pos+8]; body = data[pos+8:pos+8+ln]; pos += 12 + ln
        if typ == b'IHDR': w, h, bd, ct = struct.unpack('>IIBB', body[:10])
        if typ == b'IDAT': idat += body
    raw = zlib.decompress(idat); bpp = {6: 4, 2: 3}[ct]; stride = w * bpp; out = []; prev = bytearray(stride); i = 0
    for y in range(h):
        f = raw[i]; i += 1; line = bytearray(raw[i:i+stride]); i += stride
        for x in range(stride):
            a = line[x-bpp] if x >= bpp else 0; b = prev[x]; c = prev[x-bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c; pa = abs(p - a); pb = abs(p - b); pc = abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        out.append(bytes(line)); prev = line
    return w, h, bpp, out

def analyze(path, scale, light_ink=True):
    """Пилюля — всё, что не фон угла картинки. Чернила — светлые (текст на
    цветной пилюле) или тёмные пиксели в плоской части пилюли (без скруглений).
    Возвращает зазоры сверху/снизу до чернил в CSS-пикселях."""
    w, h, bpp, rows = load(path)
    px = lambda x, y: rows[y][x*bpp:x*bpp+3]
    cx = w // 2; bg = px(0, 0)
    isbg = lambda p: all(abs(p[i] - bg[i]) < 12 for i in range(3))
    top = next(y for y in range(h) if not isbg(px(cx, y))); bot = next(y for y in range(h-1, -1, -1) if not isbg(px(cx, y)))
    cy = (top + bot) // 2
    left = next(x for x in range(w) if not isbg(px(x, cy))); right = next(x for x in range(w-1, -1, -1) if not isbg(px(x, cy)))
    r = (bot - top + 1) // 2
    xs = range(left + r, right - r + 1)
    weight = (lambda p: max(0, min(p) - 160) / 95) if light_ink else (lambda p: max(0, 120 - max(p)) / 120)
    rowsum = {}
    for y in range(top + 1, bot):
        s = sum(weight(px(x, y)) for x in xs)
        if s > 0.3: rowsum[y] = s
    ys = sorted(rowsum)
    return dict(box=((right - left + 1) / scale, (bot - top + 1) / scale), top=(ys[0] - top) / scale, bottom=(bot - ys[-1]) / scale)

if __name__ == '__main__':
    r = analyze(sys.argv[1], float(sys.argv[2]), sys.argv[3:4] != ['dark'])
    print('%dx%d  чернила: сверху %.2f, снизу %.2f  (разница %+.2f px)' % (round(r['box'][0]), round(r['box'][1]), r['top'], r['bottom'], r['top'] - r['bottom']))
