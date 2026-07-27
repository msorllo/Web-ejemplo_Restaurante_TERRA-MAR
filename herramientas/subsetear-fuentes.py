"""Subsetea las fuentes de Terra & Mar a lo que la web usa de verdad.

Fraunces con sus cuatro ejes pesa 264 KB solo en latín. Aquí se recorta a:
  · los caracteres que aparecen en los textos del sitio (ES/EN/FR) más un
    juego de seguridad con todo el ASCII imprimible y los acentos de los tres
    idiomas, para que añadir texto nuevo no rompa nada;
  · los tramos de eje que el CSS pide de verdad (WONK se fija en 1, que es el
    valor que usa el diseño, y así desaparece un eje entero).

Uso:
    python herramientas/subsetear-fuentes.py

Vuelve a ejecutarlo si cambian los textos de la carta o de i18n.
"""
import io
import os
import pathlib
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FUENTES = RAIZ / 'assets' / 'fonts'

# Ficheros de los que se extraen los caracteres realmente usados
ORIGENES = [
    'js/datos/i18n.js', 'js/datos/carta.js', 'js/datos/negocio.js',
    'index.html', 'carta.html', 'panel.html',
    'css/base.css', 'css/componentes.css', 'css/secciones.css', 'css/panel.css',
]

# Red de seguridad: todo lo que un texto en español, inglés o francés puede pedir
SEGURIDAD = (
    ''.join(chr(c) for c in range(0x20, 0x7F)) +
    'ÁÀÂÄÃÅÆÇÉÈÊËÍÌÎÏÑÓÒÔÖÕØŒÚÙÛÜÝŸ'
    'áàâäãåæçéèêëíìîïñóòôöõøœúùûüýÿß'
    '¡¿«»‹›“”‘’–—…·•€£°ªº™©®±×÷≈≠→←↑↓№'
)

# Tramos de eje que pide el CSS.
#   · opsz se conserva como eje: el tamaño óptico es la gracia de Fraunces y
#     es lo que hace que el titular gigante y el nombre de un plato no parezcan
#     la misma letra estirada.
#   · wght se conserva en romana (300–600) y se fija en cursiva, que solo se
#     usa a un peso.
#   · SOFT y WONK se fijan en el valor del diseño: cada eje que desaparece se
#     lleva por delante decenas de KB de deltas.
# Medido: romana 118 -> 46 KB, cursiva 146 -> 28 KB.
EJES = {
    'normal': ['opsz=40:144', 'wght=300:600', 'SOFT=28', 'WONK=1'],
    'italic': ['opsz=40:144', 'wght=400',     'SOFT=30', 'WONK=1'],
}

OBJETIVOS = [
    ('fraunces-latin-normal.woff2',     'fraunces-latin.woff2',            'normal'),
    ('fraunces-latin-ext-normal.woff2', 'fraunces-latin-ext.woff2',        'normal'),
    ('fraunces-latin-italic.woff2',     'fraunces-latin-italica.woff2',     'italic'),
    ('fraunces-latin-ext-italic.woff2', 'fraunces-latin-ext-italica.woff2', 'italic'),
    ('plus-jakarta-sans-latin.woff2',     'plus-jakarta-sans-latin.woff2',     None),
    ('plus-jakarta-sans-latin-ext.woff2', 'plus-jakarta-sans-latin-ext.woff2', None),
]


def caracteres_usados():
    usados = set(SEGURIDAD)
    for rel in ORIGENES:
        ruta = RAIZ / rel
        if ruta.exists():
            usados |= set(io.open(ruta, encoding='utf-8').read())
    # Fuera controles: el subsetter los rechaza
    return ''.join(sorted(c for c in usados if ord(c) >= 0x20 and ord(c) != 0x7F))


def kb(p):
    return os.path.getsize(p) / 1024


def ejecutar(orden):
    r = subprocess.run(orden, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode:
        print('\n'.join(filter(None, [r.stdout, r.stderr]))[-1200:])
        raise SystemExit('Fallo en: ' + ' '.join(orden[2:4]))


def main():
    texto = caracteres_usados()
    print('Caracteres únicos a conservar: %d' % len(texto))
    total_antes = total_despues = 0

    for origen, destino, estilo in OBJETIVOS:
        entrada = FUENTES / origen
        if not entrada.exists():
            print('  (falta %s, se omite)' % origen)
            continue

        salida = FUENTES / destino
        temporal = FUENTES / ('_tmp_' + destino)
        intermedio = FUENTES / '_tmp_ejes.ttf'
        antes = kb(entrada)

        io.open(FUENTES / '_chars.txt', 'w', encoding='utf-8').write(texto)

        # Paso 1 — recortar los tramos de eje (esto lo hace el instancer,
        # no el subsetter). Fijar WONK elimina un eje completo.
        fuente_glifos = entrada
        if estilo:
            # Los ejes van justo detrás del fichero de entrada: si se ponen
            # después de -o, argparse los rechaza.
            ejecutar([sys.executable, '-m', 'fontTools.varLib.instancer',
                      str(entrada)] + EJES[estilo] + ['-o', str(intermedio)])
            fuente_glifos = intermedio

        # Paso 2 — quedarse solo con los glifos que la web usa
        ejecutar([
            sys.executable, '-m', 'fontTools.subset', str(fuente_glifos),
            '--text-file=' + str(FUENTES / '_chars.txt'),
            '--output-file=' + str(temporal),
            '--flavor=woff2',
            '--layout-features=kern,liga,calt,ccmp,locl,mark,mkmk',
            '--no-hinting', '--desubroutinize',
            '--drop-tables+=DSIG',
            '--name-IDs=1,2,3,4,6',
        ])

        intermedio.unlink(missing_ok=True)
        os.replace(temporal, salida)
        despues = kb(salida)
        total_antes += antes
        total_despues += despues
        print('  %-38s %6.1f KB -> %6.1f KB  (-%d%%)'
              % (destino, antes, despues, round(100 - despues / antes * 100)))

    (FUENTES / '_chars.txt').unlink(missing_ok=True)
    print('TOTAL: %.1f KB -> %.1f KB' % (total_antes, total_despues))


main()
