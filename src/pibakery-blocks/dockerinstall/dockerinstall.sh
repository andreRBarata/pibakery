#!/bin/bash
DEBIAN_FRONTEND=noninteractive curl -fsSL https://get.docker.com | sudo sh

sudo sh -eux <<EOF
# Install newuidmap & newgidmap binaries
apt-get install -y uidmap
EOF


exec sudo -u $(users) -- "dockerd-rootless-setuptool.sh install"