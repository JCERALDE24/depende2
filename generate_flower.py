"""
Simple Python utility to generate a decorative flower SVG file (flower.svg).
Run: python generate_flower.py
"""

SVG = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <radialGradient id="petalGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fff0f5" stop-opacity="1"/>
      <stop offset="60%" stop-color="#ff99cc" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#a14fff" stop-opacity="0.9"/>
    </radialGradient>
    <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff6d6"/>
      <stop offset="100%" stop-color="#f2c36b"/>
    </radialGradient>
  </defs>

  <rect width="100%" height="100%" fill="none" />

  <!-- petals -->
  <g transform="translate(300,300)">
    {% for i in range(8) %}
    <g transform="rotate({{i*45}})">
      <ellipse cx="0" cy="-120" rx="60" ry="140" fill="url(#petalGrad)" opacity="0.98"/>
    </g>
    {% endfor %}
    <!-- center -->
    <circle cx="0" cy="0" r="48" fill="url(#centerGrad)" stroke="#d3a24f" stroke-width="4"/>
  </g>
</svg>
'''

# simple template expansion without Jinja2
flower_svg = SVG.replace('{% for i in range(8) %}','').replace('{% endfor %}','')
# manually expand 8 petals
petals = ''
for i in range(8):
    petals += f'    <g transform="rotate({i*45})">\n      <ellipse cx="0" cy="-120" rx="60" ry="140" fill="url(#petalGrad)" opacity="0.98"/>\n    </g>\n'
flower_svg = flower_svg.replace('<g transform="translate(300,300)">\n    ','<g transform="translate(300,300)">\n')
flower_svg = flower_svg.replace('\n    <!-- petals -->\n  <g transform="translate(300,300)">\n    <g transform="rotate({{i*45}})">\n      <ellipse cx="0" cy="-120" rx="60" ry="140" fill="url(#petalGrad)" opacity="0.98"/>\n    </g>\n    \n    <!-- center -->', '\n    <!-- petals -->\n  <g transform="translate(300,300)">\n'+petals+'    <!-- center -->')

with open('flower.svg','w',encoding='utf-8') as f:
    f.write(flower_svg)

print('Written flower.svg')
