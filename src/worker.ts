import { m as mastra } from '../.mastra/output/mastra.mjs';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    try {
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          message: 'Cloudflare Worker with Mastra integration is running',
          agents: Object.keys(mastra.agents || {})
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      if (url.pathname === '/api/chat' && request.method === 'POST') {
        const { message, agentName = 'bodyAgent' } = await request.json() as {
          message: string;
          agentName?: string
        };

        if (!message) {
          return new Response(JSON.stringify({ error: 'Message is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }

        try {
          // Set OpenAI API key from environment
          if (env.OPENAI_API_KEY) {
            process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
          }

          // Get the agent from Mastra
          const agent = mastra.getAgent(agentName);
          if (!agent) {
            return new Response(JSON.stringify({
              error: `Agent '${agentName}' not found`,
              availableAgents: Object.keys(mastra.agents || {})
            }), {
              status: 404,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            });
          }

          // Generate response using the agent
          const response = await agent.generate([
            { role: 'user', content: message }
          ]);

          return new Response(JSON.stringify({
            response: response.text,
            agent: agentName,
            timestamp: new Date().toISOString()
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        } catch (agentError) {
          console.error('Agent error:', agentError);
          return new Response(JSON.stringify({
            error: 'Agent execution failed',
            message: agentError instanceof Error ? agentError.message : 'Unknown agent error',
            agent: agentName
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }

      if (url.pathname === '/api/agents' && request.method === 'GET') {
        const availableAgents = Object.keys(mastra.agents || {});
        return new Response(JSON.stringify({
          agents: availableAgents,
          count: availableAgents.length
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

interface Env {
  // 定义你的环境变量类型
  OPENAI_API_KEY?: string;
}