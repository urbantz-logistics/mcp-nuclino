export interface Team {
  id: string;
  name: string;
  description?: string;
}

export interface Workspace {
  id: string;
  name: string;
  teamId: string;
  description?: string;
}

export interface Item {
  id: string;
  title: string;
  content: string;
  url: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}