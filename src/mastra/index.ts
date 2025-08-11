import { Mastra } from '@mastra/core/mastra';
import { bodyAgent } from './agents/body-agent';

export const mastra = new Mastra({
  workflows: {},
  agents: { bodyAgent },
  // Remove storage for Cloudflare Workers compatibility
});
