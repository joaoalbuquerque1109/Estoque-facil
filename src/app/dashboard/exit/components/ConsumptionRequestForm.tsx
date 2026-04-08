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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { createExitRequest } from "@/lib/firestore";
import type { Product } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ItemSearch } from "../../components/item-search";

type RequestedItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

export default function ConsumptionRequestForm() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [requestDate, setRequestDate] = React.useState<Date | undefined>(new Date());
  const [requesterName, setRequesterName] = React.useState("");
  const [requesterDocument, setRequesterDocument] = React.useState("");
  const [responsibleName, setResponsibleName] = React.useState("");
  const [responsibleDocument, setResponsibleDocument] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [requestedItems, setRequestedItems] = React.useState<RequestedItem[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
        },
      ];
    });

    setSelectedItem(null);
    setQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setRequestedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const resetForm = () => {
    setRequestDate(new Date());
    setRequesterName("");
    setRequesterDocument("");
    setResponsibleName("");
    setResponsibleDocument("");
    setDepartment("");
    setPurpose("");
    setRequestedItems([]);
    setSelectedItem(null);
    setQuantity(1);
  };

  const handleSubmit = async () => {
    if (requestedItems.length === 0) {
      toast({
        title: "Nenhum item solicitado",
        description: "Adicione pelo menos um item para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!requesterName || !requesterDocument || !responsibleName || !responsibleDocument || !department) {
      toast({
        title: "Campos obrigatorios",
        description: "Preencha solicitante, responsavel, CPF e setor.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createExitRequest({
        requestType: "consumption",
        items: requestedItems,
        requestDate: requestDate?.toISOString() || new Date().toISOString(),
        requesterName,
        requesterDocument,
        responsibleName,
        responsibleDocument,
        department,
        purpose,
        submittedByEmail: user?.email || "Desconhecido",
      });

      toast({
        title: "Solicitacao enviada",
        description: "A requisicao foi enviada para aprovacao do administrador.",
        variant: "success",
      });

      resetForm();
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitacao",
        description:
          error instanceof Error
            ? error.message
            : "Nao foi possivel concluir a operacao. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="request-date" className="text-sm font-medium">
                Data da solicitacao
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="request-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !requestDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {requestDate ? format(requestDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={requestDate}
                    onSelect={setRequestDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label htmlFor="requester-name" className="text-sm font-medium">
                Nome do solicitante
              </label>
              <Input id="requester-name" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="requester-document" className="text-sm font-medium">
                CPF do solicitante
              </label>
              <Input
                id="requester-document"
                value={requesterDocument}
                onChange={(e) => setRequesterDocument(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="responsible-name" className="text-sm font-medium">
                Nome do responsavel
              </label>
              <Input
                id="responsible-name"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="responsible-document" className="text-sm font-medium">
                CPF do responsavel
              </label>
              <Input
                id="responsible-document"
                value={responsibleDocument}
                onChange={(e) => setResponsibleDocument(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="department" className="text-sm font-medium">
              Setor/Departamento
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
            <label htmlFor="purpose" className="text-sm font-medium">
              Finalidade de uso
            </label>
            <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Itens solicitados</CardTitle>
              <div className="flex flex-col items-end gap-2 pt-4 md:flex-row">
                <ItemSearch
                  onSelectItem={setSelectedItem}
                  materialType="consumo"
                  placeholder="Buscar item de consumo..."
                  searchId="consumption-search"
                />
                <div className="w-full md:w-24">
                  <label htmlFor="quantity-consumption" className="text-sm font-medium">
                    Qtd.
                  </label>
                  <Input
                    id="quantity-consumption"
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
                      <TableHead className="w-[100px] text-right">Qtd</TableHead>
                      <TableHead className="w-[100px] text-center">Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requestedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhum item solicitado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      requestedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
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
            onClick={handleSubmit}
            disabled={isSubmitting || requestedItems.length === 0}
          >
            {isSubmitting ? "Enviando..." : "Enviar solicitacao"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
