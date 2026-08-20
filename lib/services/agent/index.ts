import type { IAgentService } from "./types";
import { MockAgentService } from "./mock-agent-service";

export type { IAgentService, AgentDto, CreateAgentInput, UpdateAgentInput, InviteAgentInput, AgentStatus, InvitationDto } from "./types";

let _instance: IAgentService | null = null;

export function getAgentService(): IAgentService {
  if (!_instance) {
    _instance = new MockAgentService();
  }
  return _instance;
}
