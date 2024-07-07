import { BlockConfig } from '../types';
import { categories } from './categories.json';
import { blocks } from './blocks';

const importBlock = (blockJSON: BlockConfig) => {
  // get the block properties
  const blockName: string = blockJSON.name;
  const blockText: string = blockJSON.text;
  const blockArgs = blockJSON.args;
  const numArgs = blockArgs?.length || 0;
  const category = categories.find(
    (category) => category.name === blockJSON.category
  );
  const args = blockJSON.args
    ?.map((currentArg, i: number) => {
      const name = (i + 1).toString();
      if (currentArg.type === 'number' || currentArg.type === 'text') {
        return {
          type: 'field_input',
          name,
          text: currentArg.default
        };
      }

      if (currentArg.type === 'menu') {
        return {
          type: 'field_dropdown',
          name,
          options: currentArg.options?.map((currentOption: unknown) => [
            currentOption,
            currentOption
          ])
        };
      }

      if (currentArg.type === 'check') {
        return {
          type: 'field_checkbox',
          name,
          checked: currentArg.default
        };
      }

      return;
    })
    .filter((arg) => !!arg);

  return {
    id: blockName,
    kind: 'block',
    type: blockName,
    helpUrl: `javascript:alert("${blockJSON.longDescription}")`,
    tooltip: blockJSON.shortDescription,
    category: blockJSON.category,
    // if the block has multiple lines, implement that in the blockly standard
    message0: blockText
      .split('\\n')
      .map((line: string, index: number) => line + '%' + (index + numArgs + 1))
      .join(''),
    colour: category?.colour,
    args0: [
      ...(args || []),
      ...blockText.split('\\n').map(() => ({ type: 'input_dummy' }))
    ],
    validation: blockJSON.args?.map((currentArg, i: number) => ({
      block: blockName,
      field: i + 1,
      max: currentArg.maxLength,
      type: currentArg.type
    })),
    previousStatement: true,
    nextStatement: true
  };
};

export const transformedBlocks = Object.values(blocks).map((block) =>
  importBlock(block)
);

export const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      id: 'hat',
      kind: 'category',
      name: 'Startup',
      colour: '20',
      contents: [
        {
          kind: 'block',
          id: 'onfirstboot',
          type: 'onfirstboot'
        },
        {
          kind: 'block',
          type: 'onboot'
        }
      ]
    },
    ...categories.map((category) => ({
      kind: 'category',
      name: category.display,
      colour: category.colour,
      id: category.name,
      contents: transformedBlocks.filter(
        ({ id }) => category.name === blocks[id as keyof typeof blocks].category
      )
    }))
  ]
};
