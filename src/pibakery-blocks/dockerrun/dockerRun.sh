#!/bin/bash

image="$1"
containerName="$2"
flags="$3"

docker run -d --name $2 $3 $1

mkdir -p /usr/lib/PiBakery/docker/containers

echo """{ "image":"$1", "containerName": "$2", "flags": "$3" }""" > /usr/lib/PiBakery/docker/containers/$2.json
