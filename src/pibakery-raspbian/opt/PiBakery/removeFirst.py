#!/usr/bin/python
# Removes the firstBoot xml from blockly

from xml.dom import minidom

xmldoc = minidom.parse("/usr/lib/PiBakery/blocks.xml")
root = xmldoc.documentElement

blocks = xmldoc.getElementsByTagName("block")
for block in blocks:
  if block.hasAttribute("type"):
    if block.getAttribute("type") == "onfirstboot":
      root.removeChild(block)

firstboot = xmldoc.getElementsByTagName("firstboot")[0]
firstboot.firstChild.replaceWholeText("0")

with open("/usr/lib/PiBakery/blocks.xml", "wb") as blockfile:
  root.writexml(blockfile)
