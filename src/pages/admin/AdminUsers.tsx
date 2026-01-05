import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Plus, Trash2, Loader2, Search } from "lucide-react";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email: string;
}

interface ProfileResult {
  id: string;
  email: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileResult | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<AdminUser | null>(null);

  // Fetch all admin users
  const { data: adminUsers, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all admin roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role", "admin")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Get profile emails for each admin
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Merge the data
      const admins: AdminUser[] = roles.map((role) => {
        const profile = profiles.find((p) => p.id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role,
          created_at: role.created_at,
          email: profile?.email || "Unknown",
        };
      });

      return admins;
    },
  });

  // Search for users by email
  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    
    setIsSearching(true);
    setSelectedUser(null);
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", `%${searchEmail}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Could not search for users.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add admin mutation
  const addAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Check if user already has admin role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (existing) {
        throw new Error("User is already an admin");
      }

      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsAddDialogOpen(false);
      setSearchEmail("");
      setSearchResults([]);
      setSelectedUser(null);
      toast({
        title: "Admin added",
        description: "The user has been granted admin access.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add admin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRemoveDialogOpen(false);
      setUserToRemove(null);
      toast({
        title: "Admin removed",
        description: "Admin access has been revoked.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to remove admin",
        description: "Could not remove admin access.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveClick = (adminUser: AdminUser) => {
    if (adminUser.user_id === user?.id) {
      toast({
        title: "Cannot remove yourself",
        description: "You cannot revoke your own admin access.",
        variant: "destructive",
      });
      return;
    }

    if (adminUsers && adminUsers.length <= 1) {
      toast({
        title: "Cannot remove last admin",
        description: "There must be at least one admin user.",
        variant: "destructive",
      });
      return;
    }

    setUserToRemove(adminUser);
    setRemoveDialogOpen(true);
  };

  return (
    <AdminLayout>
      <PageMeta title="Admin Users" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
            <p className="text-muted-foreground">
              Manage who has admin access to the platform.
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Admin</DialogTitle>
                <DialogDescription>
                  Search for an existing user by email to grant admin access.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by email..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button 
                    variant="secondary" 
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Select a user:</p>
                    {searchResults.map((profile) => {
                      const isAlreadyAdmin = adminUsers?.some(
                        (a) => a.user_id === profile.id
                      );
                      return (
                        <button
                          key={profile.id}
                          onClick={() => !isAlreadyAdmin && setSelectedUser(profile)}
                          disabled={isAlreadyAdmin}
                          className={`w-full rounded-lg border p-3 text-left transition-colors ${
                            selectedUser?.id === profile.id
                              ? "border-primary bg-primary/10"
                              : isAlreadyAdmin
                              ? "cursor-not-allowed border-border bg-muted opacity-50"
                              : "border-border hover:border-primary/50 hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {profile.email}
                            </span>
                            {isAlreadyAdmin && (
                              <span className="text-xs text-muted-foreground">
                                Already admin
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {searchResults.length === 0 && searchEmail && !isSearching && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No users found. Make sure the email is registered.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedUser && addAdminMutation.mutate(selectedUser.id)}
                  disabled={!selectedUser || addAdminMutation.isPending}
                >
                  {addAdminMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Grant Admin Access
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Admin Users Table */}
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : adminUsers && adminUsers.length > 0 ? (
                adminUsers.map((adminUser) => (
                  <TableRow key={adminUser.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        {adminUser.email}
                        {adminUser.user_id === user?.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(adminUser.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveClick(adminUser)}
                        disabled={
                          adminUser.user_id === user?.id ||
                          removeAdminMutation.isPending
                        }
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No admin users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access from{" "}
              <strong>{userToRemove?.email}</strong>? They will no longer be able
              to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToRemove && removeAdminMutation.mutate(userToRemove.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeAdminMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
