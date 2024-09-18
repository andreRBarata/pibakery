#!/bin/sh

wget --content-disposition https://www.noip.com/download/linux/latest -O /tmp/noip-duc.tar.gz
tar xf noip-duc.tar.gz -C /tmp/noip

installer=$(ls /tmp/noip/*/binaries/noip-duc_*_arm64.deb)

apt-get install $installer

cp /tmp/noip/*/debian/service /etc/systemd/system/noip-duc.service

tee /etc/default/noip-duc >/dev/null <<'EOF'
NOIP_USERNAME=${1}
NOIP_PASSWORD=${2}
NOIP_HOSTNAMES=${3}
EOF