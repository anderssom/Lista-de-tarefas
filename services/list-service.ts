import { supabase } from "@/lib/supabase"

export type TodoItem = {
  id: string
  text: string
  completed: boolean
  list_id: string
  user_id: string
  created_at?: string
}

export type TodoList = {
  id: string
  name: string
  user_id: string
  created_at?: string
  items?: TodoItem[]
}

export const listService = {
  // Get all lists for a user
  async getLists(userId: string): Promise<TodoList[]> {
    const { data, error } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching lists:", error)
      return []
    }

    return data || []
  },

  // Get a single list with its items
  async getListWithItems(listId: string): Promise<TodoList | null> {
    // Get the list
    const { data: list, error: listError } = await supabase.from("lists").select("*").eq("id", listId).single()

    if (listError) {
      console.error("Error fetching list:", listError)
      return null
    }

    // Get the items for this list
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: true })

    if (itemsError) {
      console.error("Error fetching items:", itemsError)
      return list
    }

    return {
      ...list,
      items: items || [],
    }
  },

  // Create a new list
  async createList(name: string, userId: string): Promise<TodoList | null> {
    const { data, error } = await supabase
      .from("lists")
      .insert([{ name, user_id: userId }])
      .select()
      .single()

    if (error) {
      console.error("Error creating list:", error)
      return null
    }

    return data
  },

  // Update a list
  async updateList(listId: string, name: string): Promise<boolean> {
    const { error } = await supabase.from("lists").update({ name }).eq("id", listId)

    if (error) {
      console.error("Error updating list:", error)
      return false
    }

    return true
  },

  // Delete a list
  async deleteList(listId: string): Promise<boolean> {
    // First delete all items in the list
    const { error: itemsError } = await supabase.from("items").delete().eq("list_id", listId)

    if (itemsError) {
      console.error("Error deleting items:", itemsError)
      return false
    }

    // Then delete the list
    const { error } = await supabase.from("lists").delete().eq("id", listId)

    if (error) {
      console.error("Error deleting list:", error)
      return false
    }

    return true
  },

  // Add an item to a list
  async addItem(text: string, listId: string, userId: string): Promise<TodoItem | null> {
    const { data, error } = await supabase
      .from("items")
      .insert([
        {
          text,
          list_id: listId,
          user_id: userId,
          completed: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error adding item:", error)
      return null
    }

    return data
  },

  // Update an item
  async updateItem(itemId: string, updates: Partial<TodoItem>): Promise<boolean> {
    const { error } = await supabase.from("items").update(updates).eq("id", itemId)

    if (error) {
      console.error("Error updating item:", error)
      return false
    }

    return true
  },

  // Delete an item
  async deleteItem(itemId: string): Promise<boolean> {
    const { error } = await supabase.from("items").delete().eq("id", itemId)

    if (error) {
      console.error("Error deleting item:", error)
      return false
    }

    return true
  },
}

