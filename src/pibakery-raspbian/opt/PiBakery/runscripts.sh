#!/bin/bash

# Setup the environment for whiptail
export TERM="linux"

# If there are blocks that need a network connection, run waitForNetwork.sh
if [ -f /usr/lib/PiBakery/waitForNetwork ]
then
  /opt/PiBakery/waitForNetwork.sh || /bin/true
fi

# Make sure the scripts are executable
chmod +x /usr/lib/PiBakery/firstBoot.sh || /bin/true
chmod +x /usr/lib/PiBakery/nextBoot.sh || /bin/true
chmod +x /usr/lib/PiBakery/everyBoot.sh || /bin/true

# Run the firstBoot script, and prevent it from running again
if [ -f /usr/lib/PiBakery/runFirstBoot ]
then
  rm -f /usr/lib/PiBakery/runFirstBoot || /bin/true
  # If we should wait for network, run the waitForNetwork.sh script
  if [ -f /usr/lib/PiBakery/waitForNetworkFirstBoot ]
  then
    /opt/PiBakery/waitForNetwork.sh || /bin/true
  fi
  /usr/bin/python /opt/PiBakery/removeFirst.py || /bin/true
  /usr/lib/PiBakery/firstBoot.sh || /bin/true
fi

# Run the nextBoot script, and prevent it from running again
if [ -f /usr/lib/PiBakery/runNextBoot ]
then
  rm -f /usr/lib/PiBakery/runNextBoot || /bin/true
  # If we should wait for network, run the waitForNetwork.sh script
  if [ -f /usr/lib/PiBakery/waitForNetworkNextBoot ]
  then
    /opt/PiBakery/waitForNetwork.sh || /bin/true
  fi
  /usr/bin/python /opt/PiBakery/removeNext.py || /bin/true
  /usr/lib/PiBakery/nextBoot.sh || /bin/true
fi

# Run the everyBoot script
if [ -f /usr/lib/PiBakery/waitForNetworkEveryBoot ]
then
  /opt/PiBakery/waitForNetwork.sh || /bin/true
fi
/usr/lib/PiBakery/everyBoot.sh || /bin/true

exit 0
