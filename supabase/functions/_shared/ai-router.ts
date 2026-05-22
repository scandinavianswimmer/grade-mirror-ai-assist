import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AIModel {
  name: string;
  provider: 'lovable' | 'gemini' | 'openai' | 'anthropic';
  endpoint: string;
  priority: number;
  maxRetries: number;
  timeout: number;
  costPerToken?: number;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  functionName: string;
  requestType?: string;
}

export interface AIResponse {
  content: string;
  modelUsed: string;
  provider: string;
  responseTimeMs: number;
  wasFallback: boolean;
  fallbackChain?: string[];
}

const CIRCUIT_BREAKER_THRESHOLD = 5; // failures before circuit opens (M55: removed unused TIMEOUT)

export class AIRouter {
  private supabase: SupabaseClient;
  private models: AIModel[];

  constructor(supabaseUrl: string, supabaseKey: string, authHeader: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    this.models = this.initializeModels();
  }

  private initializeModels(): AIModel[] {
    return [
      {
        name: 'gpt-5-mini',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        priority: 1,
        maxRetries: 2,
        timeout: 30000,
        costPerToken: 0.0002,
      },
      {
        name: 'gemini-2.5-flash',
        provider: 'gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        priority: 2,
        maxRetries: 2,
        timeout: 30000,
        costPerToken: 0.0001,
      },
      {
        name: 'gemini-2.5-flash',
        provider: 'lovable',
        endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
        priority: 3,
        maxRetries: 2,
        timeout: 30000,
        costPerToken: 0,
      },
      {
        name: 'claude-sonnet-4',
        provider: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        priority: 4,
        maxRetries: 2,
        timeout: 30000,
        costPerToken: 0.0003,
      },
    ];
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const fallbackChain: string[] = [];
    let lastError: Error | null = null;

    // Get healthy models sorted by priority
    const healthyModels = await this.getHealthyModels();

    for (const model of healthyModels) {
      try {
        console.log(`Attempting to use model: ${model.name} (${model.provider})`);
        
        const response = await this.callModel(model, request);
        const responseTimeMs = Date.now() - startTime;

        // Log successful request
        await this.logRequest({
          modelName: model.name,
          provider: model.provider,
          functionName: request.functionName,
          userId: request.userId,
          requestType: request.requestType,
          status: fallbackChain.length > 0 ? 'fallback' : 'success',
          responseTimeMs,
          fallbackModel: fallbackChain.length > 0 ? fallbackChain[fallbackChain.length - 1] : null,
        });

        // Update health status
        await this.updateHealth(model.name, model.provider, true, responseTimeMs);

        return {
          content: response,
          modelUsed: model.name,
          provider: model.provider,
          responseTimeMs,
          wasFallback: fallbackChain.length > 0,
          fallbackChain: fallbackChain.length > 0 ? fallbackChain : undefined,
        };
      } catch (error) {
        console.error(`Model ${model.name} failed:`, error);
        lastError = error as Error;
        fallbackChain.push(model.name);

        // Update health status
        await this.updateHealth(model.name, model.provider, false);

        // Log failed attempt
        await this.logRequest({
          modelName: model.name,
          provider: model.provider,
          functionName: request.functionName,
          userId: request.userId,
          requestType: request.requestType,
          status: 'failed',
          responseTimeMs: Date.now() - startTime,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });

        // Continue to next model
        continue;
      }
    }

    // All models failed
    throw new Error(
      `All AI models failed. Tried: ${fallbackChain.join(', ')}. Last error: ${lastError?.message || 'Unknown'}`
    );
  }

  private async callModel(model: AIModel, request: AIRequest): Promise<string> {
    const apiKey = await this.getApiKey(model.provider);
    
    switch (model.provider) {
      case 'lovable':
        return this.callLovableAI(model, request, apiKey);
      case 'gemini':
        return this.callGemini(model, request, apiKey);
      case 'openai':
        return this.callOpenAI(model, request, apiKey);
      case 'anthropic':
        return this.callAnthropic(model, request, apiKey);
      default:
        throw new Error(`Unknown provider: ${model.provider}`);
    }
  }

  private async callLovableAI(model: AIModel, request: AIRequest, apiKey: string): Promise<string> {
    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `google/${model.name}`,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lovable AI error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private async callGemini(model: AIModel, request: AIRequest, apiKey: string): Promise<string> {
    const prompt = request.systemPrompt 
      ? `${request.systemPrompt}\n\n${request.prompt}`
      : request.prompt;

    const response = await fetch(`${model.endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: request.temperature || 0.7,
          maxOutputTokens: request.maxTokens || 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async callOpenAI(model: AIModel, request: AIRequest, apiKey: string): Promise<string> {
    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.name,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        max_completion_tokens: request.maxTokens || 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private async callAnthropic(model: AIModel, request: AIRequest, apiKey: string): Promise<string> {
    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.name,
        max_tokens: request.maxTokens || 1024,
        messages: [
          { role: 'user', content: request.prompt },
        ],
        ...(request.systemPrompt ? { system: request.systemPrompt } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  private async getApiKey(provider: string): Promise<string> {
    const keyMap: Record<string, string> = {
      lovable: 'LOVABLE_API_KEY',
      gemini: 'GEMINI_API_KEY',
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
    };

    const key = Deno.env.get(keyMap[provider]);
    if (!key) {
      throw new Error(`API key not configured for provider: ${provider}`);
    }
    return key;
  }

  private async getHealthyModels(): Promise<AIModel[]> {
    const { data: healthRecords } = await this.supabase
      .from('ai_model_health')
      .select('*')
      .in('status', ['healthy', 'degraded']);

    const healthyModelNames = new Set(
      healthRecords?.map((r: any) => `${r.model_name}:${r.provider}`) || []
    );

    return this.models
      .filter((m) => {
        const key = `${m.name}:${m.provider}`;
        // If no health record exists, assume healthy
        if (!healthRecords || healthRecords.length === 0) return true;
        // Otherwise check if model is in healthy list
        return healthyModelNames.has(key);
      })
      .sort((a, b) => a.priority - b.priority);
  }

  private async updateHealth(
    modelName: string,
    provider: string,
    success: boolean,
    responseTimeMs?: number
  ): Promise<void> {
    try {
      const { data: existing } = await this.supabase
        .from('ai_model_health')
        .select('*')
        .eq('model_name', modelName)
        .eq('provider', provider)
        .single();

      if (!existing) {
        // Create new health record
        await this.supabase.from('ai_model_health').insert({
          model_name: modelName,
          provider,
          status: success ? 'healthy' : 'degraded',
          last_success_at: success ? new Date().toISOString() : null,
          last_failure_at: success ? null : new Date().toISOString(),
          consecutive_failures: success ? 0 : 1,
          total_requests: 1,
          total_failures: success ? 0 : 1,
          average_response_time_ms: responseTimeMs || null,
        });
      } else {
        // Update existing health record
        const consecutiveFailures = success ? 0 : (existing.consecutive_failures || 0) + 1;
        const totalRequests = (existing.total_requests || 0) + 1;
        const totalFailures = (existing.total_failures || 0) + (success ? 0 : 1);
        
        let status = 'healthy';
        if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
          status = 'down';
        } else if (consecutiveFailures > 0) {
          status = 'degraded';
        }

        await this.supabase
          .from('ai_model_health')
          .update({
            status,
            last_success_at: success ? new Date().toISOString() : existing.last_success_at,
            last_failure_at: success ? existing.last_failure_at : new Date().toISOString(),
            consecutive_failures: consecutiveFailures,
            total_requests: totalRequests,
            total_failures: totalFailures,
            average_response_time_ms: responseTimeMs 
              ? Math.round(((existing.average_response_time_ms || 0) + responseTimeMs) / 2)
              : existing.average_response_time_ms,
          })
          .eq('model_name', modelName)
          .eq('provider', provider);
      }
    } catch (error) {
      console.error('Failed to update health status:', error);
    }
  }

  private async logRequest(logData: {
    modelName: string;
    provider: string;
    functionName: string;
    userId?: string;
    requestType?: string;
    status: string;
    responseTimeMs: number;
    errorMessage?: string;
    fallbackModel?: string | null;
  }): Promise<void> {
    try {
      await this.supabase.from('ai_request_logs').insert({
        model_name: logData.modelName,
        provider: logData.provider,
        function_name: logData.functionName,
        user_id: logData.userId || null,
        request_type: logData.requestType || null,
        status: logData.status,
        response_time_ms: logData.responseTimeMs,
        error_message: logData.errorMessage || null,
        fallback_model: logData.fallbackModel || null,
      });
    } catch (error) {
      console.error('Failed to log AI request:', error);
    }
  }
}
