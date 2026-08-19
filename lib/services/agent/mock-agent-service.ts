import {
  findUserById,
  getCentral,
  membersForTenant,
  newId,
  type CentralMembership,
  type CentralUser,
} from "@/lib/mock/central";
import type {
  AgentDto,
  AgentStatus,
  CreateAgentInput,
  IAgentService,
  InviteAgentInput,
  UpdateAgentInput,
} from "./types";

/**
 * In-memory disabled agents set (keyed by userId).
 * A real implementation would store status in the membership or user record.
 */
const disabledAgents = new Set<string>();

function toDto(user: CentralUser, membership: CentralMembership): AgentDto {
  const status: AgentStatus = disabledAgents.has(user.id)
    ? "disabled"
    : "active";
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: membership.role,
    status,
    createdAt: "2026-01-15T10:00:00.000Z",
  };
}

export class MockAgentService implements IAgentService {
  async listAgents(tenantId: string): Promise<AgentDto[]> {
    const memberships = membersForTenant(tenantId);
    const results: AgentDto[] = [];
    for (const m of memberships) {
      const user = findUserById(m.userId);
      if (user) results.push(toDto(user, m));
    }
    return results;
  }

  async getAgent(tenantId: string, agentId: string): Promise<AgentDto | null> {
    const memberships = membersForTenant(tenantId);
    const m = memberships.find((x) => x.userId === agentId);
    if (!m) return null;
    const user = findUserById(m.userId);
    if (!user) return null;
    return toDto(user, m);
  }

  async createAgent(
    tenantId: string,
    input: CreateAgentInput,
  ): Promise<AgentDto> {
    const central = getCentral();
    const email = input.email.trim().toLowerCase();

    if (central.users.some((u) => u.email === email)) {
      throw new Error("Un compte existe déjà avec cet e-mail");
    }

    const user: CentralUser = {
      id: newId("usr"),
      name: input.name,
      email,
      passwordHash: `mock$${input.password}`,
      lastTenantId: tenantId,
    };
    const membership: CentralMembership = {
      userId: user.id,
      tenantId,
      role: "member",
    };

    central.users.push(user);
    central.memberships.push(membership);

    return toDto(user, membership);
  }

  async inviteAgent(
    tenantId: string,
    input: InviteAgentInput,
  ): Promise<AgentDto> {
    return this.createAgent(tenantId, {
      name: input.name,
      email: input.email,
      password: "invited123",
    });
  }

  async updateAgent(
    tenantId: string,
    agentId: string,
    input: UpdateAgentInput,
  ): Promise<AgentDto | null> {
    const central = getCentral();
    const m = central.memberships.find(
      (x) => x.userId === agentId && x.tenantId === tenantId,
    );
    if (!m) return null;
    const user = central.users.find((u) => u.id === agentId);
    if (!user) return null;

    if (input.name) user.name = input.name;
    if (input.email) user.email = input.email.trim().toLowerCase();

    return toDto(user, m);
  }

  async disableAgent(tenantId: string, agentId: string): Promise<boolean> {
    const memberships = membersForTenant(tenantId);
    const m = memberships.find((x) => x.userId === agentId);
    if (!m) return false;
    disabledAgents.add(agentId);
    return true;
  }

  async enableAgent(tenantId: string, agentId: string): Promise<boolean> {
    const memberships = membersForTenant(tenantId);
    const m = memberships.find((x) => x.userId === agentId);
    if (!m) return false;
    disabledAgents.delete(agentId);
    return true;
  }
}
