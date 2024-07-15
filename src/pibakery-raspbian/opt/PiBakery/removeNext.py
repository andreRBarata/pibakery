#!/usr/bin/python
# Removes the nextBoot json from blockly

import json

with open("/usr/lib/PiBakery/blocks.json", "wb") as f:
  lines = f.readlines()
  blocks = json.loads(lines)
  onnextbootkey = (key for key,value in blocks.blocks if value.type == 'onnextboot')

  del blocks.blocks[onnextbootkey]

  f.writelines(json.dumps(blocks))