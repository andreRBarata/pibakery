#!/usr/bin/python
# Removes the firstBoot json from blockly

import json

with open("/usr/lib/PiBakery/blocks.json", "wb") as f:
  lines = f.readlines()
  blocks = json.loads(lines)
  onfirstbootkey = (key for key,value in blocks.blocks if value.type == 'onfirstboot')

  del blocks.blocks[onfirstbootkey]

  f.writelines(json.dumps(blocks))