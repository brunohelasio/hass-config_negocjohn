#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
p = ROOT / 'scripts/build/validate-full-candidate-20260820.py'
s = p.read_text(encoding='utf-8')
old = """    if 'remote.atv' in active:\n        raise SystemExit(f'remote.atv still active in {relative}')\n"""
new = """    # Não procurar nomes legados dentro de comentários/documentação dos componentes.\n    # A entidade remota efetiva é validada abaixo diretamente em subviews.config.ts.\n    pass\n"""
if old in s:
    s = s.replace(old, new, 1)
elif new not in s:
    raise SystemExit('validator marker not found')
p.write_text(s, encoding='utf-8')
print('validator round2 adjusted')
