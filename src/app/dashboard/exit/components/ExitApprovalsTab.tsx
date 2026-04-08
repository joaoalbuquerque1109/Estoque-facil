"use client";

import * as React from "react";
import { Check, Eye, Loader2, Printer, X } from "lucide-react";
import { approveExitRequest, completeExitRequest, getExitRequests, rejectExitRequest } from "@/lib/firestore";
import type { ExitRequest } from "@/lib/firestore";
import { openResponsibilityTermPdf } from "@/lib/responsibility-term";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ExitApprovalsTabProps = {
  adminEmail: string;
};

function getStatusBadgeVariant(status: ExitRequest["status"]) {
  if (status === "completed") {
    return "default";
  }

  if (status === "rejected") {
    return "destructive";
  }

  if (status === "approved") {
    return "secondary";
  }

  return "outline";
}

export default function ExitApprovalsTab({ adminEmail }: ExitApprovalsTabProps) {
  const { toast } = useToast();
  const [requests, setRequests] = React.useState<ExitRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const loadRequests = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getExitRequests();
      setRequests(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar solicitacoes",
        description:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as solicitacoes de saida.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleApprove = async (request: ExitRequest) => {
    setProcessingId(request.id);

    try {
      await approveExitRequest(request.id, adminEmail);

      toast({
        title: "Solicitacao aprovada",
        description: "Agora o botao de gerar termo esta liberado para concluir a saida.",
        variant: "success",
      });

      await loadRequests();
    } catch (error) {
      toast({
        title: "Falha ao aprovar",
        description:
          error instanceof Error ? error.message : "Nao foi possivel aprovar a solicitacao.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateTerm = async (request: ExitRequest) => {
    setProcessingId(request.id);

    try {
      const completedRequest = await completeExitRequest(request.id, adminEmail);

      openResponsibilityTermPdf({
        responsibleName: completedRequest.responsibleName,
        responsibleDocument: completedRequest.responsibleDocument,
        department: completedRequest.department,
        projectDescription: completedRequest.purpose,
        items: completedRequest.items,
        issueDate: completedRequest.finalizedAt ? new Date(completedRequest.finalizedAt) : new Date(),
      });

      toast({
        title: "Termo gerado e saida confirmada",
        description: "O estoque foi atualizado com a conclusao da solicitacao.",
        variant: "success",
      });

      await loadRequests();
    } catch (error) {
      toast({
        title: "Falha ao gerar termo",
        description:
          error instanceof Error ? error.message : "Nao foi possivel concluir a solicitacao.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewTerm = (request: ExitRequest) => {
    openResponsibilityTermPdf({
      responsibleName: request.responsibleName,
      responsibleDocument: request.responsibleDocument,
      department: request.department,
      projectDescription: request.purpose,
      items: request.items,
      issueDate: request.finalizedAt ? new Date(request.finalizedAt) : new Date(),
    });
  };

  const handleReject = async (request: ExitRequest) => {
    setProcessingId(request.id);

    try {
      await rejectExitRequest(request.id, adminEmail);

      toast({
        title: "Solicitacao rejeitada",
        description: "A solicitacao de saida foi marcada como rejeitada.",
        variant: "success",
      });

      await loadRequests();
    } catch (error) {
      toast({
        title: "Falha ao rejeitar",
        description:
          error instanceof Error ? error.message : "Nao foi possivel rejeitar a solicitacao.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aprovacoes de saida</CardTitle>
        <CardDescription>
          Aprovacoes liberam a impressao do termo. O estoque so e atualizado quando o termo e gerado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solicitante</TableHead>
                <TableHead>Responsavel</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="w-[280px] text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Carregando solicitacoes...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma solicitacao encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => {
                  const isPending = request.status === "pending";
                  const isApproved = request.status === "approved";
                  const isCompleted = request.status === "completed";
                  const isProcessing = processingId === request.id;

                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{request.requesterName}</span>
                          <span className="text-xs text-muted-foreground">
                            CPF: {request.requesterDocument} | enviado por {request.submittedByEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{request.responsibleName}</span>
                          <span className="text-xs text-muted-foreground">
                            CPF: {request.responsibleDocument}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{request.department}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                      </TableCell>
                      <TableCell>{request.items.length}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isPending ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => void handleApprove(request)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleReject(request)}
                                disabled={isProcessing}
                              >
                                <X className="h-4 w-4" />
                                Rejeitar
                              </Button>
                            </>
                          ) : null}

                          {isApproved ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleGenerateTerm(request)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Printer className="h-4 w-4" />
                              )}
                              Gerar termo
                            </Button>
                          ) : null}

                          {isCompleted ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTerm(request)}
                            >
                              <Eye className="h-4 w-4" />
                              Visualizar termo
                            </Button>
                          ) : null}
                        </div>
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
  );
}
