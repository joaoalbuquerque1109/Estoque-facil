"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, User as UserIcon, UsersRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUsers, updateUserRole } from "@/lib/firestore";
import type { User } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function UsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userRole, loading: authLoading } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdatingRoleFor, setIsUpdatingRoleFor] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && userRole !== "Admin") {
      toast({
        title: "Acesso negado",
        description: "Somente administradores podem gerenciar usuarios.",
        variant: "destructive",
      });
      router.replace("/dashboard");
    }
  }, [authLoading, router, toast, userRole]);

  const fetchProfiles = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const profiles = await getUsers();
      setUsers(profiles);
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar a tabela profiles.";

      toast({
        title: "Erro ao carregar usuarios",
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (userRole === "Admin") {
      void fetchProfiles();
    }
  }, [fetchProfiles, userRole]);

  const handleRoleChange = async (targetUser: User, newRole: "Admin" | "Operator") => {
    if (targetUser.role === newRole) {
      return;
    }

    setIsUpdatingRoleFor(targetUser.uid);

    try {
      await updateUserRole(targetUser.uid, newRole);

      setUsers((current) =>
        current.map((item) => (item.uid === targetUser.uid ? { ...item, role: newRole } : item))
      );

      toast({
        title: "Permissao atualizada",
        description: `${targetUser.email} agora possui role ${newRole}.`,
        variant: "success",
      });
    } catch (error) {
      const description =
        error instanceof Error
          ? error.message
          : "Nao foi possivel alterar a role selecionada.";

      toast({
        title: "Falha ao atualizar role",
        description,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRoleFor(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userRole !== "Admin") {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">
          Visualize e altere as roles da tabela <code>profiles</code>.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              Perfis cadastrados
            </CardTitle>
            <CardDescription>
              Apenas usuarios com role <code>Admin</code> podem acessar esta pagina.
            </CardDescription>
          </div>
          <Badge variant="secondary">{users.length} usuario(s)</Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[220px]">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Nenhum perfil encontrado na tabela profiles.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((profile) => {
                    const isCurrentUser = profile.uid === user?.id;
                    const isUpdating = isUpdatingRoleFor === profile.uid;

                    return (
                      <TableRow key={profile.uid}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{profile.email}</span>
                            {isCurrentUser ? (
                              <span className="text-xs text-muted-foreground">Usuario atual</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={profile.role}
                            disabled={isUpdating}
                            onValueChange={(value: "Admin" | "Operator") =>
                              void handleRoleChange(profile, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Admin">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-red-600" />
                                  Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="Operator">
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-4 w-4" />
                                  Operator
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
