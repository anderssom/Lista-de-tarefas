"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusCircle, ListPlus, Edit, Trash2, MoreVertical, Check, X, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { listService, type TodoList, type TodoItem } from "@/services/list-service"

export default function ListApp() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  const [lists, setLists] = useState<TodoList[]>([])
  const [activeListId, setActiveListId] = useState<string>("")
  const [activeList, setActiveList] = useState<TodoList | null>(null)
  const [newItem, setNewItem] = useState("")
  const [newListName, setNewListName] = useState("")
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editingListName, setEditingListName] = useState("")
  const [deleteListId, setDeleteListId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemText, setEditingItemText] = useState("")
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isLoading2, setIsLoading2] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Load lists from Supabase
  useEffect(() => {
    const fetchLists = async () => {
      if (user) {
        setIsLoading2(true)
        const fetchedLists = await listService.getLists(user.id)
        setLists(fetchedLists)

        // Set active list to the first list if it exists
        if (fetchedLists.length > 0) {
          setActiveListId(fetchedLists[0].id)
        } else {
          // Create a default list if no lists exist
          const defaultList = await listService.createList("Minha Lista", user.id)
          if (defaultList) {
            setLists([defaultList])
            setActiveListId(defaultList.id)
          }
        }
        setIsLoading2(false)
      }
    }

    fetchLists()
  }, [user])

  // Load active list with items when activeListId changes
  useEffect(() => {
    const fetchActiveList = async () => {
      if (activeListId && user) {
        const list = await listService.getListWithItems(activeListId)
        setActiveList(list)
      }
    }

    fetchActiveList()
  }, [activeListId, user])

  const handleAddItem = async () => {
    if (newItem.trim() !== "" && user && activeListId) {
      const newItemObj = await listService.addItem(newItem, activeListId, user.id)

      if (newItemObj) {
        // Update the active list with the new item
        setActiveList((prev) => {
          if (!prev) return prev

          return {
            ...prev,
            items: [...(prev.items || []), newItemObj],
          }
        })
      }

      setNewItem("")
    }
  }

  const handleCreateList = async () => {
    if (newListName.trim() !== "" && user) {
      const newList = await listService.createList(newListName, user.id)

      if (newList) {
        setLists((prev) => [...prev, newList])
        setActiveListId(newList.id)
        setNewListName("")
        setIsCreatingList(false)
      }
    }
  }

  const startEditingList = (list: TodoList) => {
    setEditingListId(list.id)
    setEditingListName(list.name)
  }

  const saveEditingList = async () => {
    if (editingListName.trim() !== "" && editingListId) {
      const success = await listService.updateList(editingListId, editingListName)

      if (success) {
        // Update lists state
        setLists((prev) => prev.map((list) => (list.id === editingListId ? { ...list, name: editingListName } : list)))

        // Update active list if it's the one being edited
        if (activeList && activeList.id === editingListId) {
          setActiveList((prev) => (prev ? { ...prev, name: editingListName } : null))
        }
      }

      setEditingListId(null)
    }
  }

  const cancelEditingList = () => {
    setEditingListId(null)
  }

  const confirmDeleteList = (listId: string) => {
    setDeleteListId(listId)
  }

  const handleDeleteList = async () => {
    if (deleteListId) {
      const success = await listService.deleteList(deleteListId)

      if (success) {
        const newLists = lists.filter((list) => list.id !== deleteListId)
        setLists(newLists)

        // If we're deleting the active list, switch to another list
        if (deleteListId === activeListId) {
          if (newLists.length > 0) {
            setActiveListId(newLists[0].id)
          } else {
            setActiveList(null)
          }
        }
      }

      setDeleteListId(null)
    }
  }

  // Item operations
  const startEditingItem = (item: TodoItem) => {
    setEditingItemId(item.id)
    setEditingItemText(item.text)
  }

  const saveEditingItem = async () => {
    if (editingItemText.trim() !== "" && editingItemId && activeList) {
      const success = await listService.updateItem(editingItemId, { text: editingItemText })

      if (success) {
        // Update active list items
        setActiveList((prev) => {
          if (!prev || !prev.items) return prev

          return {
            ...prev,
            items: prev.items.map((item) => (item.id === editingItemId ? { ...item, text: editingItemText } : item)),
          }
        })
      }

      setEditingItemId(null)
    }
  }

  const cancelEditingItem = () => {
    setEditingItemId(null)
  }

  const confirmDeleteItem = (itemId: string) => {
    setDeleteItemId(itemId)
  }

  const handleDeleteItem = async () => {
    if (deleteItemId && activeList) {
      const success = await listService.deleteItem(deleteItemId)

      if (success) {
        // Update active list items
        setActiveList((prev) => {
          if (!prev || !prev.items) return prev

          return {
            ...prev,
            items: prev.items.filter((item) => item.id !== deleteItemId),
          }
        })
      }

      setDeleteItemId(null)
    }
  }

  const toggleItemCompletion = async (itemId: string, completed: boolean) => {
    if (activeList) {
      const success = await listService.updateItem(itemId, { completed: !completed })

      if (success) {
        // Update active list items
        setActiveList((prev) => {
          if (!prev || !prev.items) return prev

          return {
            ...prev,
            items: prev.items.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)),
          }
        })
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddItem()
    }
  }

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateList()
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEditingList()
    } else if (e.key === "Escape") {
      cancelEditingList()
    }
  }

  const handleEditItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEditingItem()
    } else if (e.key === "Escape") {
      cancelEditingItem()
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  // Sort items to show completed items at the bottom
  const sortedItems = activeList?.items
    ? [...activeList.items].sort((a, b) => {
        if (a.completed === b.completed) return 0
        return a.completed ? 1 : -1
      })
    : []

  // Show loading or redirect to login if not authenticated
  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 p-4 hidden md:block">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || "/placeholder.svg?height=32&width=32"} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>

          <Separator />

          <h2 className="text-xl font-bold">Minhas Listas</h2>

          {isLoading2 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Carregando listas...</div>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <div key={list.id} className="flex items-center">
                  {editingListId === list.id ? (
                    <div className="flex items-center space-x-1 w-full">
                      <Input
                        value={editingListName}
                        onChange={(e) => setEditingListName(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        autoFocus
                        className="h-8"
                      />
                      <Button size="icon" variant="ghost" onClick={saveEditingList} className="h-8 w-8">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEditingList} className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant={list.id === activeListId ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveListId(list.id)}
                      >
                        {list.name}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Opções</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditingList(list)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => confirmDeleteList(list.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {isCreatingList ? (
            <div className="space-y-2">
              <Input
                placeholder="Nome da nova lista"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleListKeyDown}
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleCreateList}>
                  Criar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsCreatingList(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setIsCreatingList(true)}>
              <ListPlus className="h-4 w-4 mr-2" />
              Nova Lista
            </Button>
          )}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        {/* Mobile sidebar toggle button */}
        <Button
          variant="outline"
          className="fixed bottom-4 left-4 z-10 rounded-full p-3 h-auto"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          <ListPlus className="h-6 w-6" />
        </Button>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile sidebar content */}
        <div
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-background p-4 border-r transform transition-transform duration-200 ease-in-out ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Minhas Listas</h2>
            <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col space-y-2 mb-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || "/placeholder.svg?height=32&width=32"} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>

          <Separator className="mb-4" />

          {isLoading2 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">Carregando listas...</div>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <div key={list.id} className="flex items-center">
                  {editingListId === list.id ? (
                    <div className="flex items-center space-x-1 w-full">
                      <Input
                        value={editingListName}
                        onChange={(e) => setEditingListName(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        autoFocus
                        className="h-8"
                      />
                      <Button size="icon" variant="ghost" onClick={saveEditingList} className="h-8 w-8">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEditingList} className="h-8 w-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant={list.id === activeListId ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveListId(list.id)
                          setMobileSidebarOpen(false)
                        }}
                      >
                        {list.name}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Opções</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditingList(list)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => confirmDeleteList(list.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {isCreatingList ? (
            <div className="space-y-2 mt-4">
              <Input
                placeholder="Nome da nova lista"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleListKeyDown}
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleCreateList}>
                  Criar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsCreatingList(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full mt-4" onClick={() => setIsCreatingList(true)}>
              <ListPlus className="h-4 w-4 mr-2" />
              Nova Lista
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{activeList?.name || "Lista"}</CardTitle>
            <CardDescription>Adicione itens à sua lista</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Digite um novo item..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button onClick={handleAddItem}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="border rounded-md">
                {isLoading2 ? (
                  <p className="p-4 text-center text-muted-foreground">Carregando itens...</p>
                ) : !activeList || !sortedItems.length ? (
                  <p className="p-4 text-center text-muted-foreground">Nenhum item na lista. Adicione um item acima.</p>
                ) : (
                  <ul className="divide-y">
                    {sortedItems.map((item) => (
                      <li key={item.id} className="p-3 hover:bg-muted/50">
                        {editingItemId === item.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={editingItemText}
                              onChange={(e) => setEditingItemText(e.target.value)}
                              onKeyDown={handleEditItemKeyDown}
                              autoFocus
                              className="h-8"
                            />
                            <Button size="icon" variant="ghost" onClick={saveEditingItem} className="h-8 w-8">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={cancelEditingItem} className="h-8 w-8">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`item-${item.id}`}
                                checked={item.completed}
                                onCheckedChange={() => toggleItemCompletion(item.id, item.completed)}
                              />
                              <label
                                htmlFor={`item-${item.id}`}
                                className={cn("cursor-pointer", item.completed && "line-through text-muted-foreground")}
                              >
                                {item.text}
                              </label>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Opções do item</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditingItem(item)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Alterar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => confirmDeleteItem(item.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Deletar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete List Confirmation Dialog */}
      <AlertDialog open={deleteListId !== null} onOpenChange={(open) => !open && setDeleteListId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a lista e todos os seus itens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

