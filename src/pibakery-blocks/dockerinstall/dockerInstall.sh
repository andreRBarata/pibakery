#!/bin/bash
DEBIAN_FRONTEND=noninteractive curl -fsSL https://get.docker.com | sudo sh

sudo sh -eux <<EOF
# Install newuidmap & newgidmap binaries
apt-get install -y uidmap
EOF

$setuptool=$(which dockerd-rootless-setuptool.sh)


exec sudo -u $(users) -- "$setuptool install"