#!/bin/bash
if [ $2 == "root" ]; then
  su - root -c "$1"
else
  su - $(users) -c "$1"
fi
