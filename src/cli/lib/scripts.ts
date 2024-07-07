import { Blockly } from '../../pibakery-blocks/blockly';
import { getBlockPathMap } from './helpers';

export interface ScriptData {
  everyBoot: string;
  firstBoot: string;
  nextBoot: string;
  blocks: string[];
  blockPaths: string[];
  json: string 
  waitForNetwork: [boolean, boolean, boolean];
}

export const generateScript = async (
  generator: Blockly.CodeGenerator,
  workspace: Blockly.Workspace
): Promise<ScriptData> => {
  const code = generator.workspaceToCode(workspace).split('\n');
  const blockMap = await getBlockPathMap();
  const neededBlocks = [];
  const networkRequiredPosition = [-1, -1, -1];
  const wifiPosition = [-1, -1, -1];
  const waitForNetwork: [ boolean, boolean, boolean ] = [false, false, false];

  let firstBootCode = '';
  let everyBootCode = '';
  let nextBootCode = '';

  let firstBootCount = 0;
  let everyBootCount = 0;
  let nextBootCount = 0;

  let codeType = '';
  let expectHat = true;

  for (const currentLine of code) {
    if (currentLine.indexOf('\t') === 0 && expectHat === false) {
      if (currentLine !== '\tNETWORK=True') {
        // add the blockname to our list
        let blockName = currentLine
          .split('/boot/PiBakery/blocks/')[1]
          .split('/')[0];
        if (neededBlocks.indexOf(blockName) === -1) {
          neededBlocks.push(blockName);
        }

        // actually generate the code (with whiptail dialogs as well)
        if (codeType === 'everyBoot') {
          everyBootCount++;
          everyBootCode =
            everyBootCode +
            '\n' +
            currentLine.replace('\t', '') +
            ' >>/boot/PiBakery/everyboot.log 2>&1  || true';
          // everyBootCode = everyBootCode + "\necho $(expr $PERCENTAGE \\* " + everyBootCount + " )"
          everyBootCode =
            everyBootCode +
            '\necho XXX\necho $(expr $PERCENTAGE \\* ' +
            everyBootCount +
            ' )\necho "\\nProcessing Every Boot Script\\n\\nRunning Block: ' +
            currentLine.split('/boot/PiBakery/blocks/')[1].split('/')[0] +
            '"\necho XXX';
        } else if (codeType === 'firstBoot') {
          firstBootCount++;
          firstBootCode =
            firstBootCode +
            '\n' +
            currentLine.replace('\t', '') +
            ' >>/boot/PiBakery/firstboot.log 2>&1 || true';
          // firstBootCode = firstBootCode + "\necho $(expr $PERCENTAGE \\* " + firstBootCount + " )"
          firstBootCode =
            firstBootCode +
            '\necho XXX\necho $(expr $PERCENTAGE \\* ' +
            firstBootCount +
            ' )\necho "\\nProcessing First Boot Script\\n\\nRunning Block: ' +
            currentLine.split('/boot/PiBakery/blocks/')[1].split('/')[0] +
            '"\necho XXX';
        } else if (codeType === 'nextBoot') {
          nextBootCount++;
          nextBootCode =
            nextBootCode +
            '\n' +
            currentLine.replace('\t', '') +
            ' >>/boot/PiBakery/nextboot.log 2>&1 || true';
          // nextBootCode = nextBootCode + "\necho $(expr $PERCENTAGE \\* " + nextBootCount + " )"
          nextBootCode =
            nextBootCode +
            '\necho XXX\necho $(expr $PERCENTAGE \\* ' +
            nextBootCount +
            ' )\necho "\\nProcessing Next Boot Script\\n\\nRunning Block: ' +
            currentLine.split('/boot/PiBakery/blocks/')[1].split('/')[0] +
            '"\necho XXX';
        }

        // handle the waitForNetwork stuff
        if (blockName === 'wifisetup') {
          if (codeType === 'everyBoot') {
            wifiPosition[0] = everyBootCount;
          } else if (codeType === 'firstBoot') {
            wifiPosition[1] = firstBootCount;
          } else if (codeType === 'nextBoot') {
            wifiPosition[2] = nextBootCount;
          }
        }
      } else if (currentLine === '\tNETWORK=True') {
        if (codeType === 'everyBoot') {
          networkRequiredPosition[0] = everyBootCount;
        } else if (codeType === 'firstBoot') {
          networkRequiredPosition[1] = firstBootCount;
        } else if (codeType === 'nextBoot') {
          networkRequiredPosition[2] = nextBootCount;
        }
      }
    } else if (currentLine === '_pibakery-oneveryboot') {
      codeType = 'everyBoot';
      expectHat = false;
    } else if (currentLine === '_pibakery-onfirstboot') {
      codeType = 'firstBoot';
      expectHat = false;
    } else if (currentLine === '_pibakery-onnextboot') {
      codeType = 'nextBoot';
      expectHat = false;
    } else if (currentLine === '') {
      expectHat = true;
    }
  }

  if (firstBootCode !== '') {
    firstBootCode =
      '#!/bin/bash\n\nPERCENTAGE=' +
      Math.floor(100 / firstBootCount) +
      '\n\n{' +
      firstBootCode +
      '\necho 100\n} | whiptail --title "PiBakery" --gauge "\\nProcessing First Boot Script\\n\\n\\n" 11 40 0';
  } else {
    firstBootCode = '#!/bin/bash';
  }

  if (everyBootCode !== '') {
    everyBootCode =
      '#!/bin/bash\n\nPERCENTAGE=' +
      Math.floor(100 / everyBootCount) +
      '\n\n{' +
      everyBootCode +
      '\necho 100\n} | whiptail --title "PiBakery" --gauge "\\nProcessing Every Boot Script\\n\\n\\n" 11 40 0';
  } else {
    everyBootCode = '#!/bin/bash';
  }

  if (nextBootCode !== '') {
    nextBootCode =
      '#!/bin/bash\n\nPERCENTAGE=' +
      Math.floor(100 / nextBootCount) +
      '\n\n{' +
      nextBootCode +
      '\necho 100\n} | whiptail --title "PiBakery" --gauge "\\nProcessing Next Boot Script\\n\\n\\n" 11 40 0';
  } else {
    nextBootCode = '#!/bin/bash';
  }

  // if we do need a network connection, and (there is not wifi) or (there is wifi but it's after we need network)
  if (
    networkRequiredPosition[0] !== -1 &&
    (wifiPosition[0] === -1 ||
      (wifiPosition[0] !== -1 && networkRequiredPosition[0] < wifiPosition[0]))
  ) {
    waitForNetwork[0] = true;
  }

  if (
    networkRequiredPosition[1] !== -1 &&
    (wifiPosition[1] === -1 ||
      (wifiPosition[1] !== -1 && networkRequiredPosition[1] < wifiPosition[1]))
  ) {
    waitForNetwork[1] = true;
  }

  if (
    networkRequiredPosition[2] !== -1 &&
    (wifiPosition[2] === -1 ||
      (wifiPosition[2] !== -1 && networkRequiredPosition[2] < wifiPosition[2]))
  ) {
    waitForNetwork[2] = true;
  }

  // create the proper paths for the needed blocks
  const blockPaths = neededBlocks.map((neededBlock) => blockMap[neededBlock]);

  return {
    everyBoot: everyBootCode,
    firstBoot: firstBootCode,
    nextBoot: nextBootCode,
    blocks: neededBlocks,
    blockPaths,
    waitForNetwork,
    json: JSON.stringify(code)
  };
};
