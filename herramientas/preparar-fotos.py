"""Convierte las fotos de los platos al formato que espera la web.

Cómo se usa
-----------
1. Genera cada imagen con los prompts de FOTOS.md.
2. Guárdala con el NOMBRE DEL PLATO tal cual aparece en FOTOS.md
   (por ejemplo `croquetas-rabo-toro.png`) dentro de:

       assets/platos/_entrada/

3. Ejecuta:

       python herramientas/preparar-fotos.py

El script recorta a 4:3, ajusta a 900 px de ancho, guarda como .webp con el
nombre correcto en assets/platos/ y avisa de los ficheros cuyo nombre no
corresponde a ningún plato de la carta. La web las recoge sola: no hay que
tocar código.

Requiere Pillow:  pip install pillow
"""
import pathlib
import re
import subprocess
import sys

from PIL import Image, ImageOps

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DESTINO = RAIZ / 'assets' / 'platos'
ENTRADA = DESTINO / '_entrada'

ANCHO = 900
PROPORCION = 4 / 3
CALIDAD = 80
FORMATOS = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff', '.avif'}


def ids_de_la_carta():
    """Lee los identificadores directamente de js/datos/carta.js."""
    texto = (RAIZ / 'js' / 'datos' / 'carta.js').read_text(encoding='utf-8')
    bloque = texto.split('platos:', 1)[1].split('cocteles:', 1)[0]
    return [m.group(1) for m in re.finditer(r"id:\s*'([a-z0-9-]+)'", bloque)]


def main():
    conocidos = ids_de_la_carta()
    ENTRADA.mkdir(parents=True, exist_ok=True)

    candidatos = [p for p in ENTRADA.iterdir()
                  if p.is_file() and p.suffix.lower() in FORMATOS]

    if not candidatos:
        print('No hay imágenes en %s' % ENTRADA)
        print('Deja ahí los ficheros con el nombre del plato y vuelve a ejecutar.')
        print('\nFaltan por subir %d de %d fotos:' % (
            sum(1 for i in conocidos if not (DESTINO / (i + '.webp')).exists()), len(conocidos)))
        for i in conocidos:
            if not (DESTINO / (i + '.webp')).exists():
                print('   ·', i)
        return

    hechas = desconocidas = 0
    for origen in sorted(candidatos):
        nombre = origen.stem.lower().strip()
        if nombre not in conocidos:
            print('  ? %-34s no corresponde a ningún plato de la carta' % origen.name)
            desconocidas += 1
            continue

        im = Image.open(origen).convert('RGB')
        # Recorte centrado a 4:3 y ajuste a 900 px de ancho
        im = ImageOps.fit(im, (im.width, round(im.width / PROPORCION)),
                          Image.LANCZOS, centering=(0.5, 0.5))
        if im.width != ANCHO:
            im = im.resize((ANCHO, round(ANCHO / PROPORCION)), Image.LANCZOS)

        salida = DESTINO / (nombre + '.webp')
        im.save(salida, 'WEBP', quality=CALIDAD, method=6)
        print('  ✓ %-34s -> %s (%d KB)'
              % (origen.name, salida.name, salida.stat().st_size // 1024))
        hechas += 1

    pendientes = [i for i in conocidos if not (DESTINO / (i + '.webp')).exists()]
    print('\n%d convertida(s), %d sin reconocer.' % (hechas, desconocidas))
    print('Fotos listas: %d de %d.' % (len(conocidos) - len(pendientes), len(conocidos)))
    if pendientes:
        print('Aún faltan:')
        for i in pendientes:
            print('   ·', i)


main()
