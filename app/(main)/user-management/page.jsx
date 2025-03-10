"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  createUser, 
  listUsers, 
  editUser, 
  deleteUser 
} from "@/utils/auth-apis";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Users, DotsThree, Pencil, Trash } from "@phosphor-icons/react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function UserManagement({ className, ...props }) {
  const [createFormData, setCreateFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    company: "",
    designation: "",
    roles: "user",
  });
  const [editFormData, setEditFormData] = useState({
    _id: "",
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    company: "",
    designation: "",
    roles: "user",
  });
  const [users, setUsers] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateInputChange = (e) => {
    const { id, value } = e.target;
    setCreateFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleEditInputChange = (e) => {
    const { id, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreateRoleChange = (value) => {
    setCreateFormData((prev) => ({ ...prev, roles: value }));
  };

  const handleEditRoleChange = (value) => {
    setEditFormData((prev) => ({ ...prev, roles: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      !createFormData.firstname ||
      !createFormData.lastname ||
      !createFormData.email ||
      !createFormData.roles
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      setIsLoading(false);
      return;
    }

    try {
      await createUser(createFormData);
      toast({
        title: "Success",
        description: "User created successfully! Invitation sent.",
      });
      setCreateFormData({
        firstname: "",
        lastname: "",
        phone: "",
        email: "",
        company: "",
        designation: "",
        roles: "user",
      });
      setIsCreateDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.error || "Failed to create user",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      !editFormData.firstname ||
      !editFormData.lastname ||
      !editFormData.email ||
      !editFormData.roles
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      setIsLoading(false);
      return;
    }

    try {
      await editUser(editFormData._id, editFormData);
      toast({
        title: "Success",
        description: "User updated successfully!",
      });
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.error || "Failed to update user",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsLoading(true);
    try {
      await deleteUser(userToDelete._id);
      toast({
        title: "Success",
        description: "User deleted successfully!",
      });
      setIsDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.error || "Failed to delete user",
      });
    } finally {
      setIsLoading(false);
      setUserToDelete(null);
    }
  };

  const openEditDialog = (user) => {
    setEditFormData({ ...user });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await listUsers({ page: 1, limit: 100 });
      setUsers(response.users);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.error || "Failed to fetch users",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading && users.length === 0) {
    return (
      <div className="mx-auto container">
        <Card className="w-full rounded-lg h-full">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Users className="text-primary" size={20} weight="duotone" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="animate-pulse">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto container", className)} {...props}>
      <Card className="w-full rounded-lg h-full">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Users className="text-primary" size={20} weight="duotone" />
              User Management
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {users.length} users shown
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 bg-primary hover:bg-primary/90 flex items-center gap-2">
                  <Plus size={16} weight="duotone" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px] rounded-xl shadow-xl">
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-semibold text-primary">
                    Create New User
                  </DialogTitle>
                </DialogHeader>
                <form className="space-y-6 py-4" onSubmit={handleCreateSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstname">First Name *</Label>
                      <Input
                        id="firstname"
                        type="text"
                        placeholder="John"
                        value={createFormData.firstname}
                        onChange={handleCreateInputChange}
                        required
                        disabled={isLoading}
                        className="h-10 rounded-lg border-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname">Last Name *</Label>
                      <Input
                        id="lastname"
                        type="text"
                        placeholder="Doe"
                        value={createFormData.lastname}
                        onChange={handleCreateInputChange}
                        required
                        disabled={isLoading}
                        className="h-10 rounded-lg border-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={createFormData.email}
                        onChange={handleCreateInputChange}
                        required
                        disabled={isLoading}
                        className="h-10 rounded-lg border-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={createFormData.phone}
                        onChange={handleCreateInputChange}
                        disabled={isLoading}
                        className="h-10 rounded-lg border-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="Example Inc."
                        value={createFormData.company}
                        onChange={handleCreateInputChange}
                        disabled={isLoading}
                        className="h-10 rounded-lg border-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Input
                        id="designation"
                        type="text"
                        placeholder="Software Engineer"
                        value={createFormData.designation}
                        onChange={handleCreateInputChange}
                        disabled={isLoading}
                        className="h-10 rounded-lg border-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roles">Role *</Label>
                      <Select
                        value={createFormData.roles}
                        onValueChange={handleCreateRoleChange}
                        required
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-10 bg-background/50">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="mt-6 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="rounded-lg border-muted/30 hover:bg-muted/10"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-lg bg-primary hover:bg-primary/90 transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating..." : "Create User"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-2 overflow-hidden rounded-b-lg">
          <div className="[&>div]:max-h-96">
            <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
              <TableHeader className="bg-background/90 sticky top-0 z-10 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id} className="hover:bg-muted/10">
                      <TableCell className="font-medium">{`${user.firstname} ${user.lastname}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.company || "-"}</TableCell>
                      <TableCell>{user.designation || "-"}</TableCell>
                      <TableCell>{user.roles.join(", ")}</TableCell>
                      <TableCell className="text-right">
                        {user.isEmailVerified ? "Active" : "Pending"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <DotsThree className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => openEditDialog(user)}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(user)}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {users.length} users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-xl shadow-xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-primary">
              Edit User
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-6 py-4" onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name *</Label>
                <Input
                  id="firstname"
                  type="text"
                  placeholder="John"
                  value={editFormData.firstname}
                  onChange={handleEditInputChange}
                  required
                  disabled={isLoading}
                  className="h-10 rounded-lg border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name *</Label>
                <Input
                  id="lastname"
                  type="text"
                  placeholder="Doe"
                  value={editFormData.lastname}
                  onChange={handleEditInputChange}
                  required
                  disabled={isLoading}
                  className="h-10 rounded-lg border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  required
                  disabled={isLoading}
                  className="h-10 rounded-lg border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={editFormData.phone}
                  onChange={handleEditInputChange}
                  disabled={isLoading}
                  className="h-10 rounded-lg border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Example Inc."
                  value={editFormData.company}
                  onChange={handleEditInputChange}
                  disabled={isLoading}
                  className="h-10 rounded-lg border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  type="text"
                  placeholder="Software Engineer"
                  value={editFormData.designation}
                  onChange={handleEditInputChange}
                  disabled={isLoading}
                  className="h-10 rounded-lg border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roles">Role *</Label>
                <Select
                  value={editFormData.roles}
                  onValueChange={handleEditRoleChange}
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-10 bg-background/50">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="rounded-lg border-muted/30 hover:bg-muted/10"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-lg bg-primary hover:bg-primary/90 transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              {userToDelete && ` "${userToDelete.firstname} ${userToDelete.lastname}"
              from the system`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}