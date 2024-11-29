#!/bin/sh

apt-get install -y pmount

echo 'ACTION=="add", KERNEL=="sd[a-z][0-9]", TAG+="systemd", ENV{SYSTEMD_WANTS}="usbstick-handler@%k"' > /etc/udev/rules.d/usbstick.rules

echo "[Unit]
Description=Mount USB sticks
BindsTo=dev-%i.device
After=dev-%i.device
 
[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/bin/automount %I
ExecStop=/usr/bin/pumount /dev/%I" > /lib/systemd/system/usbstick-handler@.service

echo '#!/bin/bash
 
PART=$1
FS_LABEL=`lsblk -o name,label | grep ${PART} | awk '{print \$2}'`
 
if [ -z ${FS_LABEL} ]
then
    /usr/bin/pmount --umask 000 --noatime -w --sync /dev/${PART} /media/${PART}
else
    /usr/bin/pmount --umask 000 --noatime -w --sync /dev/${PART} /media/${FS_LABEL}_${PART}
fi' > /usr/local/bin/automount

chmod +x /usr/local/bin/automount