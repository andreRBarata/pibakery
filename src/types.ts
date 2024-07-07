export interface ArgConfig {
  type: string;
  default?: string | boolean;
  options?: unknown[];
  maxLength?: number;
}

export interface BlockConfig {
  name: string;
  text: string;
  supportedOperatingSystems?: string[];
  longDescription: string;
  shortDescription: string;
  args?: ArgConfig[];
  network: boolean;
  category: string;
  script?: string;
}
