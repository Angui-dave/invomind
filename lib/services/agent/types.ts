import type { TenantRole } from "@/lib/mock/central";

export type AgentStatus = "active" | "disabled";

export type AgentDto = {
  id: string;
  name: string;
  email: string;
  role: TenantRole;
  status: AgentStatus;
  createdAt: string;
};

export type CreateAgentInput = {
  name: string;
  email: string;
  password: string;
};

export type UpdateAgentInput = {
  name?: string;
  email?: string;
};

export type InviteAgentInput = {
  email: string;
  name: string;
};

export interface IAgentService {
  listAgents(tenantId: string): Promise<AgentDto[]>;
  getAgent(tenantId: string, agentId: string): Promise<AgentDto | null>;
  createAgent(tenantId: string, input: CreateAgentInput): Promise<AgentDto>;
  inviteAgent(tenantId: string, input: InviteAgentInput): Promise<AgentDto>;
  updateAgent(tenantId: string, agentId: string, input: UpdateAgentInput): Promise<AgentDto | null>;
  disableAgent(tenantId: string, agentId: string): Promise<boolean>;
  enableAgent(tenantId: string, agentId: string): Promise<boolean>;
}
