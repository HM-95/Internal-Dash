// Client-side lists operations - all calls go through API endpoints
// This ensures the service role key stays on the server

export type List = {
  id: string;
  name: string;
  created_at: string;
  creatorCount?: number;
};

export const BASE_TAGS: string[] = ['Tech', 'Crypto', 'Finance', 'Fashion', 'Lifestyle'];

export const listsClient = {
  async getLists(): Promise<List[]> {
    const response = await fetch('/api/lists?action=getLists', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get lists: ${response.statusText}`);
    }

    return response.json();
  },

  async createList(name: string): Promise<List> {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'createList', name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create list');
    }

    return response.json();
  },

  async addCreators(listId: string, creatorIds: string[]): Promise<void> {
    if (!creatorIds.length) return;

    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'addCreators', listId, creatorIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add creators');
    }
  },

  async removeCreator(listId: string, creatorId: string): Promise<void> {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'removeCreator', listId, creatorId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove creator');
    }
  },

  async getCreatorsForList(listId: string): Promise<any[]> {
    const response = await fetch(`/api/lists?action=getCreatorsForList&listId=${listId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get creators: ${response.statusText}`);
    }

    return response.json();
  },

  async renameList(listId: string, name: string): Promise<void> {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'renameList', listId, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to rename list');
    }
  },

  async softDeleteLists(listIds: string[]): Promise<void> {
    if (!listIds.length) return;

    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'softDeleteLists', listIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete lists');
    }
  },

  async getAvailableTags(): Promise<string[]> {
    const response = await fetch('/api/lists?action=getAvailableTags', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get tags: ${response.statusText}`);
    }

    return response.json();
  },

  async createTag(name: string): Promise<{ id: string; name: string }> {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'createTag', name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create tag');
    }

    return response.json();
  },

  async getTagsForList(listId: string): Promise<string[]> {
    const response = await fetch(`/api/lists?action=getTagsForList&listId=${listId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get tags for list: ${response.statusText}`);
    }

    return response.json();
  },

  async setTagsForList(listId: string, tagNames: string[]): Promise<void> {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'setTagsForList', listId, tagNames }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set tags');
    }
  },

  async renameTag(oldName: string, newName: string): Promise<void> {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'renameTag', oldName, newName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to rename tag');
    }
  },

  async unlinkTagFromList(listId: string, tagName: string): Promise<void> {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'unlinkTagFromList', listId, tagName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unlink tag');
    }
  },

  async deleteTag(name: string): Promise<void> {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'deleteTag', name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete tag');
    }
  },

  async updateCreatorPrice(listId: string, creatorId: string, price: number | null): Promise<void> {
    const response = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'updateCreatorPrice', listId, creatorId, price }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update price');
    }
  },
};
