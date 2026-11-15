import json
from pathlib import Path

CALABANGA_BARANGAYS = tuple(json.loads(
    (Path(__file__).parent / 'data' / 'calabanga_barangays.json').read_text(encoding='utf-8')
))
