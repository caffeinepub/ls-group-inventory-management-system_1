import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type User, type UserRole, useAuth } from "@/contexts/AuthContext";
import { Ban, KeyRound, Lock, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function UserManagementTab() {
  const {
    users,
    currentUser,
    addUser,
    deleteUser,
    blockUser,
    unblockUser,
    changeCredentials,
  } = useAuth();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("staff");
  const [formError, setFormError] = useState("");

  // Change credentials dialog state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState("");

  // Change password only dialog state
  const [pwUser, setPwUser] = useState<User | null>(null);
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const ok = addUser(newUsername.trim(), newPassword, newRole);
    if (!ok) {
      setFormError("Username already exists.");
      return;
    }
    setNewUsername("");
    setNewPassword("");
    setNewRole("staff");
    toast.success(
      `User "${newUsername.trim().toLowerCase()}" added successfully.`,
    );
  };

  const handleDelete = (username: string) => {
    deleteUser(username);
    toast.success(`User "${username}" removed.`);
  };

  const handleToggleBlock = (user: User) => {
    if (user.blocked) {
      unblockUser(user.username);
      toast.success(`User "${user.username}" has been unblocked.`);
    } else {
      blockUser(user.username);
      toast.success(`User "${user.username}" has been blocked.`);
    }
  };

  const openEditDialog = (user: User) => {
    setEditUser(user);
    setEditUsername(user.username);
    setEditPassword("");
    setEditError("");
  };

  const handleChangeCredentials = () => {
    if (!editUser) return;
    setEditError("");
    if (!editUsername.trim()) {
      setEditError("Username cannot be empty.");
      return;
    }
    if (!editPassword.trim()) {
      setEditError("Password cannot be empty.");
      return;
    }
    const ok = changeCredentials(
      editUser.username,
      editUsername.trim(),
      editPassword,
    );
    if (!ok) {
      setEditError("Username already taken by another user.");
      return;
    }
    toast.success(
      `Credentials updated for "${editUsername.trim().toLowerCase()}".`,
    );
    setEditUser(null);
  };

  const openPasswordDialog = (user: User) => {
    setPwUser(user);
    setPwNew("");
    setPwConfirm("");
    setPwError("");
  };

  const handleChangePassword = () => {
    if (!pwUser) return;
    setPwError("");
    if (!pwNew.trim()) {
      setPwError("New password cannot be empty.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("Passwords do not match.");
      return;
    }
    // Keep same username, only change password
    const ok = changeCredentials(pwUser.username, pwUser.username, pwNew);
    if (!ok) {
      setPwError("Failed to update password. Please try again.");
      return;
    }
    toast.success(`Password updated for "${pwUser.username}".`);
    setPwUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Add User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="w-4 h-4" />
            Add New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 min-w-[160px]">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                data-ocid="usermgmt.input"
                placeholder="e.g. ramesh"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1 min-w-[160px]">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                data-ocid="usermgmt.input"
                type="password"
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1 min-w-[140px]">
              <Label>Role</Label>
              <Select
                value={newRole}
                onValueChange={(v) => setNewRole(v as UserRole)}
              >
                <SelectTrigger data-ocid="usermgmt.select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button data-ocid="usermgmt.submit_button" type="submit">
              Add User
            </Button>
          </form>
          {formError && (
            <p
              data-ocid="usermgmt.error_state"
              className="text-sm text-destructive mt-2"
            >
              {formError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table data-ocid="usermgmt.table">
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, idx) => (
                <TableRow
                  key={user.username}
                  data-ocid={`usermgmt.item.${idx + 1}`}
                  className={user.blocked ? "opacity-60 bg-red-50" : ""}
                >
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.role === "admin"
                          ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                          : "border-blue-400 text-blue-700 bg-blue-50"
                      }
                    >
                      {user.role === "admin" ? "Admin" : "Staff"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.blocked ? (
                      <Badge
                        variant="outline"
                        className="border-red-400 text-red-600 bg-red-50"
                      >
                        Blocked
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-green-400 text-green-600 bg-green-50"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Change Password */}
                      <Button
                        data-ocid={`usermgmt.edit_button.${idx + 1}`}
                        variant="ghost"
                        size="sm"
                        title="Change password"
                        onClick={() => openPasswordDialog(user)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Lock className="w-4 h-4" />
                      </Button>
                      {/* Change Credentials (username + password) */}
                      <Button
                        data-ocid={`usermgmt.secondary_button.${idx + 1}`}
                        variant="ghost"
                        size="sm"
                        title="Change credentials (username & password)"
                        onClick={() => openEditDialog(user)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      {/* Block / Unblock */}
                      <Button
                        data-ocid={`usermgmt.toggle.${idx + 1}`}
                        variant="ghost"
                        size="sm"
                        title={user.blocked ? "Unblock user" : "Block user"}
                        disabled={user.username === currentUser?.username}
                        onClick={() => handleToggleBlock(user)}
                        className={
                          user.blocked
                            ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                            : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        }
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                      {/* Delete */}
                      <Button
                        data-ocid={`usermgmt.delete_button.${idx + 1}`}
                        variant="ghost"
                        size="sm"
                        title="Delete user"
                        disabled={user.username === currentUser?.username}
                        onClick={() => handleDelete(user.username)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog
        open={!!pwUser}
        onOpenChange={(open) => {
          if (!open) setPwUser(null);
        }}
      >
        <DialogContent data-ocid="usermgmt.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password — {pwUser?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="pw-new">New Password</Label>
              <Input
                id="pw-new"
                data-ocid="usermgmt.input"
                type="password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pw-confirm">Confirm Password</Label>
              <Input
                id="pw-confirm"
                data-ocid="usermgmt.input"
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            {pwError && (
              <p
                data-ocid="usermgmt.error_state"
                className="text-sm text-destructive"
              >
                {pwError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              data-ocid="usermgmt.cancel_button"
              variant="outline"
              onClick={() => setPwUser(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="usermgmt.save_button"
              onClick={handleChangePassword}
            >
              Save Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Credentials Dialog */}
      <Dialog
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
      >
        <DialogContent data-ocid="usermgmt.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Change Credentials — {editUser?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="edit-username">New Username</Label>
              <Input
                id="edit-username"
                data-ocid="usermgmt.input"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Enter new username"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-password">New Password</Label>
              <Input
                id="edit-password"
                data-ocid="usermgmt.input"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            {editError && (
              <p
                data-ocid="usermgmt.error_state"
                className="text-sm text-destructive"
              >
                {editError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              data-ocid="usermgmt.cancel_button"
              variant="outline"
              onClick={() => setEditUser(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="usermgmt.save_button"
              onClick={handleChangeCredentials}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
