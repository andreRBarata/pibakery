#!/bin/bash

cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

grep -q "^PubkeyAuthentication yes" /etc/ssh/sshd_config
sed -i "/^#*PubkeyAuthentication/cPubkeyAuthentication yes" /etc/ssh/sshd_config
grep -q "^AuthorizedKeysFile" /etc/ssh/sshd_config

systemctl restart ssh