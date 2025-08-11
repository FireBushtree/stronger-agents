import { Mastra } from '@mastra/core/mastra';
import { bodyAgent } from './agents/body-agent';
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";

export const mastra = new Mastra({
  workflows: {},
  agents: { bodyAgent },
  deployer: new CloudflareDeployer({
    projectName: "strong-agents",
  }),
});
