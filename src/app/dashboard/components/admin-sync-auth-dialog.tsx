
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AdminSyncAuthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAuthSuccess: (credential: any) => void;
}

export function AdminSyncAuthDialog({ isOpen, onOpenChange, onAuthSuccess }: AdminSyncAuthDialogProps) {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    
    try {
      // Check if user is admin
      if (userRole !== 'Admin') {
        toast({
            title: "Authentication Failed",
            description: "Only admin users can sync the spreadsheet.",
            variant: "destructive",
        });
        setIsAuthenticating(false);
        onOpenChange(false);
        return
      }

      // Emit success with user info
      onAuthSuccess({ user: user });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
        setIsAuthenticating(false);
    }
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Administrative Authentication</DialogTitle>
          <DialogDescription>
            Permission from an administrator is required to sync the spreadsheet.
            Only admin users can perform this action.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <p className="text-sm text-muted-foreground">
                Your current role: <strong>{userRole || 'None'}</strong>
            </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleGoogleSignIn} disabled={isAuthenticating || userRole !== 'Admin'}>
            {isAuthenticating ? "Authenticating..." : "Authorize"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
