#!/usr/bin/env python3

"""
Utility to flatten out menu textures. Manually black out the number
and use this script to make all the gray parts white
"""

import argparse
from PIL import Image

def main(file_name, output_name):
    image = Image.open(file_name)
    if image.mode == "RGBA":
        image = image.convert("RGB")

    for x in range(image.size[0]):
        for y in range(image.size[1]):
            pixel = image.getpixel((x,y))

            if all(elem < 30 for elem in pixel):
                image.putpixel((x,y), (0,0,0))
            else:
                image.putpixel((x,y), (255,255,255))

    image.save(output_name)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('file_name', help='Source texture with blacked out number')
    parser.add_argument('output_name', help='Destination file')
    args = parser.parse_args()

    main(args.file_name, args.output_name)
