"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createExitRequest, finalizeExit } from "@/lib/firestore";
import type { Product } from "@/lib/firestore";
import { downloadResponsibilityTermPdf } from "@/lib/responsibility-term";
import { ItemSearch } from "../../components/item-search";
import { useAuth } from "@/contexts/AuthContext";

type RequestedItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  patrimony: string;
};

export default function ResponsibilityRequestForm() {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const isAdmin = userRole === "Admin";

  const [responsibilityDate, setResponsibilityDate] = React.useState<Date | undefined>(new Date());
  const [responsibleName, setResponsibleName] = React.useState("");
  const [responsibleId, setResponsibleId] = React.useState("");
  const [projectDescription, setProjectDescription] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [requestedItems, setRequestedItems] = React.useState<RequestedItem[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<Product | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
  const [isTermAccepted, setIsTermAccepted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [department, setDepartment] = React.useState("");

  const handleAddItem = () => {
    if (!selectedItem) {
      toast({
        title: "Erro",
        description: "Por favor, busque e selecione um item.",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Quantidade invalida",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (selectedItem.quantity < quantity) {
      toast({
        title: "Estoque insuficiente",
        description: `A quantidade solicitada (${quantity}) e maior que a disponivel (${selectedItem.quantity}).`,
        variant: "destructive",
      });
      return;
    }

    setRequestedItems((prev) => {
      const existing = prev.find((item) => item.id === selectedItem.id);

      if (existing) {
        const newQuantity = existing.quantity + quantity;

        if (selectedItem.quantity < newQuantity) {
          toast({
            title: "Estoque insuficiente",
            description: `A quantidade total solicitada (${newQuantity}) e maior que a disponivel (${selectedItem.quantity}).`,
            variant: "destructive",
          });
          return prev;
        }

        return prev.map((item) =>
          item.id === selectedItem.id ? { ...item, quantity: newQuantity } : item
        );
      }

      return [
        ...prev,
        {
          id: selectedItem.id,
          name: selectedItem.name,
          quantity,
          unit: selectedItem.unit,
          patrimony: selectedItem.patrimony,
        },
      ];
    });

    setSelectedItem(null);
    setQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setRequestedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const validateForm = () => {
    if (requestedItems.length === 0) {
      toast({
        title: "Nenhum item adicionado",
        description: "Adicione pelo menos um item para continuar.",
        variant: "destructive",
      });
      return false;
    }

    if (!responsibleName || !responsibleId || !department) {
      toast({
        title: "Campos obrigatorios",
        description: "Preencha o nome, documento e setor do responsavel.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setResponsibilityDate(new Date());
    setResponsibleName("");
    setResponsibleId("");
    setDepartment("");
    setProjectDescription("");
    setRequestedItems([]);
    setSelectedItem(null);
    setQuantity(1);
    setIsTermAccepted(false);
  };

  const finalizeAsAdmin = async () => {
    await finalizeExit({
      items: requestedItems,
      date: responsibilityDate?.toISOString() || new Date().toISOString(),
      requester: `${responsibleName} (${responsibleId})`,
      department,
      purpose: projectDescription,
      responsible: `Responsavel:${responsibleName} Operador:${user?.email || "Desconhecido"}`,
    });

    downloadResponsibilityTermPdf({
      responsibleName,
      responsibleDocument: responsibleId,
      department,
      projectDescription,
      items: requestedItems,
      issueDate: new Date(),
    });
  };

  const submitAsOperator = async () => {
    await createExitRequest({
      requestType: "responsibility",
      items: requestedItems,
      requestDate: responsibilityDate?.toISOString() || new Date().toISOString(),
      requesterName: responsibleName,
      requesterDocument: responsibleId,
      responsibleName,
      responsibleDocument: responsibleId,
      department,
      purpose: projectDescription,
      submittedByEmail: user?.email || "Desconhecido",
    });
  };

  const handlePrimaryAction = () => {
    if (!validateForm()) {
      return;
    }

    if (isAdmin) {
      setIsTermAccepted(false);
      setIsConfirmDialogOpen(true);
      return;
    }

    void handleOperatorSubmit();
  };

  const handleOperatorSubmit = async () => {
    setIsSubmitting(true);

    try {
      await submitAsOperator();

      toast({
        title: "Solicitacao enviada",
        description: "O pedido foi enviado para aprovacao. O termo sera gerado pelo admin apos a aprovacao.",
        variant: "success",
      });

      resetForm();
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitacao",
        description:
          error instanceof Error ? error.message : "Nao foi possivel enviar a solicitacao.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!isTermAccepted) {
      toast({
        title: "Termo nao aceito",
        description: "Voce deve aceitar os termos para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await finalizeAsAdmin();

      toast({
        title: "Saida registrada e PDF gerado",
        description: "O termo de responsabilidade foi gerado com sucesso.",
        variant: "success",
      });

      setIsConfirmDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro ao finalizar saida",
        description:
          error instanceof Error ? error.message : "Nao foi possivel registrar a saida.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="responsibility-date" className="text-sm font-medium">
                  Data da solicitacao
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="responsibility-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !responsibilityDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {responsibilityDate ? format(responsibilityDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={responsibilityDate}
                      onSelect={setResponsibilityDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label htmlFor="responsible-name" className="text-sm font-medium">
                  Nome do responsavel
                </label>
                <Input id="responsible-name" value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="responsible-id" className="text-sm font-medium">
                  CPF do responsavel
                </label>
                <Input id="responsible-id" value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="department" className="text-sm font-medium">
                Setor
              </label>
              <Select onValueChange={setDepartment} value={department}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administracao">Administracao</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Recepcao">Recepcao</SelectItem>
                  <SelectItem value="Outro">Outros setores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="project-description" className="text-sm font-medium">
                Descricao de uso ou projeto
              </label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Itens sob responsabilidade</CardTitle>
                <div className="flex flex-col items-end gap-2 pt-4 md:flex-row">
                  <ItemSearch
                    onSelectItem={setSelectedItem}
                    materialType="permanente"
                    placeholder="Buscar item permanente..."
                    searchId="responsibility-search"
                  />
                  <div className="w-full md:w-24">
                    <label htmlFor="quantity-responsibility" className="text-sm font-medium">
                      Qtd.
                    </label>
                    <Input
                      id="quantity-responsibility"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <Button onClick={handleAddItem} className="w-full md:w-auto">
                    Adicionar
                  </Button>
                </div>
                {selectedItem ? (
                  <div className="mt-2 rounded-md bg-muted p-2 text-sm">
                    Item selecionado: <span className="font-medium">{selectedItem.name}</span> (Disponivel:{" "}
                    {selectedItem.quantity})
                  </div>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Nº Patrimonio</TableHead>
                        <TableHead className="w-[100px] text-right">Qtd</TableHead>
                        <TableHead className="w-[100px] text-center">Acao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requestedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhum item adicionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        requestedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.patrimony}</TableCell>
                            <TableCell className="text-right">{`${item.quantity} ${item.unit}`}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:bg-red-100"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              variant="accent"
              onClick={handlePrimaryAction}
              disabled={isSubmitting || requestedItems.length === 0}
            >
              {isSubmitting
                ? isAdmin
                  ? "Finalizando..."
                  : "Enviando..."
                : isAdmin
                  ? "Gerar termo e finalizar"
                  : "Enviar solicitacao"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar geracao de termo</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-sm">
            <p>Voce esta prestes a finalizar a saida e gerar o termo de responsabilidade em PDF.</p>
            <p className="mt-2 font-semibold">Responsavel: {responsibleName}</p>
            <p className="font-semibold">Setor: {department}</p>
          </div>
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="terms-pdf"
              checked={isTermAccepted}
              onCheckedChange={(checked) => setIsTermAccepted(checked as boolean)}
            />
            <Label htmlFor="terms-pdf">Declaro que os dados estao corretos e aceito os termos.</Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAdminConfirm} disabled={!isTermAccepted || isSubmitting}>
              {isSubmitting ? "Gerando PDF..." : "Confirmar e gerar PDF"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
