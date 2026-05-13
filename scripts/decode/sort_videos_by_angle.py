#!/usr/bin/env python3
"""Optional helper to interactively move videos into angle folders.
This script is manual: it lists videos and prompts the user to press a key to assign angle.
"""
import shutil
from pathlib import Path


ANGLE_CHOICES = {
    'c': 'center-field',
    's': 'side-angle',
    'o': 'corner-angle',
    'e': 'elevated',
    'l': 'livestream',
    'p': 'phone-recording',
    'u': 'unknown'
}


def main():
    src = Path('decode-training/raw-videos/unsorted')
    videos = sorted([p for p in src.glob('*') if p.is_file()])
    for v in videos:
        print('\nVideo:', v.name)
        print('Open the file externally if needed. Choose angle:')
        for k, n in ANGLE_CHOICES.items():
            print(k, n)
        choice = input('choice> ').strip().lower()
        if choice in ANGLE_CHOICES:
            dest = v.parent.parent / ANGLE_CHOICES[choice]
            dest.mkdir(parents=True, exist_ok=True)
            shutil.move(str(v), str(dest / v.name))
        else:
            print('Skipped')


if __name__ == '__main__':
    main()
