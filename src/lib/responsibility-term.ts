import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

type ResponsibilityTermItem = {
  name: string;
  patrimony?: string;
};

type ResponsibilityTermInput = {
  responsibleName: string;
  responsibleDocument: string;
  department: string;
  projectDescription?: string | null;
  items: ResponsibilityTermItem[];
  issueDate?: Date;
};

function buildResponsibilityTermPdf({
  responsibleName,
  responsibleDocument,
  department,
  projectDescription,
  items,
  issueDate = new Date(),
}: ResponsibilityTermInput) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TERMO DE RESPONSABILIDADE DE MATERIAIS PERMANENTES", pageWidth / 2, 20, {
    align: "center",
  });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const paragraphText = `Pelo presente termo, eu, ${responsibleName}, CPF ${responsibleDocument}, do setor ${department}, assumo a responsabilidade pelo recebimento e guarda dos materiais permanentes abaixo descritos, destinados ao uso exclusivo nas atividades institucionais.`;
  const splitText = doc.splitTextToSize(paragraphText, pageWidth - 40);
  doc.text(splitText, 20, 35);

  if (projectDescription) {
    const projectText = doc.splitTextToSize(`Descricao de uso/projeto: ${projectDescription}`, pageWidth - 40);
    doc.text(projectText, 20, 48);
  }

  const tableColumn = ["Nº Patrimonial", "Descrição do Bem", "Est. de Conservação", "Localização"];
  const tableRows = items.map((item) => [item.patrimony || "N/A", item.name, "Bom", department]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: projectDescription ? 60 : 55,
    theme: "grid",
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: "bold" },
  });

  const lastTableY = (doc as any).lastAutoTable.finalY;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Declaro estar ciente de que:", 20, lastTableY + 15);

  doc.setFont("helvetica", "normal");
  const declarations = [
    "• É vedada a utilização do bem para fins particulares;",
    "• Sou responsável pela guarda, conservação e uso adequado;",
    "• Em caso de extravio, dano ou mau uso, devo comunicar imediatamente ao setor competente;",
    "• Este termo deverá ser renovado em caso de transferência de setor, baixa patrimonial ou substituição do bem.",
  ];

  declarations.forEach((line, index) => {
    doc.text(line, 22, lastTableY + 22 + index * 6);
  });

  const dateText = `Local e Data: __________________, ${format(issueDate, "dd/MM/yyyy", { locale: ptBR })}`;
  doc.text(dateText, 20, lastTableY + 55);

  const signatureY = pageHeight - 50;
  doc.text("_______________________________", 20, signatureY);
  doc.text("Assinatura do Responsável pelo Setor", 22, signatureY + 5);

  doc.text("_______________________________", pageWidth - 95, signatureY);
  doc.text("Assinatura do Servidor Responsável", pageWidth - 93, signatureY + 5);

  doc.text("_______________________________", pageWidth / 2, signatureY + 20, { align: "center" });
  doc.text("Assinatura do Almoxarife/Patrimônio", pageWidth / 2, signatureY + 25, { align: "center" });

  return doc;
}

function getTermFileName(responsibleName: string, issueDate: Date) {
  return `Termo_Resp_${responsibleName.replace(/\s+/g, "_")}_${issueDate.toISOString().slice(0, 10)}.pdf`;
}

export function downloadResponsibilityTermPdf(input: ResponsibilityTermInput) {
  const issueDate = input.issueDate ?? new Date();
  const doc = buildResponsibilityTermPdf({ ...input, issueDate });
  doc.save(getTermFileName(input.responsibleName, issueDate));
}

export function openResponsibilityTermPdf(input: ResponsibilityTermInput) {
  const issueDate = input.issueDate ?? new Date();
  const doc = buildResponsibilityTermPdf({ ...input, issueDate });
  const blobUrl = doc.output("bloburl");
  window.open(blobUrl, "_blank", "noopener,noreferrer");
}
